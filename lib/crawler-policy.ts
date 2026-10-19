import { DAILY_PATH_LIMIT } from "./public-paths";
import { COLLECTOR_HEALTH_KEY, recordCollectorFailure } from "./collector-health";

export interface CrawlerStore {
  get(key: string): Promise<unknown>;
  eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;
}

export const COUNT_VISIT = `
local count = redis.call('INCR', KEYS[1])
redis.call('EXPIRE', KEYS[1], ARGV[1])
if #KEYS > 2 then
  if redis.call('HEXISTS', KEYS[2], ARGV[2]) == 1 or redis.call('HLEN', KEYS[2]) < tonumber(ARGV[3]) then
    redis.call('HINCRBY', KEYS[2], ARGV[2], 1)
    redis.call('EXPIRE', KEYS[2], ARGV[1])
    redis.call('SET', KEYS[3], ARGV[4], 'NX')
  end
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

export async function applyCrawlerPolicy(
  store: CrawlerStore,
  botId: string,
  date: string,
  path: string | null = null,
  observedAt = new Date().toISOString(),
) {
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
  try {
    await store.eval(
      COUNT_VISIT,
      [
        `${blocked ? "blocked" : "bot"}:${botId}:${date}`,
        ...(path ? [`${blocked ? "blocked-pages" : "pages"}:${date}`, "paths:started_at"] : []),
        COLLECTOR_HEALTH_KEY,
      ],
      [60 * 60 * 24 * 30, ...(path ? [path, DAILY_PATH_LIMIT, date] : []), observedAt],
    );
  } catch {
    // An analytics failure must not reverse a policy decision already read.
    console.error("[crawler] Could not record request count.");
    await recordCollectorFailure(store, "counter-write", observedAt);
  }
  return blocked;
}
