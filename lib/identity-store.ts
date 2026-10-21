import { botSignatures } from "./botSignatures";
import { createRedis } from "./redis";
import { reportDays } from "./traffic-report";
import { IDENTITY_REFRESH_RESULT, parseRefreshResult } from "./identity-refresh";
import { cronSecretConfigured } from "./cron-auth";
import { ownerAccessStatus } from "./owner-access";
import {
  feedKey,
  feedIsFresh,
  IDENTITY_SOURCES,
  aggregateIdentityCounts,
  parseIdentityFeed,
  parseVendorRanges,
} from "./crawler-identity";

export async function downloadIdentityFeed(botId: string, fetcher: typeof fetch = fetch) {
  if (!Object.hasOwn(IDENTITY_SOURCES, botId)) throw new Error("Unsupported crawler");
  const source = IDENTITY_SOURCES[botId];
  const options = {
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(5_000),
  } as const;
  let response = await fetcher(source, options);
  // The officially linked Perplexity .com feeds currently redirect to the same .ai path.
  const redirected = source.replace("https://www.perplexity.com/", "https://www.perplexity.ai/");
  if (
    [301, 302, 307, 308].includes(response.status) &&
    redirected !== source &&
    response.headers.get("location") === redirected
  ) {
    await response.body?.cancel();
    response = await fetcher(redirected, { ...options, redirect: "error" });
  }
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error("Vendor feed unavailable");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 262_144) throw new Error("Vendor feed too large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const data = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const ranges = parseVendorRanges(JSON.parse(new TextDecoder().decode(data)));
  const feed = { fetchedAt: new Date().toISOString(), ranges };
  return feed;
}

export async function refreshIdentityFeed(botId: string) {
  const feed = await downloadIdentityFeed(botId);
  await createRedis().set(feedKey(botId), feed, { ex: 86_400 });
}

export async function readIdentityReport() {
  const days = reportDays();
  const bots = botSignatures.filter((bot) => !bot.robotsOnly);
  const pipeline = createRedis().pipeline();
  const supported = Object.keys(IDENTITY_SOURCES);
  for (const botId of supported) pipeline.get(feedKey(botId));
  for (const day of days) pipeline.hgetall(`identity:${day}`);
  pipeline.get(IDENTITY_REFRESH_RESULT);
  const values = await pipeline.exec();
  if (values.length !== supported.length + days.length + 1)
    throw new Error("Incomplete identity data");
  const totals = aggregateIdentityCounts(values.slice(supported.length, -1));
  const rows = bots.map((bot) => {
    const index = supported.indexOf(bot.id);
    const cached = index < 0 ? null : values[index];
    const feed = cached === null ? null : parseIdentityFeed(cached);
    return {
      botId: bot.id,
      name: bot.name,
      source: IDENTITY_SOURCES[bot.id] ?? null,
      fetchedAt: feed?.fetchedAt ?? null,
      fresh: !!feed && feedIsFresh(feed.fetchedAt),
      counts: totals[bot.id],
    };
  });
  const configured = process.env.PROMPTWATCH_AUTO_REFRESH_FEEDS === "true";
  const owner = process.env.PROMPTWATCH_OWNER_ID?.trim();
  return {
    automaticRefresh: {
      configured,
      ready:
        configured &&
        cronSecretConfigured(process.env.CRON_SECRET) &&
        ownerAccessStatus(owner ?? null, owner) === 200,
      lastRun: parseRefreshResult(values.at(-1)),
    },
    mode:
      process.env.PROMPTWATCH_IP_VERIFICATION !== "vercel"
        ? "disabled"
        : process.env.VERCEL === "1"
          ? "vercel"
          : "misconfigured",
    start: days[0],
    end: days.at(-1),
    rows,
  };
}
