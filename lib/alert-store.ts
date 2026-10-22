import { readCrawlerActionSnapshot } from "./action-store";
import { buildAlertCandidates } from "./alert-candidates";
import { COLLECTOR_HEALTH_KEY, parseCollectorHealth } from "./collector-health";
import { IDENTITY_REFRESH_RESULT, parseRefreshResult } from "./identity-refresh";
import { createRedis } from "./redis";
import {
  ALERT_STATE_KEY,
  deliverWebhook,
  parseAlertState,
  runWebhookAlerts,
  webhookConfiguration,
} from "./webhook-alerts";

export function alertConfiguration() {
  return webhookConfiguration(process.env);
}

async function readCandidates() {
  const snapshot = await readCrawlerActionSnapshot();
  const pipeline = createRedis().pipeline();
  pipeline.hgetall(COLLECTOR_HEALTH_KEY);
  pipeline.get(IDENTITY_REFRESH_RESULT);
  const [health, refresh] = await pipeline.exec();
  return buildAlertCandidates(
    snapshot.actions,
    parseCollectorHealth(health),
    parseRefreshResult(refresh),
  );
}

export async function runConfiguredAlerts() {
  const config = alertConfiguration();
  if (!config.enabled) return { status: "disabled" as const };
  if (!config.ready || !config.url || !config.secret)
    throw new Error("Webhook setup is incomplete");
  const { url, secret } = config;
  return runWebhookAlerts(createRedis, readCandidates, (event) =>
    deliverWebhook(event, url, secret),
  );
}

export async function readAlertStatus() {
  const config = alertConfiguration();
  const state = parseAlertState(await createRedis().get(ALERT_STATE_KEY));
  const now = new Date().toISOString();
  return {
    enabled: config.enabled,
    ready: config.ready,
    lastRun: state.lastRun,
    deliveries: state.entries
      .filter((entry) => entry.expiresAt > now)
      .slice(-20)
      .reverse()
      .map((entry) => ({
        id: entry.event.id,
        title: entry.event.title,
        status: entry.status,
        attempts: entry.attempts,
        nextAttemptAt: entry.status === "pending" ? entry.nextAttemptAt : null,
        deliveredAt: entry.deliveredAt,
      })),
  };
}
