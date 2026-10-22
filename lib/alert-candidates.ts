import type { CrawlerAction } from "./crawler-actions";
import type { parseCollectorHealth } from "./collector-health";
import type { RefreshResult } from "./identity-refresh";
import type { AlertEvent } from "./webhook-alerts";

export function buildAlertCandidates(
  actions: CrawlerAction[],
  health: ReturnType<typeof parseCollectorHealth>,
  refresh: RefreshResult | null,
): AlertEvent[] {
  const events: AlertEvent[] = actions
    .filter((action) => action.type === "traffic-spike" && action.status === "active")
    .map((action) => ({
      id: action.id,
      group: action.id.split(":").slice(0, 3).join(":"),
      type: "traffic-spike",
      title: action.title,
      occurredAt: action.created_at,
      details: [
        `UTC window: ${action.windowStart} to ${action.windowEnd}`,
        ...action.evidence.map((item) => `${item.label}: ${item.value}`),
      ],
    }));
  if (health.status === "degraded" && health.lastFailureAt && health.lastFailureKind)
    events.push({
      id: `collector:${health.lastFailureKind}:${health.lastFailureAt}`,
      group: `collector:${health.lastFailureKind}`,
      type: "collector-failure",
      title: "Collector recorded a storage operation failure",
      occurredAt: health.lastFailureAt,
      details: [
        `Failed stage: ${health.lastFailureKind}`,
        "No later recorded request currently supersedes this marker. Failure markers are best-effort; this is not an uptime check.",
      ],
    });
  if (refresh && refresh.status !== "success")
    events.push({
      id: `feed-refresh:${refresh.id}`,
      group: "feed-refresh",
      type: "feed-refresh-failure",
      title: "Official crawler feed refresh was incomplete",
      occurredAt: refresh.finishedAt,
      details: refresh.results
        .filter((result) => result.status === "failed")
        .map((result) => `${result.botId}: failed`),
    });
  return events;
}
