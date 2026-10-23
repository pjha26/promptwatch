import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deriveCrawlerActions,
  parseActionResponse,
  parseActionUpdate,
  parseDecision,
} from "../lib/crawler-actions";
import { reportDays, type TrafficHistory } from "../lib/traffic-report";

const asOf = "2026-10-19";
function fixture(id = "gptbot"): TrafficHistory {
  return {
    days: reportDays(new Date(`${asOf}T12:00:00Z`)),
    bots: [{ id, name: id, hitsByDay: Array(30).fill(0), blockedByDay: Array(30).fill(0) }],
  };
}
function spike() {
  const history = fixture();
  history.bots[0].hitsByDay[15] = 10;
  history.bots[0].hitsByDay[22] = 20;
  return history;
}

test("quota denials remain observed traffic without becoming repeated policy blocks", () => {
  const history = fixture();
  history.bots[0].limitedByDay = Array(30).fill(0);
  history.bots[0].limitedByDay[15] = 10;
  history.bots[0].limitedByDay[22] = 20;
  const snapshot = deriveCrawlerActions(history, asOf);
  assert.equal(snapshot.observedRequests, 20);
  assert.equal(snapshot.actions[0].type, "traffic-spike");
  assert.ok(!snapshot.actions.some((action) => action.type === "repeated-blocks"));
});

test("traffic rules compare full UTC windows and exclude today's partial data", () => {
  const history = spike();
  history.bots[0].hitsByDay[29] = 50_000;
  const before = JSON.stringify(history);
  const snapshot = deriveCrawlerActions(history, asOf);
  assert.deepEqual(snapshot.window, { start: "2026-10-12", end: "2026-10-18" });
  assert.equal(snapshot.observedRequests, 20);
  assert.equal(snapshot.actions.length, 1);
  assert.equal(snapshot.actions[0].type, "traffic-spike");
  assert.deepEqual(
    snapshot.actions[0].evidence.slice(0, 2).map((metric) => metric.value),
    [20, 10],
  );
  assert.equal(snapshot.actions[0].id, "crawler:traffic-spike:gptbot:2026-10-18");
  assert.equal(JSON.stringify(history), before);
  assert.deepEqual(deriveCrawlerActions(history, asOf), snapshot);
});

test("zero/low baselines and low traffic never manufacture percentage-spike recommendations", () => {
  for (const previous of [0, 1, 9]) {
    const history = spike();
    history.bots[0].hitsByDay[15] = previous;
    assert.ok(
      !deriveCrawlerActions(history, asOf).actions.some(
        (action) => action.type === "traffic-spike",
      ),
    );
  }
  const history = spike();
  history.bots[0].hitsByDay[22] = 19;
  assert.equal(deriveCrawlerActions(history, asOf).actions.length, 0);
});

test("repeated-block actions require multiple days and include blocked-only crawlers", () => {
  const history = fixture("claudebot");
  history.bots[0].blockedByDay[22] = 20;
  assert.ok(
    !deriveCrawlerActions(history, asOf).actions.some(
      (action) => action.type === "repeated-blocks",
    ),
  );
  history.bots[0].blockedByDay[23] = 5;
  const action = deriveCrawlerActions(history, asOf).actions.find(
    (candidate) => candidate.type === "repeated-blocks",
  )!;
  assert.equal(action.evidence[0].value, 25);
  assert.equal(action.evidence[1].value, 2);
  assert.equal(action.source_url, "/dashboard/settings");
});

test("recent discovery is limited to positive retained evidence and a minimum sample", () => {
  const history = fixture("perplexitybot");
  history.bots[0].hitsByDay[25] = 4;
  assert.equal(deriveCrawlerActions(history, asOf).actions.length, 0);
  history.bots[0].hitsByDay[25] = 5;
  const discovery = deriveCrawlerActions(history, asOf).actions[0];
  assert.equal(discovery.type, "new-activity");
  assert.ok(discovery.description.includes("does not prove"));
  assert.ok(discovery.id.endsWith("2026-10-15"));
  history.bots[0].hitsByDay[0] = 1;
  assert.equal(deriveCrawlerActions(history, asOf).actions.length, 0);
});

test("legacy robots-only counts and insufficient completed history do not trigger live actions", () => {
  const history = fixture("google-extended");
  history.bots[0].blockedByDay.fill(500);
  assert.deepEqual(deriveCrawlerActions(history, asOf).actions, []);
  const short = fixture();
  short.days = short.days.slice(-6);
  short.bots[0].hitsByDay = Array(6).fill(100);
  short.bots[0].blockedByDay = Array(6).fill(100);
  assert.equal(deriveCrawlerActions(short, asOf).window, null);
  assert.deepEqual(deriveCrawlerActions(short, asOf).actions, []);
});

test("empty traffic has no recommendations; unavailable data is handled by the API as an error", () => {
  const snapshot = deriveCrawlerActions(fixture(), asOf);
  assert.equal(snapshot.actions.length, 0);
  assert.equal(snapshot.observedRequests, 0);
  assert.ok(snapshot.window);
});

test("action decisions validate supported kind, crawler, calendar date and status", () => {
  const id = "crawler:traffic-spike:gptbot:2026-10-18";
  assert.deepEqual(parseActionUpdate({ id, status: "accepted" }), { id, status: "accepted" });
  for (const value of [
    null,
    [],
    { id, status: "block" },
    { id: "crawler:traffic-spike:google-extended:2026-10-18", status: "active" },
    { id: "crawler:traffic-spike:gptbot:2026-02-30", status: "active" },
    { id: "crawler:unknown:gptbot:2026-10-18", status: "active" },
    { id: id + ":extra", status: "active" },
  ])
    assert.throws(() => parseActionUpdate(value));
});

test("corrupted saved decisions never silently revert reviewed actions to active", () => {
  assert.deepEqual(parseDecision(null), { status: "active", reviewedAt: null });
  assert.deepEqual(parseDecision({ status: "dismissed", reviewedAt: "2026-10-19T12:00:00.000Z" }), {
    status: "dismissed",
    reviewedAt: "2026-10-19T12:00:00.000Z",
  });
  for (const value of [
    "accepted",
    {},
    { status: "accepted" },
    { status: "accepted", reviewedAt: "yesterday" },
    { status: "block", reviewedAt: "2026-10-19T12:00:00.000Z" },
  ])
    assert.throws(() => parseDecision(value));
});

test("client action responses require valid evidence and safe local destinations", () => {
  const payload = {
    ...deriveCrawlerActions(spike(), asOf),
    source: "crawler-counters",
    generatedAt: "2026-10-19T12:00:00.000Z",
  };
  assert.equal(parseActionResponse(payload).actions.length, 1);
  const unsafe = structuredClone(payload);
  unsafe.actions[0].source_url = "https://evil.example" as "/dashboard/traffic";
  assert.throws(() => parseActionResponse(unsafe));
  const broken = structuredClone(payload);
  broken.actions[0].evidence = [];
  assert.throws(() => parseActionResponse(broken));
  const unconfirmed = structuredClone(payload);
  unconfirmed.actions[0].status = "accepted";
  assert.throws(() => parseActionResponse(unconfirmed));
  assert.throws(() => parseActionResponse({ actions: [] }));
});
