import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { GET as alertsCron } from "../app/api/cron/alerts/route";
import { parseAlertStatus } from "../lib/alert-status";
import { buildAlertCandidates } from "../lib/alert-candidates";
import { parseCollectorHealth } from "../lib/collector-health";
import { deriveCrawlerActions } from "../lib/crawler-actions";
import { reportDays } from "../lib/traffic-report";
import { RELEASE_IDENTITY_REFRESH } from "../lib/identity-refresh";
import {
  ALERT_LOCK_KEY,
  ALERT_STATE_KEY,
  deliverWebhook,
  parseAlertState,
  runWebhookAlerts,
  SAVE_ALERT_STATE,
  webhookConfiguration,
  type AlertEvent,
  type AlertStore,
} from "../lib/webhook-alerts";

const at = new Date("2026-10-22T04:00:00.000Z");

test("scheduled alerts stay dormant by default and require cron authentication and owner setup", async (t) => {
  const keys = [
    "PROMPTWATCH_ALERTS_ENABLED",
    "CRON_SECRET",
    "PROMPTWATCH_OWNER_ID",
    "PROMPTWATCH_WEBHOOK_URL",
    "PROMPTWATCH_WEBHOOK_SECRET",
  ];
  const original = keys.map((key) => process.env[key]);
  const secret = "unit-test-only-alert-cron-secret-32chars";
  const network = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("No network calls allowed before setup");
  });
  try {
    process.env.PROMPTWATCH_ALERTS_ENABLED = "false";
    assert.deepEqual(
      await (await alertsCron(new Request("https://site.example/api/cron/alerts"))).json(),
      { status: "disabled" },
    );
    process.env.PROMPTWATCH_ALERTS_ENABLED = "true";
    process.env.CRON_SECRET = secret;
    process.env.PROMPTWATCH_OWNER_ID = "";
    assert.equal(
      (await alertsCron(new Request("https://site.example/api/cron/alerts"))).status,
      401,
    );
    assert.equal(
      (
        await alertsCron(
          new Request("https://site.example/api/cron/alerts", {
            headers: { Authorization: `Bearer ${secret}` },
          }),
        )
      ).status,
      503,
    );
    process.env.PROMPTWATCH_OWNER_ID = "22222222-2222-4222-8222-222222222222";
    process.env.PROMPTWATCH_WEBHOOK_URL = "";
    process.env.PROMPTWATCH_WEBHOOK_SECRET = "";
    assert.equal(
      (
        await alertsCron(
          new Request("https://site.example/api/cron/alerts", {
            headers: { Authorization: `Bearer ${secret}` },
          }),
        )
      ).status,
      503,
    );
    assert.equal(network.mock.callCount(), 0);
  } finally {
    keys.forEach((key, index) => {
      if (original[index] === undefined) delete process.env[key];
      else process.env[key] = original[index];
    });
    network.mock.restore();
  }
});
function event(id = "spike:gptbot:2026-10-21", group = "spike:gptbot"): AlertEvent {
  return {
    id,
    group,
    type: "traffic-spike",
    title: "Recorded increase",
    occurredAt: "2026-10-21T23:59:59.999Z",
    details: ["Observed: 100"],
  };
}
function fixture() {
  const values = new Map<string, unknown>();
  const store: AlertStore = {
    get: async (key) => structuredClone(values.get(key) ?? null),
    set: async (key, value) => {
      if (values.has(key)) return null;
      values.set(key, value);
      return "OK";
    },
    eval: async (script, keys, args) => {
      if (values.get(keys[0]) !== args[0]) return 0;
      if (script === SAVE_ALERT_STATE) {
        values.set(keys[1], JSON.parse(String(args[1])));
        return 1;
      }
      assert.equal(script, RELEASE_IDENTITY_REFRESH);
      values.delete(keys[0]);
      return 1;
    },
  };
  return {
    store: () => store,
    values,
    state: () => parseAlertState(values.get(ALERT_STATE_KEY) ?? null),
  };
}

