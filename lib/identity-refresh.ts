import { IDENTITY_SOURCES } from "./crawler-identity";

export const IDENTITY_REFRESH_LOCK = "identity:refresh:lock";
export const IDENTITY_REFRESH_RESULT = "identity:refresh:last";

export interface RefreshStore {
  set(key: string, value: string, options: { nx: true; ex: number }): Promise<unknown>;
  eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;
}

export type RefreshResult = {
  id: string;
  startedAt: string;
  finishedAt: string;
  status: "success" | "partial" | "failed";
  results: { botId: string; status: "refreshed" | "failed" }[];
};

export const COMPLETE_IDENTITY_REFRESH = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3])
redis.call('DEL', KEYS[1])
return 1
`;
export const RELEASE_IDENTITY_REFRESH = `
if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end
return 0
`;

export async function runIdentityRefresh(
  store: () => RefreshStore,
  refresh: (botId: string) => Promise<void>,
): Promise<RefreshResult | { status: "busy" }> {
  const id = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const acquired = await store().set(IDENTITY_REFRESH_LOCK, id, { nx: true, ex: 120 });
  if (acquired === null) return { status: "busy" };
  if (acquired !== "OK") throw new Error("Refresh lease was not confirmed");
  let completed = false;
  try {
    const results = await Promise.all(
      Object.keys(IDENTITY_SOURCES).map(async (botId) => {
        try {
          await refresh(botId);
          return { botId, status: "refreshed" as const };
        } catch {
          return { botId, status: "failed" as const };
        }
      }),
    );
    const refreshed = results.filter((row) => row.status === "refreshed").length;
    const report: RefreshResult = {
      id,
      startedAt,
      finishedAt: new Date().toISOString(),
      status: refreshed === results.length ? "success" : refreshed === 0 ? "failed" : "partial",
      results,
    };
    // Downloads outlive a Redis client's deadline, so completion uses a fresh client.
    const saved = await store().eval(
      COMPLETE_IDENTITY_REFRESH,
      [IDENTITY_REFRESH_LOCK, IDENTITY_REFRESH_RESULT],
      [id, JSON.stringify(report), 30 * 86_400],
    );
    if (saved !== 1) throw new Error("Refresh completion was not confirmed");
    completed = true;
    return report;
  } finally {
    if (!completed)
      await store()
        .eval(RELEASE_IDENTITY_REFRESH, [IDENTITY_REFRESH_LOCK], [id])
        .catch(() => undefined);
  }
}

function timestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

export function parseRefreshResult(value: unknown): RefreshResult | null {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid refresh result");
  const row = value as RefreshResult;
  const bots = Object.keys(IDENTITY_SOURCES);
  if (
    typeof row.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id) ||
    !timestamp(row.startedAt) ||
    !timestamp(row.finishedAt) ||
    row.startedAt > row.finishedAt ||
    !Array.isArray(row.results) ||
    row.results.length !== bots.length ||
    row.results.some(
      (result, index) =>
        !result || result.botId !== bots[index] || !["refreshed", "failed"].includes(result.status),
    )
  )
    throw new Error("Invalid refresh result");
  const successes = row.results.filter((result) => result.status === "refreshed").length;
  if (
    row.status !== (successes === bots.length ? "success" : successes === 0 ? "failed" : "partial")
  )
    throw new Error("Invalid refresh outcome");
  return row;
}

export function parseAutomaticRefresh(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid refresh configuration");
  const row = value as Record<string, unknown>;
  if (
    typeof row.configured !== "boolean" ||
    typeof row.ready !== "boolean" ||
    (row.ready && !row.configured)
  )
    throw new Error("Invalid refresh configuration");
  return { configured: row.configured, ready: row.ready, lastRun: parseRefreshResult(row.lastRun) };
}
