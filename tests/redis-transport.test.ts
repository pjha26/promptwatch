import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { test } from "node:test";
import { createRedis, REDIS_REQUEST_BUDGET_MS } from "../lib/redis";
import { applyCrawlerPolicy } from "../lib/crawler-policy";
import { verifyCrawlerIdentity } from "../lib/crawler-identity";

test("actual Redis HTTP client respects the shared deadline and does not replay uncertain writes", async (t) => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  let mode: "allow" | "block" | "observe" | "read-timeout" | "write-timeout" | "write-error" =
    "allow";
  let commands: unknown[][] = [];
  let requests = 0;
  const server = createServer(async (request, response) => {
    requests++;
    let body = "";
    for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body) as unknown[];
    const batch: unknown[][] = Array.isArray(payload[0]) ? (payload as unknown[][]) : [payload];
    const results = [];
    for (const command of batch) {
      commands.push(command);
      const operation = String(command[0]).toUpperCase();
      assert.ok(operation === "GET" || operation === "EVAL");
      if (mode === "read-timeout" || (mode === "write-timeout" && operation === "EVAL")) return;
      // A controlled 25ms service delay per command; this is not an Upstash latency benchmark.
      await new Promise((resolve) => setTimeout(resolve, 25));
      if (operation === "GET" && command[1] === "identity:feed:gptbot")
        results.push({
          result: JSON.stringify({
            fetchedAt: new Date(Date.now() - 1000).toISOString(),
            ranges: ["192.0.2.0/24"],
          }),
        });
      else if (operation === "GET")
        results.push({ result: mode === "allow" || mode === "observe" ? "allow" : "block" });
      else if (operation === "EVAL" && String(command[1]).includes("local observationsOk"))
        results.push({ result: [0, 0, 1, 1] });
      else if (mode === "write-error" && command.includes("blocked:gptbot:2026-10-19"))
        results.push({ error: "Simulated counter failure" });
      else results.push({ result: 1 });
    }
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(Array.isArray(payload[0]) ? results : results[0]));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${address.port}`;
  process.env.UPSTASH_REDIS_REST_TOKEN = "isolated-transport-fixture";
  const collect = async () =>
    (await applyCrawlerPolicy(createRedis(), "gptbot", "2026-10-19")).outcome === "blocked";
  const assertDeadline = (elapsed: number) => {
    assert.ok(
      elapsed >= REDIS_REQUEST_BUDGET_MS * 0.85,
      "timeout should exercise the real client deadline",
    );
    assert.ok(
      elapsed < REDIS_REQUEST_BUDGET_MS + 1_500,
      `deadline exceeded scheduling tolerance: ${elapsed}ms`,
    );
  };
  try {
    await t.test(
      "opt-in observation retains two service commands and never denies an over-quota sample",
      async () => {
        mode = "observe";
        commands = [];
        assert.equal(
          (
            await applyCrawlerPolicy(
              createRedis(),
              "gptbot",
              "2026-10-23",
              null,
              new Date().toISOString(),
              undefined,
              true,
            )
          ).outcome === "blocked",
          false,
        );
        assert.equal(commands.length, 2);
      },
    );
    for (const policy of ["allow", "block"] as const) {
      await t.test(`healthy ${policy}: two service commands per detected request`, async () => {
        mode = policy;
        const samples: number[] = [];
        for (let i = 0; i < 25; i++) {
          commands = [];
          const start = performance.now();
          assert.equal(await collect(), policy === "block");
          const elapsed = performance.now() - start;
          assert.equal(commands.length, 2);
          assert.deepEqual(
            commands.map((command) => String(command[0]).toUpperCase()),
            ["GET", "EVAL"],
          );
          if (i >= 5) samples.push(elapsed);
        }
        samples.sort((a, b) => a - b);
        t.diagnostic(
          `${policy}, 20 warm samples, simulated 25ms per command: p50=${samples[9].toFixed(1)}ms p95=${samples[18].toFixed(1)}ms; excludes auth, routing and rendering`,
        );
      });
    }
    await t.test(
      "optional verification batches the feed and policy reads and keeps Block effective",
      async () => {
        mode = "block";
        commands = [];
        requests = 0;
        const store = createRedis();
        const identity = verifyCrawlerIdentity(
          store,
          "gptbot",
          new Headers({ "x-vercel-forwarded-for": "192.0.2.1" }),
          true,
        );
        assert.equal(
          (
            await applyCrawlerPolicy(
              store,
              "gptbot",
              "2026-10-21",
              null,
              new Date().toISOString(),
              identity,
            )
          ).outcome === "blocked",
          true,
        );
        assert.equal(requests, 2, "auto-pipelined reads then one counting script");
        assert.equal(commands.length, 3);
        assert.ok(commands[2].includes("gptbot:verified"));
        assert.ok(!commands[2].includes("192.0.2.1"));
      },
    );
    await t.test(
      "read timeout ends within the deadline, without retrying or claiming a confirmed policy",
      async () => {
        mode = "read-timeout";
        commands = [];
        const start = performance.now();
        await assert.rejects(collect(), /Crawler policy could not be read/);
        const elapsed = performance.now() - start;
        assertDeadline(elapsed);
        assert.equal(commands.length, 1);
        t.diagnostic(`policy-read timeout: ${elapsed.toFixed(1)}ms; one attempted read, no replay`);
      },
    );
    await t.test(
      "an uncertain counter write still returns the confirmed block within the same deadline",
      async () => {
        mode = "write-timeout";
        commands = [];
        const start = performance.now();
        assert.equal(await collect(), true);
        const elapsed = performance.now() - start;
        assertDeadline(elapsed);
        assert.equal(
          commands.length,
          2,
          "no counter replay or extra deadline for the failure marker",
        );
        t.diagnostic(`counter-write timeout: ${elapsed.toFixed(1)}ms; confirmed block retained`);
      },
    );
    await t.test(
      "a replied counter error records a best-effort marker without reversing the block",
      async () => {
        mode = "write-error";
        commands = [];
        assert.equal(await collect(), true);
        assert.equal(commands.length, 3);
        assert.equal(commands[2][0], "eval");
        assert.ok(commands[2].includes("counter-write"));
      },
    );
  } finally {
    if (originalUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    if (originalToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
