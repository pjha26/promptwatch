import { Redis } from "@upstash/redis/cloudflare";

export function createRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis is not configured.");
  return new Redis({ url, token, signal: AbortSignal.timeout(2_000), retry: { retries: 0 } });
}
