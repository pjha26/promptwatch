import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSetupChecks } from "../lib/setup-checks";
import { botSignatures } from "../lib/botSignatures";
import { IDENTITY_SOURCES, IDENTITY_STATUSES } from "../lib/crawler-identity";

const fulfilled = (value: unknown): PromiseFulfilledResult<unknown> => ({
  status: "fulfilled",
  value,
});
const failed: PromiseRejectedResult = {
  status: "rejected",
  reason: new Error("source unavailable"),
};
const health = { redis: "reachable", checkedAt: "2026-10-22T04:00:00.000Z" };
const identity = {
  mode: "disabled",
  start: "2026-09-23",
  end: "2026-10-22",
  rows: botSignatures
    .filter((bot) => !bot.robotsOnly)
    .map((bot) => ({
      botId: bot.id,
      name: bot.name,
      source: IDENTITY_SOURCES[bot.id] ?? null,
      fetchedAt: null,
      fresh: false,
      counts: Object.fromEntries(IDENTITY_STATUSES.map((status) => [status, 0])),
    })),
  automaticRefresh: { configured: false, ready: false, lastRun: null },
};

test("setup distinguishes saved metadata, quiet collection and disabled optional features", () => {
  const checks = parseSetupChecks([
    fulfilled({ site: null }),
    fulfilled(health),
    fulfilled({ enabled: false, ready: false, lastRun: null, deliveries: [] }),
    fulfilled(identity),
  ]);
  assert.equal(checks.site.error, false);
  assert.equal(checks.site.data, null);
  assert.equal(checks.health.data?.status, "waiting");
  assert.equal(checks.alerts.data?.enabled, false);
  assert.equal(checks.identity.data?.mode, "disabled");
  assert.equal(checks.identity.data?.automaticRefresh.lastRun, null);
});

test("one unavailable or malformed source cannot hide independent setup results or become a reassuring default", () => {
  const checks = parseSetupChecks([
    fulfilled({}),
    fulfilled(health),
    failed,
    fulfilled({ ...identity, automaticRefresh: {} }),
  ]);
  assert.equal(checks.site.error, true);
  assert.equal(checks.health.error, false);
  assert.equal(checks.alerts.error, true);
  assert.equal(checks.identity.error, true);
  const unavailable = parseSetupChecks([failed, failed, failed, failed]);
  assert.ok(Object.values(unavailable).every((result) => result.error && result.data === null));
});
