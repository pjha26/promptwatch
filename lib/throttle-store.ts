import { createRedis } from "./redis";
import {
  THROTTLE_BOTS,
  THROTTLE_RULES_KEY,
  THROTTLE_HISTORY_KEY,
  parseThrottleHistory,
  parseThrottleRule,
} from "./throttle-rules";
import { parseMinuteSamples, type ThrottleSnapshot } from "./throttle-report";

export async function readThrottleSnapshot(): Promise<ThrottleSnapshot> {
  const pipeline = createRedis().pipeline();
  const date = new Date().toISOString().slice(0, 10);
  pipeline.hgetall(THROTTLE_RULES_KEY);
  pipeline.lrange(THROTTLE_HISTORY_KEY, 0, 199);
  for (const bot of THROTTLE_BOTS) {
    pipeline.hgetall(`throttle:samples:${bot.id}`);
    pipeline.get(`throttle:would:${bot.id}:${date}`);
  }
  pipeline.eval("return redis.call('TIME')", [], []);
  const values = await pipeline.exec();
  const clock = values.at(-1);
  if (values.length !== 3 + THROTTLE_BOTS.length * 2 || !Array.isArray(clock))
    throw new Error("Incomplete throttle snapshot");
  const seconds = Number(clock[0]);
  if (!Number.isSafeInteger(seconds) || seconds < 1) throw new Error("Invalid server clock");
  const rules = values[0] as Record<string, unknown> | null;
  if (rules !== null && (typeof rules !== "object" || Array.isArray(rules)))
    throw new Error("Invalid rules");
  return {
    collectorEnabled: process.env.PROMPTWATCH_THROTTLING_ENABLED === "true",
    checkedAt: new Date(seconds * 1000).toISOString(),
    date,
    history: parseThrottleHistory(values[1]),
    rows: THROTTLE_BOTS.map((bot, index) => {
      const count = values[3 + index * 2] ?? 0;
      if (!Number.isSafeInteger(count) || (count as number) < 0)
        throw new Error("Invalid would-limit count");
      return {
        botId: bot.id,
        rule: parseThrottleRule(rules?.[bot.id] ?? null),
        samples: parseMinuteSamples(values[2 + index * 2], Math.floor(seconds / 60)),
        wouldLimitToday: count as number,
      };
    }),
  };
}
