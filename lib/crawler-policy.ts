import { DAILY_PATH_LIMIT } from "./public-paths";

export interface CrawlerStore {
  get(key: string): Promise<unknown>;
  eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;
}

export const COUNT_VISIT = `
local count = redis.call('INCR', KEYS[1])
redis.call('EXPIRE', KEYS[1], ARGV[1])
if #KEYS > 1 then
  if redis.call('HEXISTS', KEYS[2], ARGV[2]) == 1 or redis.call('HLEN', KEYS[2]) < tonumber(ARGV[3]) then
    redis.call('HINCRBY', KEYS[2], ARGV[2], 1)
    redis.call('EXPIRE', KEYS[2], ARGV[1])
    redis.call('SET', KEYS[3], ARGV[4], 'NX')
  end
end
return count
`;

export async function applyCrawlerPolicy(
  store: CrawlerStore,
  botId: string,
  date: string,
  path: string | null = null,
) {
  const policy = await store.get(`policy:${botId}`);
  if (policy !== null && policy !== "allow" && policy !== "block") {
    throw new Error("Invalid crawler policy");
  }
  const blocked = policy === "block";
  try {
    await store.eval(
      COUNT_VISIT,
      [
        `${blocked ? "blocked" : "bot"}:${botId}:${date}`,
        ...(path ? [`${blocked ? "blocked-pages" : "pages"}:${date}`, "paths:started_at"] : []),
      ],
      [60 * 60 * 24 * 30, ...(path ? [path, DAILY_PATH_LIMIT, date] : [])],
    );
  } catch {
    // An analytics failure must not reverse a policy decision already read.
    console.error("[crawler] Could not record request count.");
  }
  return blocked;
}
