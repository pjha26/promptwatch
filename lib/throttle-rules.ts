import { botSignatures } from "./botSignatures";

export const THROTTLE_RULES_KEY = "throttle:rules";
export const THROTTLE_HISTORY_KEY = "throttle:history";
export const THROTTLE_HISTORY_LIMIT = 200;
export const THROTTLE_BOTS = botSignatures.filter((bot) => !bot.robotsOnly);
export type ThrottleMode = "off" | "observe";
export interface ThrottleRule {
  mode: ThrottleMode;
  limit: number;
  revision: string;
  changedAt: string;
}
export interface ThrottleChange {
  id: string;
  botId: string;
  previous: ThrottleRule | null;
  rule: ThrottleRule;
  actor: "owner";
  changedAt: string;
}

export function parseThrottleInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Choose a crawler, mode and whole-number requests-per-minute limit.");
  const row = value as Record<string, unknown>;
  if (
    typeof row.botId !== "string" ||
    !THROTTLE_BOTS.some((bot) => bot.id === row.botId) ||
    typeof row.mode !== "string" ||
    !["off", "observe"].includes(row.mode) ||
    !Number.isInteger(row.limit) ||
    (row.mode === "off"
      ? row.limit !== 0
      : (row.limit as number) < 1 || (row.limit as number) > 100_000)
  )
    throw new Error(
      "Choose a supported crawler and mode. Active limits must be 1–100000 requests per minute; off uses zero.",
    );
  return { botId: row.botId, mode: row.mode as ThrottleMode, limit: row.limit as number };
}

export function parseThrottleRule(value: unknown): ThrottleRule | null {
  if (value === null) return null;
  const row = (typeof value === "string" ? JSON.parse(value) : value) as ThrottleRule;
  parseThrottleInput({ ...row, botId: THROTTLE_BOTS[0].id });
  if (
    !row ||
    typeof row.revision !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.revision) ||
    typeof row.changedAt !== "string" ||
    !Number.isFinite(Date.parse(row.changedAt)) ||
    new Date(row.changedAt).toISOString() !== row.changedAt
  )
    throw new Error("Invalid saved throttle rule");
  return { mode: row.mode, limit: row.limit, revision: row.revision, changedAt: row.changedAt };
}

export function parseThrottleHistory(value: unknown): ThrottleChange[] {
  if (!Array.isArray(value) || value.length > THROTTLE_HISTORY_LIMIT)
    throw new Error("Invalid throttle history");
  const ids = new Set<string>();
  return value.map((item) => {
    const row = (typeof item === "string" ? JSON.parse(item) : item) as ThrottleChange;
    const rule = parseThrottleRule(row?.rule);
    const previous = parseThrottleRule(row?.previous);
    if (
      !row ||
      !rule ||
      row.actor !== "owner" ||
      row.id !== rule.revision ||
      ids.has(row.id) ||
      row.changedAt !== rule.changedAt ||
      !THROTTLE_BOTS.some((bot) => bot.id === row.botId) ||
      (previous?.mode === rule.mode && previous.limit === rule.limit)
    )
      throw new Error("Invalid throttle history entry");
    ids.add(row.id);
    return {
      id: row.id,
      botId: row.botId,
      previous,
      rule,
      actor: "owner",
      changedAt: row.changedAt,
    };
  });
}

export const VALID_THROTTLE_RULE = `
local function validRule(rule)
  return type(rule) == 'table' and (rule.mode == 'off' or rule.mode == 'observe')
    and type(rule.limit) == 'number' and rule.limit == math.floor(rule.limit)
    and ((rule.mode == 'off' and rule.limit == 0) or (rule.mode ~= 'off' and rule.limit >= 1 and rule.limit <= 100000))
    and type(rule.revision) == 'string' and #rule.revision == 36 and type(rule.changedAt) == 'string'
end
`;
export const SAVE_THROTTLE_RULE = `
${VALID_THROTTLE_RULE}
local kind = redis.call('TYPE', KEYS[1]).ok
local historyKind = redis.call('TYPE', KEYS[2]).ok
if (kind ~= 'none' and kind ~= 'hash') or (historyKind ~= 'none' and historyKind ~= 'list') then return redis.error_reply('Invalid throttle storage') end
local old = redis.call('HGET', KEYS[1], ARGV[1])
local previous = cjson.null
if old then
  local ok, decoded = pcall(cjson.decode, old)
  if not ok or not validRule(decoded) then return redis.error_reply('Invalid stored throttle rule') end
  previous = decoded
end
local rule = cjson.decode(ARGV[2])
if not validRule(rule) then return redis.error_reply('Invalid throttle rule') end
if (old and previous.mode == rule.mode and previous.limit == rule.limit) or (not old and rule.mode == 'off') then return {0, old or ''} end
local entry = cjson.encode({id = rule.revision, botId = ARGV[1], previous = previous, rule = rule, actor = 'owner', changedAt = rule.changedAt})
redis.call('LPUSH', KEYS[2], entry)
redis.call('LTRIM', KEYS[2], 0, tonumber(ARGV[3]) - 1)
redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
return {1, ARGV[2]}
`;

export async function saveThrottleRule(
  store: { eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown> },
  value: unknown,
) {
  const input = parseThrottleInput(value);
  const rule: ThrottleRule = {
    mode: input.mode,
    limit: input.limit,
    revision: crypto.randomUUID(),
    changedAt: new Date().toISOString(),
  };
  const result = await store.eval(
    SAVE_THROTTLE_RULE,
    [THROTTLE_RULES_KEY, THROTTLE_HISTORY_KEY],
    [input.botId, JSON.stringify(rule), THROTTLE_HISTORY_LIMIT],
  );
  if (!Array.isArray(result) || result.length !== 2 || ![0, 1].includes(result[0]))
    throw new Error("Throttle save was not confirmed");
  return {
    botId: input.botId,
    changed: result[0] === 1,
    rule: result[1] === "" ? null : parseThrottleRule(result[1]),
  };
}
