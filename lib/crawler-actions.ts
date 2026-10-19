import { botSignatures } from "./botSignatures";
import type { Severity, Status } from "./types";
import type { TrafficHistory } from "./traffic-report";

export const CRAWLER_ACTION_LABELS = {
  "traffic-spike": "Traffic increase",
  "repeated-blocks": "Access review",
  "new-activity": "Recent discovery",
} as const;
export type CrawlerActionType = keyof typeof CRAWLER_ACTION_LABELS;

export interface CrawlerAction {
  id: string;
  type: CrawlerActionType;
  severity: Severity;
  status: Status;
  title: string;
  description: string;
  created_at: string;
  windowStart: string;
  windowEnd: string;
  source_url: "/dashboard/traffic" | "/dashboard/settings";
  evidence: { label: string; value: string | number }[];
  reviewedAt: string | null;
}

export function deriveCrawlerActions(
  history: TrafficHistory,
  asOf = new Date().toISOString().slice(0, 10),
) {
  const end = history.days.filter((day) => day < asOf).length;
  const start = end - 7;
  const actions: CrawlerAction[] = [];
  if (start < 0) return { actions, window: null, observedRequests: 0 };
  const window = { start: history.days[start], end: history.days[end - 1] };
  let observedRequests = 0;
  for (const bot of history.bots) {
    const signature = botSignatures.find((candidate) => candidate.id === bot.id);
    if (!signature || signature.robotsOnly) continue;
    const counts = bot.hitsByDay.map((allowed, index) => allowed + bot.blockedByDay[index]);
    const current = counts.slice(start, end).reduce((sum, count) => sum + count, 0);
    const previous =
      start >= 7 ? counts.slice(start - 7, start).reduce((sum, count) => sum + count, 0) : null;
    const blocked = bot.blockedByDay.slice(start, end).reduce((sum, count) => sum + count, 0);
    const blockedDays = bot.blockedByDay.slice(start, end).filter((count) => count > 0).length;
    observedRequests += current;
    const base = {
      status: "active" as const,
      created_at: `${window.end}T23:59:59.999Z`,
      windowStart: window.start,
      windowEnd: window.end,
      reviewedAt: null,
    };
    if (previous !== null && previous >= 10 && current >= 20 && current >= previous * 2) {
      actions.push({
        ...base,
        id: `crawler:traffic-spike:${bot.id}:${window.end}`,
        type: "traffic-spike",
        severity: current >= previous * 4 && current >= 100 ? "high" : "medium",
        title: `Review increased activity from ${signature.name}`,
        description:
          "Recorded requests at least doubled versus the preceding seven complete UTC days. Review the traffic before deciding whether access limits are needed.",
        source_url: "/dashboard/traffic",
        evidence: [
          { label: "Observed requests in this window", value: current },
          { label: "Previous seven days", value: previous },
          {
            label: "Previous window",
            value: `${history.days[start - 7]} — ${history.days[start - 1]} UTC`,
          },
        ],
      });
    }
    if (blocked >= 10 && blockedDays >= 2) {
      actions.push({
        ...base,
        id: `crawler:repeated-blocks:${bot.id}:${window.end}`,
        type: "repeated-blocks",
        severity: blocked >= 100 ? "high" : "medium",
        title: `Review repeated blocks for ${signature.name}`,
        description:
          "Requests were denied on multiple days. Confirm that these historical blocks match your intent; this recommendation does not infer the current policy or change it.",
        source_url: "/dashboard/settings",
        evidence: [
          { label: "Blocked requests", value: blocked },
          { label: "Days with blocked requests", value: blockedDays },
          { label: "All observed requests in this window", value: current },
        ],
      });
    }
    const first = counts.findIndex((count) => count > 0);
    if (first >= start && first < end && current >= 5) {
      actions.push({
        ...base,
        id: `crawler:new-activity:${bot.id}:${history.days[first]}`,
        type: "new-activity",
        severity: "low",
        title: `Review newly observed ${signature.name} activity`,
        description:
          "The first positive counter in the available history falls in this window. Earlier visits may be outside retention or missing; this does not prove the crawler never visited before.",
        source_url: "/dashboard/traffic",
        evidence: [
          { label: "First positive counter in retained history", value: history.days[first] },
          { label: "Retained history begins", value: history.days[0] },
          { label: "Observed requests in this window", value: current },
        ],
      });
    }
  }
  const severity = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => severity[a.severity] - severity[b.severity] || a.id.localeCompare(b.id));
  return { actions, window, observedRequests };
}

