import { DAILY_PATH_LIMIT } from "./public-paths";
import { COLLECTOR_HEALTH_KEY, recordCollectorFailure } from "./collector-health";
import type { IdentityStatus } from "./crawler-identity";
import { VALID_THROTTLE_RULE, THROTTLE_RULES_KEY } from "./throttle-rules";

export interface CrawlerStore {
  get(key: string): Promise<unknown>;
  eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;
}

export const COUNT_VISIT = `
local count = redis.call('INCR', KEYS[1])
redis.call('EXPIRE', KEYS[1], ARGV[1])
if string.sub(ARGV[2], 1, 1) == '/' then
  if redis.call('HEXISTS', KEYS[2], ARGV[2]) == 1 or redis.call('HLEN', KEYS[2]) < tonumber(ARGV[3]) then
    redis.call('HINCRBY', KEYS[2], ARGV[2], 1)
    redis.call('EXPIRE', KEYS[2], ARGV[1])
    redis.call('SET', KEYS[3], ARGV[4], 'NX')
  end
end
local identityField = ARGV[#ARGV - 1]
local identity = string.match(identityField, '^[%w%-]+:(%w+)$')
if identity == 'verified' or identity == 'unverified' or identity == 'unavailable' or identity == 'unsupported' then
  local key = KEYS[#KEYS - 1]
  -- Optional identity statistics must not interrupt existing traffic counting.
  redis.pcall('HINCRBY', key, identityField, 1)
  redis.pcall('EXPIRE', key, ARGV[1])
end
local observed = ARGV[#ARGV]
local meta = KEYS[#KEYS]
local previous = redis.call('HGET', meta, 'lastRecordedAt')
if not previous or observed > previous then
  redis.call('HSET', meta, 'lastRecordedAt', observed)
end
redis.call('HSETNX', meta, 'firstRecordedAt', observed)
redis.call('EXPIRE', meta, ARGV[1])
return count
`;

export const THROTTLE_VISIT = `
${VALID_THROTTLE_RULE}
local limited = false
local retryAfter = 0
local function record()
  local KEYS = {limited and KEYS[10] or KEYS[1], limited and KEYS[11] or KEYS[2], KEYS[3], KEYS[4], KEYS[5]}
  local ARGV = {2592000, ARGV[2], ${DAILY_PATH_LIMIT}, ARGV[3], ARGV[4], ARGV[5]}
  ${COUNT_VISIT}
end
local raw = redis.call('HGET', KEYS[6], ARGV[1])
local over = false
local observationsOk = true
if raw then
  local ok, rule = pcall(cjson.decode, raw)
  if not ok or not validRule(rule) then return redis.error_reply('Invalid throttle rule') end
  if rule.mode ~= 'off' then
    local now = tonumber(redis.call('TIME')[1])
    local minute = math.floor(now / 60)
    local kind = redis.call('TYPE', KEYS[7]).ok
    if kind ~= 'none' and kind ~= 'hash' then return redis.error_reply('Invalid quota window') end
    local prior = redis.call('HMGET', KEYS[7], 'revision', 'minute', 'count')
    local priorMinute = tonumber(prior[2])
    local priorCount = tonumber(prior[3])
    if kind == 'hash' and (not prior[1] or not priorMinute or priorMinute < 0 or priorMinute ~= math.floor(priorMinute) or not priorCount or priorCount < 1 or priorCount > 9007199254740990 or priorCount ~= math.floor(priorCount)) then return redis.error_reply('Invalid quota window') end
    local count = 1
    if prior[1] == rule.revision and tonumber(prior[2]) == minute then count = tonumber(prior[3]) + 1 end
    over = count > rule.limit
    limited = over and rule.mode == 'enforce'
    if limited then retryAfter = 60 - (now % 60) end
    redis.call('HSET', KEYS[7], 'revision', rule.revision, 'minute', minute, 'count', count)
    redis.call('EXPIRE', KEYS[7], 61 - (now % 60))
    observationsOk = pcall(function()
      local slot = tostring(minute % 60)
      local previous = redis.call('HGET', KEYS[8], slot)
      local sample = {minute = minute, count = 0}
      if previous then
        local decoded = cjson.decode(previous)
        if type(decoded) ~= 'table' or type(decoded.minute) ~= 'number' or type(decoded.count) ~= 'number' or decoded.count < 1 then error('Invalid sample') end
        if decoded.minute == minute then sample.count = decoded.count end
      end
      sample.count = sample.count + 1
      redis.call('HSET', KEYS[8], slot, cjson.encode(sample))
      redis.call('EXPIRE', KEYS[8], 3600)
      if over and rule.mode == 'observe' then redis.call('INCR', KEYS[9]); redis.call('EXPIRE', KEYS[9], 2592000) end
    end)
  end
end
local recorded = pcall(record)
return {limited and 2 or 0, retryAfter, recorded and 1 or 0, observationsOk and 1 or 0}
`;

