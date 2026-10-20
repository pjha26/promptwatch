import assert from "node:assert/strict";
import { test } from "node:test";
import { collectCrawlerRequest } from "../lib/crawler-request";

test("collector skips humans, administrative routes and explicitly disabled deployments", async () => {
  const store = () => {
    throw new Error("Store must not be constructed");
  };
  for (const path of [
    "/api/stats",
    "/dashboard",
    "/auth/callback",
    "/login",
    "/signup",
    "/ADMIN/recover",
    "/_next/data",
  ]) {
    assert.equal(
      await collectCrawlerRequest(
        new Request(`https://site.example${path}`, { headers: { "User-Agent": "GPTBot/1.0" } }),
        { store },
      ),
      null,
    );
  }
  assert.equal(
    await collectCrawlerRequest(new Request("https://site.example/docs"), { store }),
    null,
  );
  assert.equal(
    await collectCrawlerRequest(
      new Request("https://site.example/docs", { headers: { "User-Agent": "GPTBot/1.0" } }),
      { store, enabled: false },
    ),
    null,
  );
});

test("collector reuses enforcement and query-free public paths without taking over site middleware", async () => {
  const request = new Request("https://site.example/docs/start?token=private", {
    headers: { "User-Agent": "GPTBot/1.0" },
  });
  for (const policy of ["allow", "block"]) {
    const result = await collectCrawlerRequest(request, {
      publicPathPrefixes: "/docs",
      store: () => ({
        get: async () => policy,
        eval: async (_, keys, args) => {
          assert.equal(keys[1].split(":")[0], policy === "block" ? "blocked-pages" : "pages");
          assert.equal(args[1], "/docs/start");
          assert.ok(!JSON.stringify([keys, args]).includes("private"));
          return 1;
        },
      }),
    });
    if (policy === "allow") assert.equal(result, null);
    else {
      assert.equal(result?.status, 403);
      assert.deepEqual(await result?.json(), { error: "Access denied by site policy" });
    }
  }
});

test("store setup/read failures keep the site available; a confirmed block survives a counting failure", async () => {
  const request = new Request("https://site.example/", { headers: { "User-Agent": "GPTBot" } });
  assert.equal(
    await collectCrawlerRequest(request, {
      store: () => {
        throw new Error("not configured");
      },
    }),
    null,
  );
  assert.equal(
    await collectCrawlerRequest(request, {
      store: () => ({
        get: async () => {
          throw new Error("offline");
        },
        eval: async () => 1,
      }),
    }),
    null,
  );
  assert.equal(
    (
      await collectCrawlerRequest(request, {
        store: () => ({
          get: async () => "block",
          eval: async () => {
            throw new Error("count unavailable");
          },
        }),
      })
    )?.status,
    403,
  );
});
