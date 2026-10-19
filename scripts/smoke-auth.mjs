import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const probe = createServer();
probe.listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    cwd: root,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" },
  },
);
let output = "";
server.stdout.on("data", (chunk) => {
  output += chunk;
});
server.stderr.on("data", (chunk) => {
  output += chunk;
});
try {
  for (
    let attempt = 0;
    !output.includes("Ready in") && server.exitCode === null && attempt < 80;
    attempt++
  ) {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(output.includes("Ready in"), "Build the app before running the auth smoke test.");
  const base = `http://127.0.0.1:${port}`;
  for (const agent of ["PromptwatchSmokeTest", "GPTBot/1.0"]) {
    for (const path of [
      "/api/bot-stats",
      "/api/bot-stats/history",
      "/api/traffic-report",
      "/api/bot-policies",
      "/api/bot-policies/history",
      "/api/test-redis",
      "/api/top-pages",
      "/api/tracking-health",
      "/api/actions",
    ]) {
      const response = await fetch(base + path, {
        headers: { "User-Agent": agent },
        signal: AbortSignal.timeout(15_000),
      });
      assert.equal(
        response.status,
        401,
        `${agent} ${path} must reject anonymous access before reading Redis`,
      );
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      const body = await response.json();
      assert.equal(typeof body.error, "string");
      assert.equal(body.stack, undefined);
    }
  }
  for (const path of ["/api/bot-policies", "/api/tracking-health", "/api/actions"]) {
    const update = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botId: "gptbot", policy: "block" }),
    });
    assert.equal(update.status, 401);
  }
  const page = await fetch(base + "/dashboard/reports", { redirect: "manual" });
  assert.equal(page.status, 307);
  assert.equal(new URL(page.headers.get("location"), base).pathname, "/login");
  console.log(
    "PASS: anonymous browser/crawler requests denied by all administration APIs; policy writes denied; dashboard redirects to login. Redis disabled throughout.",
  );
} finally {
  server.kill();
}
