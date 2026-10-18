export interface CrawlerStore {
  get(key: string): Promise<unknown>;
  eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;
}

export const COUNT_VISIT = `
local count = redis.call('INCR', KEYS[1])
redis.call('EXPIRE', KEYS[1], ARGV[1])
return count
`;

export async function applyCrawlerPolicy(store: CrawlerStore, botId: string, date: string) {
  const policy = await store.get(`policy:${botId}`);
  if (policy !== null && policy !== "allow" && policy !== "block") {
    throw new Error("Invalid crawler policy");
  }
  const blocked = policy === "block";
  try {
    await store.eval(
      COUNT_VISIT,
      [`${blocked ? "blocked" : "bot"}:${botId}:${date}`],
      [60 * 60 * 24 * 30],
    );
  } catch {
    // An analytics failure must not reverse a policy decision already read.
    console.error("[crawler] Could not record request count.");
  }
  return blocked;
}
