import { botSignatures } from "./botSignatures";
import type { CrawlerStore } from "./crawler-policy";

export const IDENTITY_SOURCES: Record<string, string> = {
  gptbot: "https://openai.com/gptbot.json",
  "oai-searchbot": "https://openai.com/searchbot.json",
  "chatgpt-user": "https://openai.com/chatgpt-user.json",
  perplexitybot: "https://www.perplexity.com/perplexitybot.json",
  "perplexity-user": "https://www.perplexity.com/perplexity-user.json",
};
export const IDENTITY_STATUSES = ["verified", "unverified", "unavailable", "unsupported"] as const;
export type IdentityStatus = (typeof IDENTITY_STATUSES)[number];
export const FEED_MAX_AGE_MS = 86_400_000;
export const feedKey = (botId: string) => `identity:feed:${botId}`;

export function aggregateIdentityCounts(rows: unknown[]) {
  const bots = botSignatures.filter((bot) => !bot.robotsOnly);
  const totals = Object.fromEntries(
    bots.map((bot) => [bot.id, Object.fromEntries(IDENTITY_STATUSES.map((status) => [status, 0]))]),
  );
  for (const row of rows) {
    if (row === null) continue;
    if (
      typeof row !== "object" ||
      Array.isArray(row) ||
      Object.keys(row).length > bots.length * IDENTITY_STATUSES.length
    )
      throw new Error("Invalid identity counts");
    for (const [field, count] of Object.entries(row)) {
      const [botId, status, extra] = field.split(":");
      if (
        extra !== undefined ||
        !Object.hasOwn(totals, botId) ||
        !IDENTITY_STATUSES.includes(status as IdentityStatus) ||
        !Number.isSafeInteger(count) ||
        count < 0 ||
        !Number.isSafeInteger(totals[botId][status] + count)
      )
        throw new Error("Invalid identity counter");
      totals[botId][status] += count;
    }
  }
  return totals;
}

function address(value: string): { bits: number; value: bigint } | null {
  if (/^(?:0|[1-9]\d{0,2})(?:\.(?:0|[1-9]\d{0,2})){3}$/.test(value)) {
    const parts = value.split(".").map(Number);
    if (parts.some((part) => part > 255)) return null;
    return { bits: 32, value: parts.reduce((result, part) => (result << 8n) + BigInt(part), 0n) };
  }
  if (!value.includes(":") || !/^[a-f0-9:.]+$/i.test(value) || value.length > 45) return null;
  try {
    const normalized = new URL(`http://[${value}]/`).hostname.slice(1, -1);
    const [left, right] = normalized.split("::");
    const before = left ? left.split(":") : [];
    const after = right ? right.split(":") : [];
    const groups =
      right !== undefined
        ? [...before, ...Array(8 - before.length - after.length).fill("0"), ...after]
        : before;
    if (groups.length !== 8) return null;
    return {
      bits: 128,
      value: groups.reduce((result, group) => (result << 16n) + BigInt(`0x${group}`), 0n),
    };
  } catch {
    return null;
  }
}

function network(cidr: string) {
  const [ip, mask, extra] = cidr.split("/");
  const parsed = address(ip);
  if (!parsed || extra !== undefined || !/^\d{1,3}$/.test(mask ?? ""))
    throw new Error("Invalid IP range");
  const prefix = Number(mask);
  // Reject unexpectedly broad vendor feeds instead of accepting an all-address range.
  if (prefix < (parsed.bits === 32 ? 8 : 16) || prefix > parsed.bits)
    throw new Error("Invalid range size");
  const shift = BigInt(parsed.bits - prefix);
  if ((parsed.value >> shift) << shift !== parsed.value)
    throw new Error("Range contains host bits");
  return { ...parsed, shift };
}

export function matchesRange(ip: string, cidr: string) {
  const parsed = address(ip);
  const range = network(cidr);
  return (
    !!parsed &&
    parsed.bits === range.bits &&
    parsed.value >> range.shift === range.value >> range.shift
  );
}

