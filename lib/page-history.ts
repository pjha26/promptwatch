import { createRedis } from "@/lib/redis";
import { reportDays } from "@/lib/traffic-report";
import { aggregatePublicPages, DAILY_PATH_LIMIT } from "@/lib/public-paths";

export async function readPageHistory() {
  const redis = createRedis();
  const days = reportDays();
  const pipeline = redis.pipeline();
  for (const date of days) pipeline.hgetall(`pages:${date}`);
  for (const date of days) pipeline.hgetall(`blocked-pages:${date}`);
  for (const date of days) pipeline.hgetall(`limited-pages:${date}`);
  pipeline.get("paths:started_at");
  const values = await pipeline.exec();
  if (values.length !== days.length * 3 + 1) throw new Error("Incomplete page history");
  const prefixes = process.env.PROMPTWATCH_PUBLIC_PATH_PREFIXES ?? "/";
  const startedAt = values[days.length * 3];
  if (
    startedAt !== null &&
    (typeof startedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(startedAt))
  )
    throw new Error("Invalid collection date");
  return {
    pageTotals: aggregatePublicPages(values.slice(0, days.length), prefixes),
    blockedPageTotals: aggregatePublicPages(values.slice(days.length, days.length * 2), prefixes),
    limitedPageTotals: aggregatePublicPages(
      values.slice(days.length * 2, days.length * 3),
      prefixes,
    ),
    startedAt,
    limitPerDay: DAILY_PATH_LIMIT,
  };
}
