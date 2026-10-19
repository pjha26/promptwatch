import assert from "node:assert/strict";
import { test } from "node:test";
import { applyCrawlerPolicy, type CrawlerStore } from "../lib/crawler-policy";
const observedAt = "2026-10-18T12:00:00.000Z";

test("allowed and blocked hits retain existing key names and 30-day retention", async () => {
  for (const policy of [null, "allow", "block"]) {
    const writes: { keys: string[]; args: (string | number)[] }[] = [];
    const store: CrawlerStore = {
      get: async (key) => {
        assert.equal(key, "policy:gptbot");
        return policy;
      },
      eval: async (_, keys, args) => {
        writes.push({ keys, args });
      },
    };
    assert.equal(
      await applyCrawlerPolicy(store, "gptbot", "2026-10-18", null, observedAt),
      policy === "block",
    );
    assert.deepEqual(writes, [
      {
        keys: [`${policy === "block" ? "blocked" : "bot"}:gptbot:2026-10-18`, "collector:health"],
        args: [2592000, observedAt],
      },
    ]);
  }
});

test("a known block still blocks when its analytics write fails", async () => {
  const store: CrawlerStore = {
    get: async () => "block",
    eval: async () => {
      throw new Error("offline");
    },
  };
  assert.equal(await applyCrawlerPolicy(store, "gptbot", "2026-10-18"), true);
});

test("unavailable or corrupted policy reads are distinguished from confirmed allow rules", async () => {
  let writes = 0;
  for (const get of [
    async () => {
      throw new Error("offline");
    },
    async () => "bad",
  ]) {
    const store: CrawlerStore = {
      get,
      eval: async (_, keys, args) => {
        assert.deepEqual(keys, ["collector:health"]);
        assert.equal(args[1], "policy-read");
        writes++;
      },
    };
    await assert.rejects(applyCrawlerPolicy(store, "gptbot", "2026-10-18"));
  }
  assert.equal(writes, 2);
});
