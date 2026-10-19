import { createRedis } from "@/lib/redis";
import { COLLECTOR_HEALTH_KEY, parseCollectorHealth } from "@/lib/collector-health";
import { COUNT_VISIT } from "@/lib/crawler-policy";

export async function readTrackingHealth() {
  const pipeline = createRedis().pipeline();
  pipeline.ping();
  pipeline.hgetall(COLLECTOR_HEALTH_KEY);
  const [pong, metadata] = await pipeline.exec();
  if (pong !== "PONG") throw new Error("Storage did not respond");
  return {
    ...parseCollectorHealth(metadata),
    redis: "reachable" as const,
    checkedAt: new Date().toISOString(),
  };
}

export async function checkCollectorStorage() {
  const redis = createRedis();
  const prefix = `diagnostic:collector:${crypto.randomUUID()}`;
  const keys = [`${prefix}:count`, `${prefix}:health`];
  const at = new Date().toISOString();
  try {
    const result = await redis.eval(COUNT_VISIT, keys, [60, at]);
    const pipeline = redis.pipeline();
    pipeline.get(keys[0]);
    pipeline.hgetall(keys[1]);
    const [count, metadata] = await pipeline.exec();
    if (result !== 1 || count !== 1 || parseCollectorHealth(metadata).lastRecordedAt !== at)
      throw new Error("Collector storage self-check failed");
    await redis.hset(COLLECTOR_HEALTH_KEY, { lastSelfCheckAt: at });
    await redis.expire(COLLECTOR_HEALTH_KEY, 2_592_000);
  } finally {
    // Both diagnostic keys also expire after 60 seconds if cleanup is unavailable.
    await redis.del(...keys).catch(() => undefined);
  }
}
