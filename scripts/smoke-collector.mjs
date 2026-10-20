import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { createServer as createPortProbe } from "node:net";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execute = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const npm = process.env.npm_execpath;
assert.ok(npm, "Run this check with npm run test:collector.");
const tempParent = resolve(tmpdir());
const fixture = await mkdtemp(join(tempParent, "promptwatch-consumer-"));
let processServer;
let mode = "allow";
let commands = [];
const redis = createServer(async (request, response) => {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  const payload = JSON.parse(raw);
  const batch = Array.isArray(payload[0]) ? payload : [payload];
  const results = batch.map((command) => {
    commands.push(command);
    if (String(command[0]).toUpperCase() === "GET")
      return mode === "read-error"
        ? { error: "Simulated policy outage" }
        : { result: mode === "allow" ? "allow" : "block" };
    if (mode === "write-error" && String(command[1]).includes("local count = redis.call('INCR'"))
      return { error: "Simulated counter outage" };
    return { result: 1 };
  });
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(Array.isArray(payload[0]) ? results : results[0]));
});

try {
  console.log("Packing the actual collector archive and checking its file list…");
  const { stdout } = await execute(
    process.execPath,
    [npm, "pack", "./packages/collector", "--json", "--pack-destination", fixture],
    { cwd: root, timeout: 60_000, maxBuffer: 2_000_000, windowsHide: true },
  );
  const [archive] = JSON.parse(stdout);
  assert.ok(archive.files.some((file) => file.path === "dist/packages/collector/index.js"));
  for (const { path } of archive.files) {
    assert.ok(
      path === "package.json" ||
        path === "README.md" ||
        /^dist\/(?:lib|packages\/collector)\/.+\.(?:js|d\.ts)$/.test(path),
      `Unexpected package file: ${path}`,
    );
  }
  await cp(join(root, "tests/collector-fixture"), fixture, { recursive: true });
  const lock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  const dependencies = ["next", "react", "react-dom"].map(
    (name) => `${name}@${lock.packages[`node_modules/${name}`].version}`,
  );
  console.log("Installing the archive into an independent Next.js project…");
  await execute(
    process.execPath,
    [
      npm,
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--no-package-lock",
      join(fixture, archive.filename),
      ...dependencies,
    ],
    { cwd: fixture, timeout: 240_000, maxBuffer: 3_000_000, windowsHide: true },
  );
  redis.listen(0, "127.0.0.1");
  await once(redis, "listening");
  const env = {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    UPSTASH_REDIS_REST_URL: `http://127.0.0.1:${redis.address().port}`,
    UPSTASH_REDIS_REST_TOKEN: "isolated-consumer-fixture",
    PROMPTWATCH_COLLECTOR_ENABLED: "true",
    PROMPTWATCH_IP_VERIFICATION: "disabled",
  };
  const next = join(fixture, "node_modules/next/dist/bin/next");
  console.log("Building the consumer site's Edge middleware…");
  await execute(process.execPath, [next, "build"], {
    cwd: fixture,
    env,
    timeout: 240_000,
    maxBuffer: 3_000_000,
    windowsHide: true,
  });
  const probe = createPortProbe();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise((done) => probe.close(done));
  processServer = spawn(
    process.execPath,
    [next, "start", "--hostname", "127.0.0.1", "--port", String(port)],
    { cwd: fixture, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
  );
  let output = "";
  processServer.stdout.on("data", (chunk) => {
    output += chunk;
  });
  processServer.stderr.on("data", (chunk) => {
    output += chunk;
  });
  for (let i = 0; !output.includes("Ready in") && processServer.exitCode === null && i < 120; i++)
    await new Promise((done) => setTimeout(done, 250));
  assert.ok(output.includes("Ready in"), "Consumer server did not become ready.");
  const request = (path, agent = "GPTBot/1.0") =>
    fetch(`http://127.0.0.1:${port}${path}`, {
      headers: { "User-Agent": agent },
      signal: AbortSignal.timeout(15_000),
    });
  commands = [];
  let response = await request("/docs", "IndependentBrowser");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-site-middleware"), "kept");
  assert.equal(commands.length, 0);
  response = await request("/docs?token=do-not-store");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-site-middleware"), "kept");
  assert.equal(commands.length, 2);
  assert.ok(commands[1].includes("/docs"));
  assert.ok(!JSON.stringify(commands).includes("do-not-store"));
  mode = "block";
  commands = [];
  response = await request("/docs");
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, "Access denied by site policy");
  assert.equal(commands.length, 2);
  commands = [];
  response = await request("/api/health");
  assert.equal(response.status, 200);
  assert.equal(commands.length, 0);
  mode = "write-error";
  response = await request("/docs");
  assert.equal(response.status, 403);
  mode = "read-error";
  response = await request("/docs");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-site-middleware"), "kept");
  console.log(
    "PASS: packed collector installs and builds in a separate Next.js site; own middleware preserved, private queries omitted, Allow/Block and outage behavior retained, administrative paths excluded.",
  );
} finally {
  if (processServer && processServer.exitCode === null) {
    processServer.kill();
    await once(processServer, "exit");
  }
  redis.closeAllConnections();
  if (redis.listening) await new Promise((done) => redis.close(done));
  const target = resolve(fixture);
  if (dirname(target) !== tempParent || !basename(target).startsWith("promptwatch-consumer-"))
    throw new Error("Unsafe temporary cleanup path");
  await rm(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
}