export function parseVendorRanges(value: unknown): string[] {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as { prefixes?: unknown }).prefixes)
  )
    throw new Error("Invalid vendor feed");
  const prefixes = (value as { prefixes: unknown[] }).prefixes;
  if (!prefixes.length || prefixes.length > 2048) throw new Error("Invalid feed size");
  const ranges = prefixes.map((item) => {
    if (!item || typeof item !== "object") throw new Error("Invalid feed entry");
    const row = item as Record<string, unknown>;
    const value = row.ipv4Prefix ?? row.ipv6Prefix;
    if (typeof value !== "string" || (row.ipv4Prefix !== undefined && row.ipv6Prefix !== undefined))
      throw new Error("Invalid feed entry");
    const parsed = network(value);
    if (parsed.bits !== (row.ipv4Prefix !== undefined ? 32 : 128))
      throw new Error("Wrong feed family");
    return value;
  });
  return [...new Set(ranges)];
}

export function parseIdentityFeed(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid cached feed");
  const row = value as Record<string, unknown>;
  if (
    typeof row.fetchedAt !== "string" ||
    !Number.isFinite(Date.parse(row.fetchedAt)) ||
    new Date(row.fetchedAt).toISOString() !== row.fetchedAt ||
    !Array.isArray(row.ranges) ||
    !row.ranges.length ||
    row.ranges.length > 2048
  )
    throw new Error("Invalid cached feed");
  const ranges = row.ranges.map((range) => {
    if (typeof range !== "string") throw new Error("Invalid cached range");
    network(range);
    return range;
  });
  return { fetchedAt: row.fetchedAt, ranges };
}

export function feedIsFresh(fetchedAt: string, now = Date.now()) {
  const age = now - Date.parse(fetchedAt);
  return age >= 0 && age < FEED_MAX_AGE_MS;
}

export async function verifyCrawlerIdentity(
  store: Pick<CrawlerStore, "get">,
  botId: string,
  headers: Headers,
  isVercel: boolean,
  now = Date.now(),
): Promise<IdentityStatus> {
  if (!isVercel) return "unavailable";
  if (!Object.hasOwn(IDENTITY_SOURCES, botId)) return "unsupported";
  // No fallback to client-supplied X-Forwarded-For, X-Real-IP, or comma-separated chains.
  const ip = headers.get("x-vercel-forwarded-for");
  if (!ip || !address(ip)) return "unavailable";
  try {
    const feed = parseIdentityFeed(await store.get(feedKey(botId)));
    if (!feedIsFresh(feed.fetchedAt, now)) return "unavailable";
    return feed.ranges.some((range) => matchesRange(ip, range)) ? "verified" : "unverified";
  } catch {
    return "unavailable";
  }
}

export type IdentityReport = {
  mode: string;
  start: string;
  end: string;
  rows: {
    botId: string;
    name: string;
    source: string | null;
    fetchedAt: string | null;
    fresh: boolean;
    counts: Record<string, number>;
  }[];
};
export function parseIdentityReport(value: unknown): IdentityReport {
  const row = value as IdentityReport | null;
  if (
    !row ||
    !["disabled", "vercel", "misconfigured"].includes(row.mode) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(row.start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(row.end) ||
    !Array.isArray(row.rows)
  )
    throw new Error("Invalid identity report");
  const expected = botSignatures.filter((bot) => !bot.robotsOnly);
  if (
    row.rows.length !== expected.length ||
    row.rows.some(
      (bot, index) =>
        !bot ||
        bot.botId !== expected[index].id ||
        bot.source !== (IDENTITY_SOURCES[bot.botId] ?? null) ||
        typeof bot.fresh !== "boolean" ||
        typeof bot.name !== "string" ||
        (bot.fetchedAt !== null &&
          (!Number.isFinite(Date.parse(bot.fetchedAt)) ||
            new Date(bot.fetchedAt).toISOString() !== bot.fetchedAt)) ||
        !bot.counts ||
        IDENTITY_STATUSES.some(
          (status) => !Number.isSafeInteger(bot.counts[status]) || bot.counts[status] < 0,
        ),
    )
  )
    throw new Error("Invalid identity rows");
  return row;
}
