import assert from "node:assert/strict";
import { test } from "node:test";
import {
  feedIsFresh,
  FEED_MAX_AGE_MS,
  feedKey,
  matchesRange,
  parseIdentityFeed,
  parseVendorRanges,
  verifyCrawlerIdentity,
} from "../lib/crawler-identity";
import { applyCrawlerPolicy } from "../lib/crawler-policy";
import { downloadIdentityFeed } from "../lib/identity-store";
import { parseIdentityReport, IDENTITY_SOURCES, IDENTITY_STATUSES } from "../lib/crawler-identity";
import { botSignatures } from "../lib/botSignatures";
import { aggregateIdentityCounts } from "../lib/crawler-identity";

test("bounded daily identity hashes aggregate supported observations and reject corrupted data", () => {
  const totals = aggregateIdentityCounts([
    null,
    { "gptbot:verified": 2, "claudebot:unsupported": 3 },
    { "gptbot:verified": 4, "gptbot:unavailable": 1 },
  ]);
  assert.equal(totals.gptbot.verified, 6);
  assert.equal(totals.gptbot.unavailable, 1);
  assert.equal(totals.claudebot.unsupported, 3);
  for (const row of [
    [],
    "bad",
    { "gptbot:verified": -1 },
    { "gptbot:verified": "2" },
    { "gptbot:verified": 1.5 },
    { "gptbot:verified": Number.MAX_SAFE_INTEGER + 1 },
    { "unknown:verified": 1 },
    { "google-extended:verified": 1 },
    { "gptbot:bad": 1 },
    { "gptbot:verified:extra": 1 },
  ])
    assert.throws(() => aggregateIdentityCounts([row]));
  assert.throws(() =>
    aggregateIdentityCounts([
      { "gptbot:verified": Number.MAX_SAFE_INTEGER },
      { "gptbot:verified": 1 },
    ]),
  );
});

const now = Date.parse("2026-10-21T12:00:00.000Z");
const feed = {
  fetchedAt: new Date(now - 1000).toISOString(),
  ranges: ["192.0.2.0/24", "2001:db8::/32"],
};
const headers = (ip = "192.0.2.10") => new Headers({ "x-vercel-forwarded-for": ip });

test("identity reports reject broken counts, unsafe source links and missing or duplicate crawlers", () => {
  const report = {
    mode: "disabled",
    start: "2026-09-22",
    end: "2026-10-21",
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
  };
  assert.deepEqual(parseIdentityReport(report), report);
  assert.throws(() => parseIdentityReport({ ...report, rows: [] }));
  for (const patch of [
    { source: "https://evil.example" },
    { botId: "unknown" },
    { counts: {} },
    { counts: { verified: -1 } },
    { fetchedAt: "yesterday" },
    { fresh: "yes" },
  ]) {
    const broken = structuredClone(report);
    Object.assign(broken.rows[0], patch);
    assert.throws(() => parseIdentityReport(broken));
  }
});

test("IPv4 and IPv6 range matching includes boundaries without neighboring networks", () => {
  for (const ip of ["192.0.2.0", "192.0.2.255"])
    assert.equal(matchesRange(ip, "192.0.2.0/24"), true);
  for (const ip of [
    "192.0.1.255",
    "192.0.3.0",
    "0192.0.2.1",
    "192.0.2.999",
    "192.0.2.1:80",
    "192.0.2.1, 8.8.8.8",
    "127.1",
    "0xc0000201",
  ])
    assert.equal(matchesRange(ip, "192.0.2.0/24"), false);
  for (const ip of ["2001:db8::", "2001:DB8:ffff:ffff:ffff:ffff:ffff:ffff"])
    assert.equal(matchesRange(ip, "2001:db8::/32"), true);
  for (const ip of [
    "2001:db9::",
    "2001:db8::g",
    "[2001:db8::1]",
    "2001:db8::1%eth0",
    "::ffff:192.0.2.1",
  ])
    assert.equal(matchesRange(ip, "2001:db8::/32"), false);
  assert.equal(matchesRange("::1", "::1/128"), true);
  assert.equal(matchesRange("192.0.2.1", "192.0.2.1/32"), true);
  assert.equal(matchesRange("2001:db8::1", "192.0.2.0/24"), false);
});

test("malformed, broad and non-network vendor prefixes are rejected as a whole feed", () => {
  assert.deepEqual(
    parseVendorRanges({
      prefixes: [{ ipv4Prefix: "192.0.2.0/24" }, { ipv6Prefix: "2001:db8::/32" }],
    }),
    feed.ranges,
  );
  for (const range of [
    "0.0.0.0/0",
    "::/0",
    "192.0.2.1/24",
    "2001:db8::1/32",
    "192.0.2.0/33",
    "2001:db8::/129",
    "192.0.2.0/24/extra",
    "192.0.2.0/-1",
    "bad/24",
  ])
    assert.throws(() => parseVendorRanges({ prefixes: [{ ipv4Prefix: range }] }));
  for (const value of [
    null,
    {},
    { prefixes: [] },
    { prefixes: Array(2049).fill({ ipv4Prefix: "192.0.2.0/24" }) },
    { prefixes: [{ ipv4Prefix: "192.0.2.0/24", ipv6Prefix: "2001:db8::/32" }] },
    { prefixes: [{ ipv6Prefix: "192.0.2.0/24" }] },
  ])
    assert.throws(() => parseVendorRanges(value));
});

