import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { cronAccessStatus, cronSecretConfigured } from "../lib/cron-auth";
import { IDENTITY_SOURCES } from "../lib/crawler-identity";
import {
  COMPLETE_IDENTITY_REFRESH,
  IDENTITY_REFRESH_LOCK,
  IDENTITY_REFRESH_RESULT,
  parseAutomaticRefresh,
  parseRefreshResult,
  RELEASE_IDENTITY_REFRESH,
  runIdentityRefresh,
  type RefreshStore,
} from "../lib/identity-refresh";
import { GET } from "../app/api/cron/identity-feeds/route";

const secret = "unit-test-only-random-looking-cron-token";
const report = {
  id: "11111111-1111-4111-8111-111111111111",
  startedAt: "2026-10-21T03:00:00.000Z",
  finishedAt: "2026-10-21T03:00:06.000Z",
  status: "success",
  results: Object.keys(IDENTITY_SOURCES).map((botId) => ({ botId, status: "refreshed" })),
};

test("cron authorization fails closed for missing/weak configuration and forged requests", () => {
  for (const value of [undefined, "", "short", "a".repeat(257), "a ".repeat(20)]) {
    assert.equal(cronSecretConfigured(value), false);
    assert.equal(cronAccessStatus(`Bearer ${value}`, value), 503);
  }
  assert.equal(cronAccessStatus(`Bearer ${secret}`, secret), 200);
  for (const header of [
    null,
    secret,
    `bearer ${secret}`,
    `Bearer ${secret}x`,
    `Bearer x${secret}`,
    "Bearer undefined",
    "vercel-cron/1.0",
  ])
    assert.equal(cronAccessStatus(header, secret), 401);
});

test("disabled and unauthorized scheduled requests never reach storage or vendor feeds", async () => {
  const originals = {
    enabled: process.env.PROMPTWATCH_AUTO_REFRESH_FEEDS,
    secret: process.env.CRON_SECRET,
    owner: process.env.PROMPTWATCH_OWNER_ID,
  };
  try {
    process.env.PROMPTWATCH_AUTO_REFRESH_FEEDS = "false";
    assert.equal(
      (await GET(new Request("https://site.example/api/cron/identity-feeds"))).status,
      200,
    );
    process.env.PROMPTWATCH_AUTO_REFRESH_FEEDS = "true";
    process.env.CRON_SECRET = secret;
    assert.equal(
      (
        await GET(
          new Request("https://site.example/api/cron/identity-feeds", {
            headers: { "User-Agent": "vercel-cron/1.0" },
          }),
        )
      ).status,
      401,
    );
    process.env.PROMPTWATCH_OWNER_ID = "";
    assert.equal(
      (
        await GET(
          new Request("https://site.example/api/cron/identity-feeds", {
            headers: { Authorization: `Bearer ${secret}` },
          }),
        )
      ).status,
      503,
    );
  } finally {
    for (const [key, value] of [
      ["PROMPTWATCH_AUTO_REFRESH_FEEDS", originals.enabled],
      ["CRON_SECRET", originals.secret],
      ["PROMPTWATCH_OWNER_ID", originals.owner],
    ]) {
      if (value === undefined) delete process.env[key!];
      else process.env[key!] = value;
    }
  }
});

test("overlapping and unconfirmed leases do not run refreshes or release another job's lock", async () => {
  let touched = false;
  const busy: RefreshStore = {
    set: async () => null,
    eval: async () => {
      throw new Error("must not release another lease");
    },
  };
  assert.deepEqual(
    await runIdentityRefresh(
      () => busy,
      async () => {
        touched = true;
      },
    ),
    { status: "busy" },
  );
  assert.equal(touched, false);
  await assert.rejects(
    runIdentityRefresh(
      () => ({ ...busy, set: async () => "unknown" }),
      async () => {
        touched = true;
      },
    ),
  );
  assert.equal(touched, false);
});

test("one failed feed does not prevent others from refreshing; completion uses a fresh store client", async () => {
  const seen: string[] = [];
  let clients = 0;
  const makeStore = (): RefreshStore => {
    const client = ++clients;
    return {
      set: async (key, value, options) => {
        assert.equal(client, 1);
        assert.equal(key, IDENTITY_REFRESH_LOCK);
        assert.match(value, /^[a-f0-9-]{36}$/);
        assert.deepEqual(options, { nx: true, ex: 120 });
        return "OK";
      },
      eval: async (script, keys, args) => {
        assert.equal(client, 2);
        assert.equal(script, COMPLETE_IDENTITY_REFRESH);
        assert.deepEqual(keys, [IDENTITY_REFRESH_LOCK, IDENTITY_REFRESH_RESULT]);
        assert.equal(args[2], 2592000);
        const parsed = parseRefreshResult(JSON.parse(String(args[1])))!;
        assert.equal(parsed.status, "partial");
        assert.equal(parsed.results.filter((row) => row.status === "failed").length, 1);
        return 1;
      },
    };
  };
  const result = await runIdentityRefresh(makeStore, async (botId) => {
    seen.push(botId);
    if (botId === "gptbot") throw new Error("vendor error details must not be persisted");
  });
  assert.equal(result.status, "partial");
  assert.deepEqual(seen, Object.keys(IDENTITY_SOURCES));
  assert.equal(clients, 2);
  assert.ok(!JSON.stringify(result).includes("vendor error details"));
});

test("all-success and all-failed results are recorded honestly; uncertain completion is an error", async () => {
  for (const failed of [false, true]) {
    const result = await runIdentityRefresh(
      () => ({ set: async () => "OK", eval: async () => 1 }),
      async () => {
        if (failed) throw new Error("offline");
      },
    );
    assert.equal(result.status, failed ? "failed" : "success");
  }
  const scripts: string[] = [];
  await assert.rejects(
    runIdentityRefresh(
      () => ({
        set: async () => "OK",
        eval: async (script) => {
          scripts.push(script);
          return 0;
        },
      }),
      async () => undefined,
    ),
  );
  assert.deepEqual(scripts, [COMPLETE_IDENTITY_REFRESH, RELEASE_IDENTITY_REFRESH]);
});

test("corrupt stored job results never become a successful or empty status", () => {
  assert.equal(parseRefreshResult(null), null);
  assert.deepEqual(parseRefreshResult(report), report);
  assert.deepEqual(parseAutomaticRefresh({ configured: false, ready: false, lastRun: null }), {
    configured: false,
    ready: false,
    lastRun: null,
  });
  for (const patch of [
    { id: "bad" },
    { status: "failed" },
    { finishedAt: "yesterday" },
    { finishedAt: "2026-10-20T03:00:00.000Z" },
    { results: [] },
    { results: Array(5).fill(report.results[0]) },
  ])
    assert.throws(() => parseRefreshResult({ ...report, ...patch }));
  for (const value of [
    undefined,
    {},
    { configured: false, ready: true, lastRun: null },
    { configured: true, ready: true, lastRun: {} },
  ])
    assert.throws(() => parseAutomaticRefresh(value));
});

test("the deployed schedule targets the protected endpoint once daily", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.deepEqual(
    config.crons.filter((job: { path: string }) => job.path === "/api/cron/identity-feeds"),
    [{ path: "/api/cron/identity-feeds", schedule: "0 3 * * *" }],
  );
});
