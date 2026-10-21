import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { test } from "node:test";
import { applyCrawlerPolicy, type CrawlerStore } from "../lib/crawler-policy";
import { parseCollectorHealth } from "../lib/collector-health";
import { IDENTITY_STATUSES } from "../lib/crawler-identity";
import {
  COMPLETE_IDENTITY_REFRESH,
  IDENTITY_REFRESH_LOCK,
  IDENTITY_REFRESH_RESULT,
  parseRefreshResult,
  RELEASE_IDENTITY_REFRESH,
  runIdentityRefresh,
  type RefreshStore,
} from "../lib/identity-refresh";
import {
  parsePolicyHistory,
  POLICY_HISTORY_KEY,
  POLICY_HISTORY_LIMIT,
  savePolicyWithHistory,
} from "../lib/policy-history";

const execute = promisify(execFile);
const container = process.env.PROMPTWATCH_TEST_REDIS_CONTAINER;
if (!container || !/^[a-f0-9]{12,64}$/.test(container))
  throw new Error(
    "Set PROMPTWATCH_TEST_REDIS_CONTAINER to a disposable Redis container ID. No production Redis is used.",
  );

test("real Redis scripts preserve collector behavior and consistent bounded policy history", async () => {
  const prefix = `test:${crypto.randomUUID()}:`;
  const touched = new Set<string>();
  const key = (value: string) => {
    const scoped = prefix + value;
    touched.add(scoped);
    return scoped;
  };
  const command = async (...args: string[]) => {
    const { stdout } = await execute(
      "docker",
      ["exec", container, "redis-cli", "--json", "-e", ...args],
      { timeout: 10_000, maxBuffer: 1_000_000, windowsHide: true },
    );
    return JSON.parse(stdout.trim());
  };
  const store: CrawlerStore = {
    get: async (name) => command("GET", key(name)),
    eval: async (script, keys, args) =>
      command("EVAL", script, String(keys.length), ...keys.map(key), ...args.map(String)),
  };
  const history = async () =>
    parsePolicyHistory(await command("LRANGE", key(POLICY_HISTORY_KEY), "0", "-1"));
  try {
    assert.equal(
      (await savePolicyWithHistory(store, { botId: "gptbot", policy: "allow" })).changed,
      false,
    );
    assert.deepEqual(await history(), []);
    assert.equal(
      (await savePolicyWithHistory(store, { botId: "gptbot", policy: "block" })).changed,
      true,
    );
    assert.equal(await store.get("policy:gptbot"), "block");
    assert.equal((await history())[0].previous, "allow");
    await Promise.all(
      Array.from({ length: 5 }, () =>
        savePolicyWithHistory(store, { botId: "gptbot", policy: "block" }),
      ),
    );
    assert.equal(
      (await history()).length,
      1,
      "concurrent identical saves must not duplicate changes",
    );
    await savePolicyWithHistory(store, { botId: "gptbot", policy: "allow" });
    assert.deepEqual(
      (await history()).map((entry) => [entry.previous, entry.policy]),
      [
        ["block", "allow"],
        ["allow", "block"],
      ],
    );

    await command("DEL", key(POLICY_HISTORY_KEY));
    await command("SET", key(POLICY_HISTORY_KEY), "wrong type");
    await assert.rejects(savePolicyWithHistory(store, { botId: "gptbot", policy: "block" }));
    assert.equal(
      await store.get("policy:gptbot"),
      "allow",
      "invalid history must prevent policy mutation",
    );
    await command("DEL", key(POLICY_HISTORY_KEY));
    await command("SET", key("policy:gptbot"), "invalid policy");
    await assert.rejects(savePolicyWithHistory(store, { botId: "gptbot", policy: "block" }));
    assert.deepEqual(await history(), []);
    await command("DEL", key("policy:gptbot"));

    // Seed only the isolated history to exercise trimming without hundreds of Docker launches.
    const old = JSON.stringify({
      id: "11111111-1111-4111-8111-111111111111",
      botId: "gptbot",
      previous: "block",
      policy: "allow",
      actor: "owner",
      changedAt: "2026-10-19T00:00:00.000Z",
    });
    await command("LPUSH", key(POLICY_HISTORY_KEY), ...Array(POLICY_HISTORY_LIMIT).fill(old));
    await savePolicyWithHistory(store, { botId: "gptbot", policy: "block" });
    assert.equal(await command("LLEN", key(POLICY_HISTORY_KEY)), POLICY_HISTORY_LIMIT);
    assert.equal(await command("TTL", key("policy:gptbot")), -1, "policies must not expire");
    assert.equal(await command("TTL", key(POLICY_HISTORY_KEY)), -1);

    const at = "2026-10-19T12:00:00.000Z";
    assert.equal(await applyCrawlerPolicy(store, "gptbot", "2026-10-19", "/docs", at), true);
    assert.equal(await command("GET", key("blocked:gptbot:2026-10-19")), "1");
    assert.equal(await command("HGET", key("blocked-pages:2026-10-19"), "/docs"), "1");
    const metadata = {
      firstRecordedAt: await command("HGET", key("collector:health"), "firstRecordedAt"),
      lastRecordedAt: await command("HGET", key("collector:health"), "lastRecordedAt"),
    };
    assert.equal(parseCollectorHealth(metadata).lastRecordedAt, at);
    const ttl = await command("TTL", key("blocked:gptbot:2026-10-19"));
    assert.ok(ttl > 2_591_900 && ttl <= 2_592_000);

    await savePolicyWithHistory(store, { botId: "gptbot", policy: "allow" });
    assert.equal(await applyCrawlerPolicy(store, "gptbot", "2026-10-19", null, at), false);
    assert.equal(await command("GET", key("bot:gptbot:2026-10-19")), "1");

    await command(
      "EVAL",
      "for i = 1, 200 do redis.call('HSET', KEYS[1], '/public-' .. i, 1) end return 1",
      "1",
      key("pages:2026-10-19"),
    );
    await applyCrawlerPolicy(store, "gptbot", "2026-10-19", "/new-path", at);
    assert.equal(await command("HLEN", key("pages:2026-10-19")), 200);
    assert.equal(await command("HGET", key("pages:2026-10-19"), "/new-path"), null);
    assert.equal(await command("GET", key("bot:gptbot:2026-10-19")), "2");
    await applyCrawlerPolicy(store, "gptbot", "2026-10-19", "/public-1", at);
    assert.equal(await command("HGET", key("pages:2026-10-19"), "/public-1"), "2");
    for (const status of IDENTITY_STATUSES) {
      for (const path of [null, "/public-1"]) {
        await applyCrawlerPolicy(store, "gptbot", "2026-10-21", path, at, Promise.resolve(status));
      }
      assert.equal(await command("HGET", key("identity:2026-10-21"), `gptbot:${status}`), "2");
    }
    assert.equal(await command("GET", key("bot:gptbot:2026-10-21")), "8");
    assert.ok((await command("TTL", key("identity:2026-10-21"))) > 2_591_900);
    await command("SET", key("identity:2026-10-21"), "wrong type");
    assert.equal(
      await applyCrawlerPolicy(
        store,
        "claudebot",
        "2026-10-21",
        null,
        at,
        Promise.resolve("unsupported"),
      ),
      false,
    );
    assert.equal(await command("GET", key("bot:claudebot:2026-10-21")), "1");

    const jobStore = (): RefreshStore => ({
      eval: store.eval,
      set: async (name, value, options) =>
        command("SET", key(name), value, "NX", "EX", String(options.ex)),
    });
    let refreshed = 0;
    assert.equal(
      (
        await runIdentityRefresh(jobStore, async () => {
          refreshed++;
        })
      ).status,
      "success",
    );
    assert.equal(refreshed, 5);
    assert.equal(await command("GET", key(IDENTITY_REFRESH_LOCK)), null);
    const savedCompletion = await command("GET", key(IDENTITY_REFRESH_RESULT));
    assert.equal(parseRefreshResult(JSON.parse(savedCompletion))?.status, "success");
    assert.ok((await command("TTL", key(IDENTITY_REFRESH_RESULT))) > 2_591_900);

    await command("SET", key(IDENTITY_REFRESH_LOCK), "other-owner", "EX", "120");
    assert.deepEqual(
      await runIdentityRefresh(jobStore, async () => {
        throw new Error("Busy job must not refresh");
      }),
      { status: "busy" },
    );
    assert.equal(
      await store.eval(RELEASE_IDENTITY_REFRESH, [IDENTITY_REFRESH_LOCK], ["wrong-owner"]),
      0,
    );
    assert.equal(
      await store.eval(
        COMPLETE_IDENTITY_REFRESH,
        [IDENTITY_REFRESH_LOCK, IDENTITY_REFRESH_RESULT],
        ["wrong-owner", "invalid-result", 60],
      ),
      0,
    );
    assert.equal(await command("GET", key(IDENTITY_REFRESH_RESULT)), savedCompletion);
    assert.equal(await command("GET", key(IDENTITY_REFRESH_LOCK)), "other-owner");
    assert.equal(
      await store.eval(RELEASE_IDENTITY_REFRESH, [IDENTITY_REFRESH_LOCK], ["other-owner"]),
      1,
    );

    await assert.rejects(
      runIdentityRefresh(jobStore, async (botId) => {
        if (botId === "gptbot")
          await command("SET", key(IDENTITY_REFRESH_LOCK), "replacement-owner", "EX", "120");
      }),
    );
    assert.equal(
      await command("GET", key(IDENTITY_REFRESH_LOCK)),
      "replacement-owner",
      "late cleanup must not remove a replacement lease",
    );
    assert.equal(
      await command("GET", key(IDENTITY_REFRESH_RESULT)),
      savedCompletion,
      "late completion must not replace confirmed metadata",
    );
  } finally {
    if (touched.size) await command("DEL", ...touched);
  }
});
