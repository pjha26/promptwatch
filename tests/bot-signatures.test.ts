import assert from "node:assert/strict";
import { test } from "node:test";
import { botSignatures, detectBot } from "../lib/botSignatures";
import { parsePolicyUpdate } from "../lib/bot-policies";

test("supported HTTP crawlers match complete tokens independent of case", () => {
  for (const bot of botSignatures.filter((candidate) => !candidate.robotsOnly)) {
    assert.equal(
      detectBot(
        `Mozilla/5.0 (compatible; ${bot.userAgentMatch.toLowerCase()}/1.0; +https://example.com/bot)`,
      )?.id,
      bot.id,
    );
    assert.equal(detectBot(bot.userAgentMatch)?.id, bot.id);
    assert.equal(detectBot(`Not${bot.userAgentMatch}Impersonator/1.0`), null);
  }
  assert.equal(detectBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"), null);
});

test("robots-only controls retain historical IDs but are neither crawlers nor editable HTTP policies", () => {
  for (const id of ["google-extended", "applebot-extended"]) {
    const bot = botSignatures.find((candidate) => candidate.id === id)!;
    assert.equal(detectBot(bot.userAgentMatch), null);
    assert.throws(() => parsePolicyUpdate({ botId: id, policy: "block" }));
  }
});
