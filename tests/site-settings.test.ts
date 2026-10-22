import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseSiteInput,
  parseSiteSettings,
  saveSiteSettings,
  SITE_SETTINGS_KEY,
} from "../lib/site-settings";

test("site settings normalize origins and reject credentials and non-site URLs", () => {
  assert.deepEqual(parseSiteInput({ name: " My site ", url: "https://EXAMPLE.com:443/" }), {
    name: "My site",
    url: "https://example.com",
  });
  assert.equal(
    parseSiteInput({ name: "Local", url: "http://localhost:3000" }).url,
    "http://localhost:3000",
  );
  for (const url of [
    "",
    "invalid",
    "javascript:alert(1)",
    "ftp://example.com",
    "https://u:p@example.com",
    "https://example.com/private",
    "https://example.com/?token=secret",
    "https://example.com/#private",
  ])
    assert.throws(() => parseSiteInput({ name: "Site", url }));
  for (const name of ["", " ", "x".repeat(101), "line\nbreak", "null\u0000"])
    assert.throws(() => parseSiteInput({ name, url: "https://example.com" }));
});

test("site persistence is validated and fails on unconfirmed writes", async () => {
  let stored: unknown = null;
  const store = {
    set: async (key: string, value: unknown) => {
      assert.equal(key, SITE_SETTINGS_KEY);
      stored = value;
      return "OK";
    },
  };
  assert.equal(parseSiteSettings(null), null);
  const saved = await saveSiteSettings(store, { name: "Real site", url: "https://example.com/" });
  assert.deepEqual(parseSiteSettings(stored), saved);
  for (const bad of [
    undefined,
    {},
    { ...saved, revision: "bad" },
    { ...saved, updatedAt: "yesterday" },
    { ...saved, url: "https://example.com/" },
  ])
    assert.throws(() => parseSiteSettings(bad));
  await assert.rejects(
    saveSiteSettings({ set: async () => null }, { name: "Site", url: "https://example.com" }),
  );
  await assert.rejects(
    saveSiteSettings(
      {
        set: async () => {
          throw new Error("timeout");
        },
      },
      { name: "Site", url: "https://example.com" },
    ),
  );
});
