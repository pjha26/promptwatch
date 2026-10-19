import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parsePolicyHistory,
  savePolicyWithHistory,
  POLICY_HISTORY_KEY,
  POLICY_HISTORY_LIMIT,
  SAVE_POLICY,
} from "../lib/policy-history";

const entry = {
  id: "11111111-1111-4111-8111-111111111111",
  botId: "gptbot",
  previous: "allow",
  policy: "block",
  actor: "owner",
  changedAt: "2026-10-19T12:00:00.000Z",
};

test("policy history accepts Redis JSON or decoded entries, preserving list order", () => {
  assert.deepEqual(parsePolicyHistory([]), []);
  assert.deepEqual(parsePolicyHistory([JSON.stringify(entry)]), [entry]);
  assert.deepEqual(parsePolicyHistory([entry]), [entry]);
});

test("invalid or duplicated policy history is an error, never a manufactured empty history", () => {
  for (const value of [null, {}, [null], ["bad json"], [entry, entry], Array(201).fill(entry)])
    assert.throws(() => parsePolicyHistory(value));
  for (const patch of [
    { id: "bad" },
    { botId: "unknown" },
    { botId: "google-extended" },
    { previous: "throttle" },
    { policy: "allow" },
    { actor: "anonymous" },
    { changedAt: "yesterday" },
    { changedAt: "2026-02-30T12:00:00.000Z" },
  ])
    assert.throws(() => parsePolicyHistory([{ ...entry, ...patch }]));
});

test("policy saves use one bounded script on the existing authoritative key", async () => {
  const saved = await savePolicyWithHistory(
    {
      eval: async (script, keys, args) => {
        assert.equal(script, SAVE_POLICY);
        assert.deepEqual(keys, ["policy:gptbot", POLICY_HISTORY_KEY]);
        assert.equal(args[0], "block");
        assert.equal(new Date(String(args[1])).toISOString(), args[1]);
        assert.match(String(args[2]), /^[0-9a-f-]{36}$/);
        assert.equal(args[3], "gptbot");
        assert.equal(args[4], POLICY_HISTORY_LIMIT);
        return 1;
      },
    },
    { botId: "gptbot", policy: "block" },
  );
  assert.deepEqual(saved, { botId: "gptbot", policy: "block", changed: true });
  assert.equal((await savePolicyWithHistory({ eval: async () => 0 }, saved)).changed, false);
});

test("invalid requests, storage errors and unconfirmed replies cannot report a successful policy save", async () => {
  let called = false;
  await assert.rejects(
    savePolicyWithHistory(
      {
        eval: async () => {
          called = true;
          return 1;
        },
      },
      { botId: "unknown", policy: "block" },
    ),
  );
  assert.equal(called, false);
  await assert.rejects(
    savePolicyWithHistory(
      {
        eval: async () => {
          throw new Error("offline");
        },
      },
      { botId: "gptbot", policy: "block" },
    ),
  );
  await assert.rejects(
    savePolicyWithHistory({ eval: async () => null }, { botId: "gptbot", policy: "block" }),
  );
});
