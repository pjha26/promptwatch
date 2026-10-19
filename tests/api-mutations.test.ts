import assert from "node:assert/strict";
import { test } from "node:test";
import { requireSameOriginJson } from "../lib/api-auth";

test("administration mutations require same-origin JSON when an origin is supplied", () => {
  const make = (origin?: string, contentType = "application/json") =>
    new Request("https://site.example/api/tracking-health", {
      method: "POST",
      headers: { "Content-Type": contentType, ...(origin ? { Origin: origin } : {}) },
      body: "{}",
    });
  assert.equal(requireSameOriginJson(make("https://site.example")), null);
  assert.equal(requireSameOriginJson(make()), null);
  assert.equal(requireSameOriginJson(make("https://evil.example"))?.status, 403);
  assert.equal(requireSameOriginJson(make("https://site.example", "text/plain"))?.status, 415);
});