test("webhooks require opt-in HTTPS and a signing secret; payloads are signed and redirects disabled", async () => {
  const secret = "a".repeat(32);
  assert.equal(webhookConfiguration({}).enabled, false);
  for (const url of [
    "http://example.com",
    "https://user:pass@example.com",
    "https://example.com/#secret",
    "invalid",
  ])
    assert.equal(
      webhookConfiguration({
        PROMPTWATCH_ALERTS_ENABLED: "true",
        PROMPTWATCH_WEBHOOK_URL: url,
        PROMPTWATCH_WEBHOOK_SECRET: secret,
      }).ready,
      false,
    );
  assert.equal(
    webhookConfiguration({
      PROMPTWATCH_ALERTS_ENABLED: "true",
      PROMPTWATCH_WEBHOOK_URL: "https://example.com/hook",
      PROMPTWATCH_WEBHOOK_SECRET: secret,
    }).ready,
    true,
  );
  let calls = 0;
  await deliverWebhook(event(), "https://example.com/hook", secret, async (url, init) => {
    calls++;
    assert.equal(url, "https://example.com/hook");
    assert.equal(init?.redirect, "error");
    assert.ok(init?.signal);
    const headers = new Headers(init?.headers);
    const body = String(init?.body);
    assert.equal(
      headers.get("x-promptwatch-signature"),
      `v1=${createHmac("sha256", secret)
        .update(`${headers.get("x-promptwatch-timestamp")}.${body}`)
        .digest("hex")}`,
    );
    assert.equal(JSON.parse(body).eventId, event().id);
    assert.ok(!body.includes(secret));
    return new Response(null, { status: 204 });
  });
  assert.equal(calls, 1);
  await assert.rejects(
    deliverWebhook(
      event(),
      "https://example.com",
      secret,
      async () => new Response("private receiver error", { status: 500 }),
    ),
  );
});

test("attempts are durable before delivery; exact events and rolling groups are deduplicated", async () => {
  const f = fixture();
  let sent = 0;
  const deliver = async () => {
    assert.equal(f.state().entries[0].attempts, 1);
    sent++;
  };
  await runWebhookAlerts(f.store, async () => [event()], deliver, at);
  assert.equal(f.state().entries[0].status, "delivered");
  await runWebhookAlerts(f.store, async () => [event(), event("another-window")], deliver, at);
  assert.equal(sent, 1);
  assert.equal(f.values.has(ALERT_LOCK_KEY), false);
  assert.equal(f.state().lastRun?.attempted, 0);
});

test("failed deliveries retry only after backoff and stop after three attempts", async () => {
  const f = fixture();
  let sent = 0;
  const fail = async () => {
    sent++;
    throw new Error("timeout");
  };
  const run = (offset: number) =>
    runWebhookAlerts(f.store, async () => [event()], fail, new Date(at.getTime() + offset));
  assert.equal((await run(0)).status, "partial");
  await run(1000);
  assert.equal(sent, 1);
  await run(3_600_000);
  assert.equal(sent, 2);
  await run(25 * 3_600_000);
  assert.equal(sent, 3);
  await run(49 * 3_600_000);
  assert.equal(sent, 3);
  assert.equal(f.state().entries[0].status, "exhausted");
});

test("queue bounds sends, resumes pending work, and cancels recovered signals", async () => {
  const f = fixture();
  const events = Array.from({ length: 6 }, (_, index) => event(`event:${index}`, `group:${index}`));
  let sent = 0;
  const deliver = async () => {
    sent++;
  };
  await runWebhookAlerts(f.store, async () => events, deliver, at);
  assert.equal(sent, 4);
  assert.equal(f.state().entries.filter((entry) => entry.status === "pending").length, 2);
  await runWebhookAlerts(f.store, async () => events.slice(0, 5), deliver, at);
  assert.equal(sent, 5);
  assert.equal(f.state().entries[5].status, "cancelled");
  await runWebhookAlerts(
    f.store,
    async () =>
      [event("old", "old")].map((row) => ({ ...row, occurredAt: "2026-09-01T00:00:00.000Z" })),
    deliver,
    at,
  );
  assert.equal(sent, 5);
});

test("a busy or lost lease and an unconfirmed pre-send save cannot produce an external send", async () => {
  const f = fixture();
  let sent = 0;
  f.values.set(ALERT_LOCK_KEY, "another-owner");
  assert.equal(
    (
      await runWebhookAlerts(
        f.store,
        async () => [event()],
        async () => {
          sent++;
        },
        at,
      )
    ).status,
    "busy",
  );
  f.values.delete(ALERT_LOCK_KEY);
  await assert.rejects(
    runWebhookAlerts(
      f.store,
      async () => {
        f.values.set(ALERT_LOCK_KEY, "replacement");
        return [event()];
      },
      async () => {
        sent++;
      },
      at,
    ),
  );
  assert.equal(f.values.get(ALERT_LOCK_KEY), "replacement");
  assert.equal(sent, 0);
});

