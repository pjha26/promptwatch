export interface AlertStatus {
  enabled: boolean;
  ready: boolean;
  lastRun: {
    at: string;
    attempted: number;
    delivered: number;
    failed: number;
    dropped: number;
  } | null;
  deliveries: {
    id: string;
    title: string;
    status: string;
    attempts: number;
    nextAttemptAt: string | null;
    deliveredAt: string | null;
  }[];
}

function timestamp(value: unknown) {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

export function parseAlertStatus(value: unknown): AlertStatus {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid delivery status");
  const row = value as AlertStatus;
  if (
    typeof row.enabled !== "boolean" ||
    typeof row.ready !== "boolean" ||
    (row.ready && !row.enabled) ||
    !Array.isArray(row.deliveries) ||
    row.deliveries.length > 20 ||
    row.deliveries.some(
      (entry) =>
        !entry ||
        typeof entry.id !== "string" ||
        typeof entry.title !== "string" ||
        !["pending", "delivered", "exhausted", "cancelled"].includes(entry.status) ||
        !Number.isInteger(entry.attempts) ||
        entry.attempts < 0 ||
        entry.attempts > 3 ||
        (entry.status === "pending"
          ? !timestamp(entry.nextAttemptAt)
          : entry.nextAttemptAt !== null) ||
        (entry.status === "delivered" ? !timestamp(entry.deliveredAt) : entry.deliveredAt !== null),
    )
  )
    throw new Error("Invalid delivery status");
  if (
    row.lastRun !== null &&
    (!row.lastRun ||
      !timestamp(row.lastRun.at) ||
      [row.lastRun.attempted, row.lastRun.delivered, row.lastRun.failed, row.lastRun.dropped].some(
        (count) => !Number.isSafeInteger(count) || count < 0,
      ) ||
      row.lastRun.attempted > 4 ||
      row.lastRun.delivered + row.lastRun.failed !== row.lastRun.attempted)
  )
    throw new Error("Invalid delivery run");
  return row;
}
