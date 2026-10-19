import { createRedis } from "@/lib/redis";
import { readTrafficHistory } from "@/lib/traffic-history";
import { deriveCrawlerActions, parseDecision } from "@/lib/crawler-actions";
import type { Status } from "@/lib/types";

const decisionKey = (id: string) => `actions:decisions:${id.slice(-10)}`;

export async function readCrawlerActionSnapshot() {
  const snapshot = deriveCrawlerActions(await readTrafficHistory());
  if (snapshot.actions.length) {
    const pipeline = createRedis().pipeline();
    for (const action of snapshot.actions) pipeline.hget(decisionKey(action.id), action.id);
    const values = await pipeline.exec();
    if (values.length !== snapshot.actions.length) throw new Error("Incomplete saved decisions");
    snapshot.actions = snapshot.actions.map((action, index) => ({
      ...action,
      ...parseDecision(values[index]),
    }));
  }
  return {
    ...snapshot,
    generatedAt: new Date().toISOString(),
    source: "crawler-counters" as const,
  };
}

export async function saveActionDecision(id: string, status: Status) {
  const decision = { status, reviewedAt: new Date().toISOString() };
  await createRedis().eval(
    `
redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
redis.call('EXPIRE', KEYS[1], ARGV[3])
return 1
`,
    [decisionKey(id)],
    [id, JSON.stringify(decision), 60 * 86_400],
  );
  return decision;
}
