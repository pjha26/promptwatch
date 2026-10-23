import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCollectorHealth, parseHealthResponse } from "../lib/collector-health";
import { applyCrawlerPolicy, type CrawlerStore } from "../lib/crawler-policy";

const earlier = "2026-10-18T12:00:00.000Z";
const later = "2026-10-19T12:00:00.000Z";

test("no collector evidence is unknown rather than confirmed healthy or broken", () => {
  assert.equal(parseCollectorHealth(null).status, "waiting");
  assert.equal(parseCollectorHealth({ lastSelfCheckAt: later }).status, "waiting");
  assert.equal(parseCollectorHealth({ lastRecordedAt: earlier }).status, "recorded");
});

test("collector failures remain visible until a later real request is recorded", () => {
  assert.equal(
    parseCollectorHealth({
      lastFailureAt: later,
      lastFailureKind: "counter-write",
      lastRecordedAt: earlier,
      lastSelfCheckAt: later,
    }).status,
    "degraded",
  );
  assert.equal(
    parseCollectorHealth({
      lastFailureAt: earlier,
      lastFailureKind: "policy-read",
      lastRecordedAt: later,
    }).status,
    "recorded",
  );
  assert.equal(
    parseCollectorHealth({
      lastFailureAt: later,
      lastFailureKind: "policy-read",
      lastRecordedAt: later,
    }).status,
    "degraded",
  );
});

test("corrupted service responses do not become reassuring health indicators", () => {
  for (const value of [
    [],
    "ok",
    { lastRecordedAt: "yesterday" },
    { lastFailureAt: later },
    { lastFailureKind: "secret-error-stack" },
  ])
    assert.throws(() => parseCollectorHealth(value));
  assert.throws(() => parseHealthResponse({ redis: "reachable", checkedAt: "bad" }));
  assert.throws(() => parseHealthResponse({ redis: "unknown", checkedAt: later }));
  assert.equal(parseHealthResponse({ redis: "reachable", checkedAt: later }).status, "waiting");
});

test("a counter write failure records its stage without cancelling a confirmed block", async () => {
  let calls = 0;
  const store: CrawlerStore = {
    get: async () => "block",
    eval: async (_, keys, args) => {
      calls++;
      if (calls === 1) throw new Error("counter unavailable");
      assert.deepEqual(keys, ["collector:health"]);
      assert.deepEqual(args, [later, "counter-write", 2_592_000]);
    },
  };
  assert.equal(
    (await applyCrawlerPolicy(store, "gptbot", "2026-10-19", null, later)).outcome === "blocked",
    true,
  );
  assert.equal(calls, 2);
});
