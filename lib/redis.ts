import { Redis } from "@upstash/redis/cloudflare";

export const REDIS_REQUEST_BUDGET_MS = 2_000;

export function createRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis is not configured.");
  return new Redis({
    url,
    token,
    signal: AbortSignal.timeout(REDIS_REQUEST_BUDGET_MS),
    retry: { retries: 0 },
  });
}
