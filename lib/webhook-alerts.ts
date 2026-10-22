import { createHmac } from "node:crypto";
import { cronSecretConfigured } from "./cron-auth";
import { RELEASE_IDENTITY_REFRESH, type RefreshStore } from "./identity-refresh";

export const ALERT_STATE_KEY = "alerts:state";
export const ALERT_LOCK_KEY = "alerts:lock";
const DAY = 86_400_000;
export interface AlertEvent {
  id: string;
  group: string;
  type: "traffic-spike" | "collector-failure" | "feed-refresh-failure";
  title: string;
  occurredAt: string;
  details: string[];
}
export interface AlertEntry {
  event: AlertEvent;
  createdAt: string;
  expiresAt: string;
  nextAttemptAt: string;
  attempts: number;
  status: "pending" | "delivered" | "exhausted" | "cancelled";
  deliveredAt: string | null;
}
export interface AlertState {
  entries: AlertEntry[];
  lastRun: {
    at: string;
    attempted: number;
    delivered: number;
    failed: number;
    dropped: number;
  } | null;
}
export interface AlertStore extends RefreshStore {
  get(key: string): Promise<unknown>;
}

export const SAVE_ALERT_STATE = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3])
return 1
`;

function timestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

export function parseAlertEvent(value: unknown): AlertEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid alert");
  const row = value as AlertEvent;
  if (
    typeof row.id !== "string" ||
    !/^[a-zA-Z0-9:._-]{1,200}$/.test(row.id) ||
    typeof row.group !== "string" ||
    !/^[a-zA-Z0-9:_-]{1,100}$/.test(row.group) ||
    !["traffic-spike", "collector-failure", "feed-refresh-failure"].includes(row.type) ||
    typeof row.title !== "string" ||
    !row.title.trim() ||
    row.title.length > 200 ||
    !timestamp(row.occurredAt) ||
    !Array.isArray(row.details) ||
    row.details.length > 10 ||
    row.details.some((detail) => typeof detail !== "string" || detail.length > 500)
  )
    throw new Error("Invalid alert");
  return {
    id: row.id,
    group: row.group,
    type: row.type,
    title: row.title,
    occurredAt: row.occurredAt,
    details: [...row.details],
  };
}

export function parseAlertState(value: unknown): AlertState {
  if (value === null) return { entries: [], lastRun: null };
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid alert state");
  const row = value as AlertState;
  if (!Array.isArray(row.entries) || row.entries.length > 100)
    throw new Error("Invalid alert queue");
  const ids = new Set<string>();
  const entries = row.entries.map((entry) => {
    if (
      !entry ||
      !timestamp(entry.createdAt) ||
      !timestamp(entry.expiresAt) ||
      !timestamp(entry.nextAttemptAt) ||
      entry.expiresAt <= entry.createdAt ||
      !Number.isInteger(entry.attempts) ||
      entry.attempts < 0 ||
      entry.attempts > 3 ||
      !["pending", "delivered", "exhausted", "cancelled"].includes(entry.status) ||
      (entry.status === "pending" && entry.attempts >= 3) ||
      (entry.status === "exhausted" && entry.attempts !== 3) ||
      (entry.status === "delivered"
        ? !timestamp(entry.deliveredAt) || entry.attempts === 0
        : entry.deliveredAt !== null)
    )
      throw new Error("Invalid alert delivery");
    const event = parseAlertEvent(entry.event);
    if (ids.has(event.id)) throw new Error("Duplicate alert");
    ids.add(event.id);
    return { ...entry, event };
  });
  const lastRun = row.lastRun;
  if (
    lastRun !== null &&
    (!lastRun ||
      !timestamp(lastRun.at) ||
      [lastRun.attempted, lastRun.delivered, lastRun.failed, lastRun.dropped].some(
        (count) => !Number.isSafeInteger(count) || count < 0,
      ) ||
      lastRun.attempted > 4 ||
      lastRun.delivered + lastRun.failed !== lastRun.attempted)
  )
    throw new Error("Invalid alert run");
  return { entries, lastRun };
}

export function webhookConfiguration(env: Record<string, string | undefined>) {
  const enabled = env.PROMPTWATCH_ALERTS_ENABLED === "true";
  let url: URL | null = null;
  try {
    const parsed = new URL(env.PROMPTWATCH_WEBHOOK_URL ?? "");
    if (
      parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password &&
      !parsed.hash &&
      parsed.href.length <= 2048
    )
      url = parsed;
  } catch {
    /* Incomplete setup stays unavailable. */
  }
  const secret = env.PROMPTWATCH_WEBHOOK_SECRET;
  return {
    enabled,
    ready: enabled && url !== null && cronSecretConfigured(secret),
    url: url?.href ?? null,
    secret,
  };
}

export async function deliverWebhook(
  event: AlertEvent,
  url: string,
  secret: string,
  transport = fetch,
) {
  const body = JSON.stringify({
    schemaVersion: 1,
    eventId: event.id,
    type: event.type,
    title: event.title,
    occurredAt: event.occurredAt,
    details: event.details,
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  const response = await transport(url, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
    headers: {
      "Content-Type": "application/json",
      "X-Promptwatch-Event-Id": event.id,
      "X-Promptwatch-Timestamp": timestamp,
      "X-Promptwatch-Signature": `v1=${signature}`,
    },
    body,
  });
  await response.body?.cancel();
  if (!response.ok) throw new Error("Webhook rejected delivery");
}

export async function runWebhookAlerts(
  store: () => AlertStore,
  candidates: () => Promise<AlertEvent[]>,
  deliver: (event: AlertEvent) => Promise<void>,
  now = new Date(),
) {
  const token = crypto.randomUUID();
  const acquired = await store().set(ALERT_LOCK_KEY, token, { nx: true, ex: 120 });
  if (acquired === null) return { status: "busy" as const };
  if (acquired !== "OK") throw new Error("Alert lease was not confirmed");
  try {
    const state = parseAlertState(await store().get(ALERT_STATE_KEY));
    const incoming = (await candidates()).map(parseAlertEvent);
    if (incoming.length > 32) throw new Error("Too many alert candidates");
    const at = now.toISOString();
    const time = now.getTime();
    const fresh = incoming.filter(
      (event) =>
        Date.parse(event.occurredAt) <= time && Date.parse(event.occurredAt) > time - 7 * DAY,
    );
    state.entries = state.entries.filter((entry) => entry.expiresAt > at);
    // Cancel pending snapshots when their group has no current active evidence.
    for (const entry of state.entries)
      if (entry.status === "pending" && !fresh.some((event) => event.group === entry.event.group))
        entry.status = "cancelled";
    let dropped = 0;
    for (const event of fresh) {
      if (
        state.entries.some(
          (entry) =>
            entry.event.id === event.id ||
            (entry.event.group === event.group &&
              (entry.status === "pending" ||
                Date.parse(entry.deliveredAt ?? entry.createdAt) > time - DAY)),
        )
      )
        continue;
      if (state.entries.length === 100) {
        dropped++;
        continue;
      }
      state.entries.push({
        event,
        createdAt: at,
        expiresAt: new Date(
          Math.min(time + 7 * DAY, Date.parse(event.occurredAt) + 7 * DAY),
        ).toISOString(),
        nextAttemptAt: at,
        attempts: 0,
        status: "pending",
        deliveredAt: null,
      });
    }
    const save = async () => {
      if (
        (await store().eval(
          SAVE_ALERT_STATE,
          [ALERT_LOCK_KEY, ALERT_STATE_KEY],
          [token, JSON.stringify(state), 30 * 86_400],
        )) !== 1
      )
        throw new Error("Alert state could not be confirmed");
    };
    await save();
    let attempted = 0,
      delivered = 0,
      failed = 0;
    for (const entry of state.entries) {
      if (attempted === 4) break;
      if (entry.status !== "pending" || entry.nextAttemptAt > at) continue;
      entry.attempts++;
      entry.nextAttemptAt = new Date(time + (entry.attempts === 1 ? 3_600_000 : DAY)).toISOString();
      // Persist the attempt before the external effect; a crash cannot cause an immediate replay.
      if (entry.attempts === 3) entry.status = "exhausted";
      await save();
      attempted++;
      try {
        await deliver(entry.event);
        entry.status = "delivered";
        entry.deliveredAt = new Date().toISOString();
        delivered++;
      } catch {
        failed++;
      }
      await save();
    }
    state.lastRun = { at, attempted, delivered, failed, dropped };
    await save();
    return {
      status: failed || dropped ? ("partial" as const) : ("completed" as const),
      ...state.lastRun,
    };
  } finally {
    await store()
      .eval(RELEASE_IDENTITY_REFRESH, [ALERT_LOCK_KEY], [token])
      .catch(() => undefined);
  }
}
