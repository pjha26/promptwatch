import assert from "node:assert/strict";
import { test } from "node:test";
import { aggregatePublicPages, DAILY_PATH_LIMIT, publicAnalyticsPath } from "../lib/public-paths";
import { applyCrawlerPolicy, type CrawlerStore } from "../lib/crawler-policy";

test("path collection defaults to root only and uses prefix boundaries", () => {
  assert.equal(publicAnalyticsPath("/"), "/");
  assert.equal(publicAnalyticsPath("/blog/post"), null);
  assert.equal(
    publicAnalyticsPath("/blog/post?email=person@example.com#section", "/,/blog"),
    "/blog/post",
  );
  assert.equal(publicAnalyticsPath("/blogging/private-data", "/blog"), null);
});

test("private, encoded, control, credential and overlong paths never reach analytics", () => {
  for (const path of [
    "/docs/api/token",
    "/docs/%61ccount/person",
    "/docs/%2561ccount/person",
    "/docs/%",
    "/docs/%3Fsecret=123",
    "/docs/%23token",
    "/docs/../private",
    "/docs/hello@site.test",
    "/docs/" + "a".repeat(257),
    "/docs/a\\b",
    "/docs/%00test",
    "/docs/11111111-1111-4111-8111-111111111111",
    "//evil.example",
    "/docs/aa//bb",
  ]) {
    assert.equal(publicAnalyticsPath(path, "/,/docs"), null, path);
  }
});

test("page aggregation sums recorded days and filters old paths no longer allowlisted", () => {
  assert.deepEqual(
    aggregatePublicPages(
      [null, { "/": 2, "/docs/a": 3, "/private/token": 5 }, { "/": 4 }],
      "/,/docs",
    ),
    { "/": 6, "/docs/a": 3 },
  );
  assert.deepEqual(aggregatePublicPages([{ "/docs/a": 3 }], "/"), {});
  for (const row of [[1], { "/": -1 }, { "/": "3" }])
    assert.throws(() => aggregatePublicPages([row]));
  const oversized = Object.fromEntries(
    Array.from({ length: DAILY_PATH_LIMIT + 1 }, (_, index) => [`/docs/${index}`, 1]),
  );
  assert.throws(() => aggregatePublicPages([oversized], "/docs"));
  assert.throws(() => aggregatePublicPages([{ "/": Number.MAX_SAFE_INTEGER }, { "/": 1 }]));
});

test("path logging passes an explicit limit, query-free path and policy-specific keys", async () => {
  for (const policy of ["allow", "block"]) {
    const calls: { keys: string[]; args: (string | number)[] }[] = [];
    const store: CrawlerStore = {
      get: async () => policy,
      eval: async (_, keys, args) => {
        calls.push({ keys, args });
      },
    };
    await applyCrawlerPolicy(
      store,
      "gptbot",
      "2026-10-18",
      publicAnalyticsPath("/docs/a?secret=123", "/docs"),
    );
    assert.deepEqual(calls[0], {
      keys: [
        `${policy === "block" ? "blocked" : "bot"}:gptbot:2026-10-18`,
        `${policy === "block" ? "blocked-pages" : "pages"}:2026-10-18`,
        "paths:started_at",
      ],
      args: [2592000, "/docs/a", DAILY_PATH_LIMIT, "2026-10-18"],
    });
  }
});
