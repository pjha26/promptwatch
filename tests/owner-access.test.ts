import assert from "node:assert/strict";
import { test } from "node:test";
import { ownerAccessStatus } from "../lib/owner-access";
import { parsePolicyUpdate, readPolicies } from "../lib/bot-policies";
import { botSignatures } from "../lib/botSignatures";
import { safeAuthRedirect } from "../lib/auth-redirect";

test("auth return paths cannot redirect to another host", () => {
  for (const path of [
    null,
    "https://evil.example",
    "//evil.example",
    "@evil.example",
    "/\\evil.example",
    "/\n/evil.example",
  ]) {
    assert.equal(safeAuthRedirect(path), "/dashboard");
  }
  assert.equal(safeAuthRedirect("/dashboard/traffic?period=7"), "/dashboard/traffic?period=7");
});

const owner = "11111111-1111-4111-8111-111111111111";
const stranger = "22222222-2222-4222-8222-222222222222";

test("owner authorization fails closed for anonymous, unrelated and unconfigured users", () => {
  assert.equal(ownerAccessStatus(null, owner), 401);
  assert.equal(ownerAccessStatus(stranger, owner), 403);
  for (const setting of [undefined, "", " ", "owner@example.com", "not-a-uuid"]) {
    assert.equal(ownerAccessStatus(owner, setting), 503);
  }
  assert.equal(ownerAccessStatus(owner, owner), 200);
  assert.equal(ownerAccessStatus(owner, ` ${owner} `), 200);
});

test("policy requests allow only configured crawlers and supported rules", () => {
  assert.deepEqual(parsePolicyUpdate({ botId: "gptbot", policy: "block" }), {
    botId: "gptbot",
    policy: "block",
  });
  for (const value of [
    null,
    [],
    {},
    { botId: "unknown", policy: "allow" },
    { botId: "gptbot", policy: "throttle" },
  ]) {
    assert.throws(() => parsePolicyUpdate(value));
  }
});

test("missing policies default to allow, invalid store responses never masquerade as defaults", () => {
  const values = Array(botSignatures.length).fill(null);
  assert.deepEqual(
    readPolicies(values),
    values.map(() => "allow"),
  );
  values[0] = "block";
  assert.equal(readPolicies(values)[0], "block");
  values[1] = "corrupt";
  assert.throws(() => readPolicies(values));
  assert.throws(() => readPolicies([]));
});