test("full queues report overflow and expired evidence is removed instead of evicting pending work", async () => {
  const f = fixture();
  f.values.set(ALERT_STATE_KEY, {
    entries: Array.from({ length: 100 }, (_, index) => ({
      event: event(`saved:${index}`, `saved:${index}`),
      createdAt: at.toISOString(),
      expiresAt: "2026-10-28T00:00:00.000Z",
      nextAttemptAt: at.toISOString(),
      attempts: 1,
      status: "delivered",
      deliveredAt: at.toISOString(),
    })),
    lastRun: null,
  });
  let sends = 0;
  await runWebhookAlerts(
    f.store,
    async () => [event()],
    async () => {
      sends++;
    },
    at,
  );
  assert.equal(sends, 0);
  assert.equal(f.state().entries.length, 100);
  assert.equal(f.state().lastRun?.dropped, 1);
  await runWebhookAlerts(
    f.store,
    async () => [event()],
    async () => {
      sends++;
    },
    new Date("2026-10-30T04:00:00.000Z"),
  );
  assert.equal(f.state().entries.length, 0);
});

test("malformed durable state and status responses fail visibly", () => {
  assert.deepEqual(parseAlertState(null), { entries: [], lastRun: null });
  for (const bad of [
    undefined,
    {},
    { entries: [event()], lastRun: null },
    { entries: [], lastRun: {} },
  ])
    assert.throws(() => parseAlertState(bad));
  const status = { enabled: false, ready: false, lastRun: null, deliveries: [] };
  assert.deepEqual(parseAlertStatus(status), status);
  for (const bad of [
    { ...status, ready: true },
    { ...status, deliveries: [{}] },
    { ...status, lastRun: {} },
  ])
    assert.throws(() => parseAlertStatus(bad));
});

test("a failed pre-send checkpoint stops delivery and an uncertain acknowledgement keeps the same event ID", async () => {
  const f = fixture();
  const evaluate = f.store().eval;
  f.store().eval = async (script, keys, args) => {
    if (script === SAVE_ALERT_STATE && JSON.parse(String(args[1])).entries[0]?.attempts === 1)
      return 0;
    return evaluate(script, keys, args);
  };
  let sends = 0;
  await assert.rejects(
    runWebhookAlerts(
      f.store,
      async () => [event()],
      async () => {
        sends++;
      },
      at,
    ),
  );
  assert.equal(sends, 0);
  f.store().eval = evaluate;
  let failCompletion = true;
  f.store().eval = async (script, keys, args) => {
    if (
      script === SAVE_ALERT_STATE &&
      JSON.parse(String(args[1])).entries[0]?.status === "delivered" &&
      failCompletion
    )
      return 0;
    return evaluate(script, keys, args);
  };
  const ids: string[] = [];
  await assert.rejects(
    runWebhookAlerts(
      f.store,
      async () => [event()],
      async (row) => {
        ids.push(row.id);
      },
      at,
    ),
  );
  assert.equal(f.state().entries[0].status, "pending");
  failCompletion = false;
  await runWebhookAlerts(
    f.store,
    async () => [event()],
    async (row) => {
      ids.push(row.id);
    },
    new Date(at.getTime() + 3_600_000),
  );
  assert.deepEqual(ids, [event().id, event().id]);
  assert.equal(f.state().entries[0].attempts, 2);
});

test("candidates use actual active spikes and confirmed failure markers; quiet or recovered traffic is not an outage", () => {
  const history = {
    days: reportDays(at),
    bots: [
      {
        id: "gptbot",
        name: "GPTBot",
        hitsByDay: [...Array(15).fill(0), ...Array(7).fill(2), ...Array(7).fill(20), 0],
        blockedByDay: Array(30).fill(0),
      },
    ],
  };
  const actions = deriveCrawlerActions(history, "2026-10-22").actions;
  assert.equal(buildAlertCandidates(actions, parseCollectorHealth(null), null).length, 1);
  assert.equal(
    buildAlertCandidates(
      actions.map((action) => ({ ...action, status: "accepted" as const })),
      parseCollectorHealth(null),
      null,
    ).length,
    0,
  );
  assert.equal(buildAlertCandidates([], parseCollectorHealth(null), null).length, 0);
  const failure = { lastFailureAt: at.toISOString(), lastFailureKind: "counter-write" };
  assert.equal(
    buildAlertCandidates([], parseCollectorHealth(failure), null)[0].type,
    "collector-failure",
  );
  assert.equal(
    buildAlertCandidates(
      [],
      parseCollectorHealth({ ...failure, lastRecordedAt: "2026-10-22T04:01:00.000Z" }),
      null,
    ).length,
    0,
  );
});