function isDay(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
function isTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
function isStatus(value: unknown): value is Status {
  return value === "active" || value === "accepted" || value === "dismissed";
}

export function parseActionUpdate(value: unknown): { id: string; status: Status } {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid action decision");
  const { id, status } = value as Record<string, unknown>;
  if (typeof id !== "string" || !isStatus(status)) throw new Error("Invalid action decision");
  const [prefix, kind, botId, date, extra] = id.split(":");
  if (
    prefix !== "crawler" ||
    !Object.hasOwn(CRAWLER_ACTION_LABELS, kind) ||
    !botSignatures.some((bot) => bot.id === botId && !bot.robotsOnly) ||
    !isDay(date) ||
    extra !== undefined
  )
    throw new Error("Invalid action identifier");
  return { id, status };
}

export function parseDecision(value: unknown): { status: Status; reviewedAt: string | null } {
  if (value === null) return { status: "active", reviewedAt: null };
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid saved decision");
  const row = value as Record<string, unknown>;
  if (!isStatus(row.status) || !isTimestamp(row.reviewedAt))
    throw new Error("Invalid saved decision");
  return { status: row.status, reviewedAt: row.reviewedAt };
}

export function parseActionResponse(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid action response");
  const row = value as Record<string, unknown>;
  if (
    row.source !== "crawler-counters" ||
    !isTimestamp(row.generatedAt) ||
    !Array.isArray(row.actions) ||
    !Number.isSafeInteger(row.observedRequests) ||
    (row.observedRequests as number) < 0
  )
    throw new Error("Invalid action response");
  let window: { start: string; end: string } | null = null;
  if (row.window !== null) {
    const range = row.window as Record<string, unknown> | null;
    if (!range || !isDay(range.start) || !isDay(range.end) || range.start > range.end)
      throw new Error("Invalid action window");
    window = { start: range.start, end: range.end };
  }
  const ids = new Set<string>();
  const actions = row.actions.map((item: unknown) => {
    const parsed = parseActionUpdate(item);
    const action = item as Record<string, unknown>;
    if (
      ids.has(parsed.id) ||
      action.type !== parsed.id.split(":")[1] ||
      !["high", "medium", "low"].includes(String(action.severity)) ||
      !isTimestamp(action.created_at) ||
      !isDay(action.windowStart) ||
      !isDay(action.windowEnd) ||
      !window ||
      action.windowStart !== window.start ||
      action.windowEnd !== window.end ||
      typeof action.title !== "string" ||
      typeof action.description !== "string" ||
      !["/dashboard/traffic", "/dashboard/settings"].includes(String(action.source_url)) ||
      (action.reviewedAt !== null && !isTimestamp(action.reviewedAt)) ||
      (action.reviewedAt === null && parsed.status !== "active") ||
      !Array.isArray(action.evidence) ||
      !action.evidence.length
    )
      throw new Error("Invalid action evidence");
    for (const metric of action.evidence) {
      if (
        !metric ||
        typeof metric !== "object" ||
        typeof metric.label !== "string" ||
        (typeof metric.value !== "string" &&
          (typeof metric.value !== "number" ||
            !Number.isSafeInteger(metric.value) ||
            metric.value < 0))
      )
        throw new Error("Invalid action metric");
    }
    ids.add(parsed.id);
    return action as unknown as CrawlerAction;
  });
  return {
    source: "crawler-counters" as const,
    generatedAt: row.generatedAt,
    observedRequests: row.observedRequests as number,
    window,
    actions,
  };
}
