import { botSignatures } from "./botSignatures";
import { parsePolicyUpdate, type BotPolicy } from "./bot-policies";
import type { CrawlerStore } from "./crawler-policy";

export const POLICY_HISTORY_KEY = "policy:history";
export const POLICY_HISTORY_LIMIT = 200;

export interface PolicyChange {
  id: string;
  botId: string;
  previous: BotPolicy;
  policy: BotPolicy;
  changedAt: string;
  actor: "owner";
}

// Validate both key types before writing: Redis script errors do not roll back earlier writes.
export const SAVE_POLICY = `
local previous = redis.call('GET', KEYS[1])
if previous and previous ~= 'allow' and previous ~= 'block' then
  return redis.error_reply('Invalid stored policy')
end
local historyType = redis.call('TYPE', KEYS[2]).ok
if historyType ~= 'none' and historyType ~= 'list' then
  return redis.error_reply('Invalid policy history type')
end
previous = previous or 'allow'
if previous == ARGV[1] then return 0 end
local entry = cjson.encode({id = ARGV[3], botId = ARGV[4], previous = previous,
  policy = ARGV[1], changedAt = ARGV[2], actor = 'owner'})
redis.call('LPUSH', KEYS[2], entry)
redis.call('LTRIM', KEYS[2], 0, tonumber(ARGV[5]) - 1)
redis.call('SET', KEYS[1], ARGV[1])
return 1
`;

export async function savePolicyWithHistory(store: Pick<CrawlerStore, "eval">, value: unknown) {
  const update = parsePolicyUpdate(value);
  const result = await store.eval(
    SAVE_POLICY,
    [`policy:${update.botId}`, POLICY_HISTORY_KEY],
    [
      update.policy,
      new Date().toISOString(),
      crypto.randomUUID(),
      update.botId,
      POLICY_HISTORY_LIMIT,
    ],
  );
  if (result !== 0 && result !== 1) throw new Error("Policy save was not confirmed");
  return { ...update, changed: result === 1 };
}

export function parsePolicyHistory(value: unknown): PolicyChange[] {
  if (!Array.isArray(value) || value.length > POLICY_HISTORY_LIMIT)
    throw new Error("Invalid policy history");
  const ids = new Set<string>();
  return value.map((item) => {
    // Redis REST clients may return either raw JSON list entries or parsed objects.
    const row = typeof item === "string" ? JSON.parse(item) : item;
    if (
      !row ||
      typeof row !== "object" ||
      Array.isArray(row) ||
      typeof row.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id) ||
      ids.has(row.id) ||
      row.actor !== "owner" ||
      !botSignatures.some((bot) => bot.id === row.botId && !bot.robotsOnly) ||
      (row.previous !== "allow" && row.previous !== "block") ||
      (row.policy !== "allow" && row.policy !== "block") ||
      row.previous === row.policy ||
      typeof row.changedAt !== "string" ||
      !Number.isFinite(Date.parse(row.changedAt)) ||
      new Date(row.changedAt).toISOString() !== row.changedAt
    )
      throw new Error("Invalid policy history entry");
    ids.add(row.id);
    return {
      id: row.id,
      botId: row.botId,
      previous: row.previous,
      policy: row.policy,
      changedAt: row.changedAt,
      actor: "owner",
    };
  });
}