test("verification requires the Vercel runtime and its single trusted IP header", async () => {
  let reads = 0;
  const store = {
    get: async (key: string) => {
      reads++;
      assert.equal(key, feedKey("gptbot"));
      return feed;
    },
  };
  assert.equal(await verifyCrawlerIdentity(store, "gptbot", headers(), false, now), "unavailable");
  assert.equal(
    await verifyCrawlerIdentity(
      store,
      "gptbot",
      new Headers({ "x-forwarded-for": "192.0.2.10", "x-real-ip": "192.0.2.10" }),
      true,
      now,
    ),
    "unavailable",
  );
  for (const ip of ["192.0.2.10, 198.51.100.1", "192.0.2.10:80", "bad"])
    assert.equal(
      await verifyCrawlerIdentity(store, "gptbot", headers(ip), true, now),
      "unavailable",
    );
  assert.equal(
    await verifyCrawlerIdentity(store, "claudebot", headers(), true, now),
    "unsupported",
  );
  assert.equal(reads, 0);
  assert.equal(await verifyCrawlerIdentity(store, "gptbot", headers(), true, now), "verified");
  assert.equal(
    await verifyCrawlerIdentity(store, "gptbot", headers("2001:db8::1"), true, now),
    "verified",
  );
  assert.equal(
    await verifyCrawlerIdentity(store, "gptbot", headers("198.51.100.1"), true, now),
    "unverified",
  );
});

test("missing, corrupt, future, expired and unavailable feeds never report a match or an impersonator", async () => {
  assert.equal(feedIsFresh(new Date(now - FEED_MAX_AGE_MS).toISOString(), now), false);
  for (const value of [
    null,
    "bad JSON",
    {},
    { ...feed, fetchedAt: "yesterday" },
    { ...feed, ranges: ["0.0.0.0/0"] },
    { ...feed, fetchedAt: new Date(now + 1).toISOString() },
    { ...feed, fetchedAt: new Date(now - FEED_MAX_AGE_MS).toISOString() },
  ])
    assert.equal(
      await verifyCrawlerIdentity({ get: async () => value }, "gptbot", headers(), true, now),
      "unavailable",
    );
  assert.equal(
    await verifyCrawlerIdentity(
      {
        get: async () => {
          throw new Error("offline");
        },
      },
      "gptbot",
      headers(),
      true,
      now,
    ),
    "unavailable",
  );
  assert.throws(() => parseIdentityFeed({ ...feed, ranges: [] }));
});

test("identity observations add only a status counter to the existing count script and preserve Block", async () => {
  for (const path of [null, "/docs"]) {
    let written = false;
    assert.equal(
      (
        await applyCrawlerPolicy(
          {
            get: async () => "block",
            eval: async (_, keys, args) => {
              written = true;
              assert.ok(keys.includes("blocked:gptbot:2026-10-21"));
              assert.equal(keys.at(-2), "identity:2026-10-21");
              assert.equal(keys.at(-1), "collector:health");
              assert.equal(args.at(-2), "gptbot:unavailable");
              assert.equal(args.at(-1), new Date(now).toISOString());
              assert.ok(!JSON.stringify([keys, args]).includes("192.0.2"));
              return 1;
            },
          },
          "gptbot",
          "2026-10-21",
          path,
          new Date(now).toISOString(),
          Promise.reject(new Error("verification failed")),
        )
      ).outcome === "blocked",
      true,
    );
    assert.equal(written, true);
  }
});

test("vendor downloads use fixed HTTPS sources, a deadline and strict size/schema limits", async () => {
  const downloaded = await downloadIdentityFeed("gptbot", async (url, options) => {
    assert.equal(url, "https://openai.com/gptbot.json");
    assert.equal(options?.redirect, "manual");
    assert.ok(options?.signal);
    return Response.json({ prefixes: [{ ipv4Prefix: "192.0.2.0/24" }] });
  });
  assert.deepEqual(downloaded.ranges, ["192.0.2.0/24"]);
  assert.ok(Number.isFinite(Date.parse(downloaded.fetchedAt)));
  for (const response of [
    new Response("offline", { status: 503 }),
    new Response("bad json"),
    new Response("x".repeat(262145)),
    Response.json({ prefixes: [] }),
  ])
    await assert.rejects(downloadIdentityFeed("gptbot", async () => response));
  await assert.rejects(
    downloadIdentityFeed("unknown", async () => {
      throw new Error("must not fetch");
    }),
  );
});

test("only the documented Perplexity domain transition is followed, with the same deadline", async () => {
  const calls: string[] = [];
  let signal: AbortSignal | null | undefined;
  await downloadIdentityFeed("perplexitybot", async (url, options) => {
    calls.push(String(url));
    if (calls.length === 1) {
      signal = options?.signal;
      return new Response(null, {
        status: 302,
        headers: { Location: "https://www.perplexity.ai/perplexitybot.json" },
      });
    }
    assert.equal(options?.signal, signal);
    assert.equal(options?.redirect, "error");
    return Response.json({ prefixes: [{ ipv4Prefix: "192.0.2.0/24" }] });
  });
  assert.deepEqual(calls, [
    "https://www.perplexity.com/perplexitybot.json",
    "https://www.perplexity.ai/perplexitybot.json",
  ]);
  for (const location of [
    "http://127.0.0.1/private",
    "https://evil.example/feed",
    "https://www.perplexity.ai/other.json",
    "https://www.perplexity.ai/perplexitybot.json?secret=x",
  ]) {
    let requests = 0;
    await assert.rejects(
      downloadIdentityFeed("perplexitybot", async () => {
        requests++;
        return new Response(null, { status: 302, headers: { Location: location } });
      }),
    );
    assert.equal(requests, 1);
  }
});
