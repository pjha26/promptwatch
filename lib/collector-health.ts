import type { CrawlerStore } from "./crawler-policy";

export const COLLECTOR_HEALTH_KEY = "collector:health";
export type CollectorFailure = "policy-read" | "counter-write";

const FAILURE_SCRIPT = `
local previous = redis.call('HGET', KEYS[1], 'lastFailureAt')
if not previous or ARGV[1] >= previous then
  redis.call('HSET', KEYS[1], 'lastFailureAt', ARGV[1], 'lastFailureKind', ARGV[2])
end
redis.call('EXPIRE', KEYS[1], ARGV[3])
return 1
`;

export async function recordCollectorFailure(
  store: CrawlerStore,
  kind: CollectorFailure,
  at: string,
) {
  try {
    await store.eval(FAILURE_SCRIPT, [COLLECTOR_HEALTH_KEY], [at, kind, 2_592_000]);
  } catch {
    // A storage outage may also prevent its failure marker from being saved.
  }
}

function timestamp(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (
    typeof value !== "string" ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  ) {
    throw new Error("Invalid collector timestamp");
  }
  return value;
}

export function parseCollectorHealth(value: unknown) {
  if (value !== null && (typeof value !== "object" || Array.isArray(value)))
    throw new Error("Invalid health data");
  const fields = (value ?? {}) as Record<string, unknown>;
  const firstRecordedAt = timestamp(fields.firstRecordedAt);
  const lastRecordedAt = timestamp(fields.lastRecordedAt);
  const lastFailureAt = timestamp(fields.lastFailureAt);
  const lastSelfCheckAt = timestamp(fields.lastSelfCheckAt);
  const lastFailureKind = fields.lastFailureKind ?? null;
  if (
    lastFailureKind !== null &&
    lastFailureKind !== "policy-read" &&
    lastFailureKind !== "counter-write"
  )
    throw new Error("Invalid failure kind");
  if (lastFailureAt && !lastFailureKind) throw new Error("Missing failure kind");
  const status =
    lastFailureAt && (!lastRecordedAt || lastFailureAt >= lastRecordedAt)
      ? "degraded"
      : lastRecordedAt
        ? "recorded"
        : "waiting";
  return {
    status,
    firstRecordedAt,
    lastRecordedAt,
    lastFailureAt,
    lastFailureKind,
    lastSelfCheckAt,
  };
}

export function parseHealthResponse(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid health response");
  const row = value as Record<string, unknown>;
  const checkedAt = timestamp(row.checkedAt);
  if (row.redis !== "reachable" || !checkedAt) throw new Error("Invalid health response");
  return { ...parseCollectorHealth(row), redis: "reachable" as const, checkedAt };
}

export type TrackingHealth = ReturnType<typeof parseHealthResponse>;
