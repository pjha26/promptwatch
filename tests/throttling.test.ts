import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseThrottleInput,
  parseThrottleRule,
  parseThrottleHistory,
  saveThrottleRule,
} from "../lib/throttle-rules";
import { parseMinuteSamples } from "../lib/throttle-report";
import { applyCrawlerPolicy, THROTTLE_VISIT } from "../lib/crawler-policy";
import { collectCrawlerRequest } from "../lib/crawler-request";

const rule = {
  mode: "observe",
  limit: 2,
  revision: "11111111-1111-4111-8111-111111111111",
  changedAt: "2026-10-23T00:00:00.000Z",
};

test("throttle configuration rejects unsupported bots, modes and ambiguous numeric limits", async () => {
  assert.deepEqual(parseThrottleInput({ botId: "gptbot", mode: "observe", limit: 2 }), {
    botId: "gptbot",
    mode: "observe",
    limit: 2,
  });
  for (const value of [
    null,
    {},
    { botId: "google-extended", mode: "observe", limit: 2 },
    { botId: "gptbot", mode: "observe", limit: "2" },
    { botId: "gptbot", mode: "observe", limit: 1.5 },
    { botId: "gptbot", mode: "observe", limit: 0 },
    { botId: "gptbot", mode: ["observe"], limit: 2 },
    { botId: "gptbot", mode: "off", limit: 2 },
  ])
    assert.throws(() => parseThrottleInput(value));
  assert.equal(parseThrottleRule(null), null);
  assert.deepEqual(parseThrottleRule(JSON.stringify(rule)), rule);
  assert.throws(() => parseThrottleRule({ ...rule, revision: "bad" }));
  assert.deepEqual(parseThrottleHistory([]), []);
  await assert.rejects(
    saveThrottleRule(
      { eval: async () => undefined },
      { botId: "gptbot", mode: "observe", limit: 2 },
    ),
  );
});

test("minute observations are bounded, exclude expired slots and reject corrupt or future samples", () => {
  assert.deepEqual(parseMinuteSamples(null, 100), []);
  assert.deepEqual(
    parseMinuteSamples(
      { "40": { minute: 100, count: 5 }, "39": JSON.stringify({ minute: 39, count: 2 }) },
      100,
    ),
    [{ minute: 100, count: 5 }],
  );
  for (const value of [
    { "40": { minute: 101, count: 1 } },
    { "40": { minute: 100, count: -1 } },
    { "99": { minute: 99, count: 1 } },
    { "40": "bad-json" },
  ])
    assert.throws(() => parseMinuteSamples(value, 100));
});

test("observe mode uses one counting operation and never denies; confirmed blocks bypass optional quota storage", async () => {
  const calls: string[] = [];
  const store = {
    get: async () => "allow",
    eval: async (script: string) => {
      calls.push(script);
      return [0, 0, 1, 1];
    },
  };
  assert.equal(
    (await applyCrawlerPolicy(store, "gptbot", "2026-10-23", null, rule.changedAt, undefined, true))
      .outcome === "blocked",
    false,
  );
  assert.deepEqual(calls, [THROTTLE_VISIT]);
  const response = await collectCrawlerRequest(
    new Request("https://example.com/", { headers: { "User-Agent": "GPTBot" } }),
    { throttlingEnabled: true, store: () => store },
  );
  assert.equal(response, null);
  const blocked = await collectCrawlerRequest(
    new Request("https://example.com/", { headers: { "User-Agent": "GPTBot" } }),
    {
      throttlingEnabled: true,
      store: () => ({
        get: async () => "block",
        eval: async (script) => {
          assert.notEqual(script, THROTTLE_VISIT);
          throw new Error("analytics offline");
        },
      }),
    },
  );
  assert.equal(blocked?.status, 403);
});

test("uncertain optional quota writes are not replayed and preserve availability with distinct failure evidence", async () => {
  let checks = 0;
  let failures = 0;
  const result =
    (
      await applyCrawlerPolicy(
        {
          get: async () => "allow",
          eval: async (script, keys, args) => {
            if (script === THROTTLE_VISIT) {
              checks++;
              throw new Error("ambiguous timeout");
            }
            assert.deepEqual(keys, ["collector:health"]);
            assert.equal(args[1], "throttle-check");
            failures++;
            return 1;
          },
        },
        "gptbot",
        "2026-10-23",
        null,
        rule.changedAt,
        undefined,
        true,
      )
    ).outcome === "blocked";
  assert.equal(result, false);
  assert.equal(checks, 1);
  assert.equal(failures, 1);
});

test("confirmed quotas return private HTTP 429 with bounded Retry-After even when optional counters fail", async () => {
  for (const recorded of [0, 1]) {
    const response = await collectCrawlerRequest(
      new Request("https://example.com/docs?token=private", {
        headers: { "User-Agent": "GPTBot" },
      }),
      {
        throttlingEnabled: true,
        store: () => ({
          get: async () => "allow",
          eval: async (script, keys) => {
            if (script !== THROTTLE_VISIT) return 1;
            assert.ok(keys.includes("limited:gptbot:" + new Date().toISOString().slice(0, 10)));
            return [2, 47, recorded, recorded];
          },
        }),
      },
    );
    assert.equal(response?.status, 429);
    assert.equal(response.headers.get("Retry-After"), "47");
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.deepEqual(await response.json(), {
      error: "Crawler request limit exceeded",
      retryAfter: 47,
    });
  }
  for (const tuple of [
    [2, 0, 1, 1],
    [2, 61, 1, 1],
    [2, "47", 1, 1],
    [1, 47, 1, 1],
    [2, 47],
  ]) {
    const response = await collectCrawlerRequest(
      new Request("https://example.com/docs", { headers: { "User-Agent": "GPTBot" } }),
      {
        throttlingEnabled: true,
        store: () => ({ get: async () => "allow", eval: async () => tuple }),
      },
    );
    assert.equal(response, null, "unconfirmed quota responses fail open");
  }
});
