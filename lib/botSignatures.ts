export interface BotSignature {
  id: string;
  name: string;
  company: string;
  userAgentMatch: string;
  robotsOnly?: boolean;
}

export const botSignatures: BotSignature[] = [
  { id: "gptbot", name: "GPTBot", company: "OpenAI", userAgentMatch: "GPTBot" },
  { id: "claudebot", name: "ClaudeBot", company: "Anthropic", userAgentMatch: "ClaudeBot" },
  {
    id: "perplexitybot",
    name: "PerplexityBot",
    company: "Perplexity",
    userAgentMatch: "PerplexityBot",
  },
  {
    id: "google-extended",
    name: "Google-Extended",
    company: "Google",
    userAgentMatch: "Google-Extended",
    robotsOnly: true,
  },
  { id: "ccbot", name: "CCBot", company: "Common Crawl", userAgentMatch: "CCBot" },
  { id: "bytespider", name: "Bytespider", company: "ByteDance", userAgentMatch: "Bytespider" },
  {
    id: "applebot-extended",
    name: "Applebot-Extended",
    company: "Apple",
    userAgentMatch: "Applebot-Extended",
    robotsOnly: true,
  },
  { id: "chatgpt-user", name: "ChatGPT-User", company: "OpenAI", userAgentMatch: "ChatGPT-User" },
  {
    id: "oai-searchbot",
    name: "OAI-SearchBot",
    company: "OpenAI",
    userAgentMatch: "OAI-SearchBot",
  },
  {
    id: "perplexity-user",
    name: "Perplexity-User",
    company: "Perplexity",
    userAgentMatch: "Perplexity-User",
  },
  { id: "claude-user", name: "Claude-User", company: "Anthropic", userAgentMatch: "Claude-User" },
  {
    id: "claude-searchbot",
    name: "Claude-SearchBot",
    company: "Anthropic",
    userAgentMatch: "Claude-SearchBot",
  },
];

/**
 * Detects a known AI crawler bot from a raw User-Agent string.
 * Returns the matching BotSignature, or null if no match is found.
 * Matches bounded User-Agent tokens; this does not verify the sender's identity.
 */
export function detectBot(userAgent: string): BotSignature | null {
  for (const bot of botSignatures) {
    // Extended tokens control content use through robots.txt, not HTTP crawling.
    if (
      !bot.robotsOnly &&
      new RegExp(`(?:^|[\\s;(])${bot.userAgentMatch}(?:$|[\\s;/)])`, "i").test(userAgent)
    ) {
      return bot;
    }
  }
  return null;
}