export interface CrawlerDecision {
  outcome: "allowed" | "blocked" | "limited";
  retryAfter: number | null;
}

export async function applyCrawlerPolicy(
  store: CrawlerStore,
  botId: string,
  date: string,
  path: string | null = null,
  observedAt = new Date().toISOString(),
  identity?: Promise<IdentityStatus>,
  throttlingEnabled = false,
): Promise<CrawlerDecision> {
  let policy;
  try {
    policy = await store.get(`policy:${botId}`);
    if (policy !== null && policy !== "allow" && policy !== "block")
      throw new Error("Invalid crawler policy");
  } catch {
    await recordCollectorFailure(store, "policy-read", observedAt);
    throw new Error("Crawler policy could not be read");
  }
  const blocked = policy === "block";
  const identityStatus = identity ? await identity.catch(() => "unavailable" as const) : null;
  try {
    if (throttlingEnabled && !blocked) {
      const result = await store.eval(
        THROTTLE_VISIT,
        [
          `bot:${botId}:${date}`,
          `pages:${date}`,
          "paths:started_at",
          `identity:${date}`,
          COLLECTOR_HEALTH_KEY,
          THROTTLE_RULES_KEY,
          `throttle:window:${botId}`,
          `throttle:samples:${botId}`,
          `throttle:would:${botId}:${date}`,
          `limited:${botId}:${date}`,
          `limited-pages:${date}`,
        ],
        [botId, path ?? "", date, identityStatus ? `${botId}:${identityStatus}` : "", observedAt],
      );
      if (
        !Array.isArray(result) ||
        result.length !== 4 ||
        ![0, 2].includes(result[0]) ||
        !Number.isInteger(result[1]) ||
        (result[0] === 2 ? result[1] < 1 || result[1] > 60 : result[1] !== 0) ||
        result.slice(2).some((value) => value !== 0 && value !== 1)
      )
        throw new Error("Throttle decision unconfirmed");
      if (result[2] === 0 || result[3] === 0)
        await recordCollectorFailure(store, "counter-write", observedAt);
      return {
        outcome: result[0] === 2 ? "limited" : "allowed",
        retryAfter: result[0] === 2 ? result[1] : null,
      };
    }
    await store.eval(
      COUNT_VISIT,
      [
        `${blocked ? "blocked" : "bot"}:${botId}:${date}`,
        ...(path ? [`${blocked ? "blocked-pages" : "pages"}:${date}`, "paths:started_at"] : []),
        ...(identityStatus ? [`identity:${date}`] : []),
        COLLECTOR_HEALTH_KEY,
      ],
      [
        60 * 60 * 24 * 30,
        ...(path ? [path, DAILY_PATH_LIMIT, date] : []),
        ...(identityStatus ? [`${botId}:${identityStatus}`] : []),
        observedAt,
      ],
    );
  } catch {
    // An analytics failure must not reverse a policy decision already read.
    console.error("[crawler] Could not record request count.");
    await recordCollectorFailure(
      store,
      throttlingEnabled && !blocked ? "throttle-check" : "counter-write",
      observedAt,
    );
  }
  return { outcome: blocked ? "blocked" : "allowed", retryAfter: null };
}
