export interface BotSignature {
  id: string;
  name: string;
  company: string;
  userAgentMatch: string;
}

export const botSignatures: BotSignature[] = [
  { id: "gptbot", name: "GPTBot", company: "OpenAI", userAgentMatch: "GPTBot" },
  { id: "claudebot", name: "ClaudeBot", company: "Anthropic", userAgentMatch: "ClaudeBot" },
  { id: "perplexitybot", name: "PerplexityBot", company: "Perplexity", userAgentMatch: "PerplexityBot" },
  { id: "google-extended", name: "Google-Extended", company: "Google", userAgentMatch: "Google-Extended" },
  { id: "ccbot", name: "CCBot", company: "Common Crawl", userAgentMatch: "CCBot" },
  { id: "bytespider", name: "Bytespider", company: "ByteDance", userAgentMatch: "Bytespider" },
  { id: "applebot-extended", name: "Applebot-Extended", company: "Apple", userAgentMatch: "Applebot-Extended" },
];

/**
 * Detects a known AI crawler bot from a raw User-Agent string.
 * Returns the matching BotSignature, or null if no match is found.
 * Uses case-sensitive substring matching against official bot UA strings.
 */
export function detectBot(userAgent: string): BotSignature | null {
  for (const bot of botSignatures) {
    if (userAgent.includes(bot.userAgentMatch)) {
      return bot;
    }
  }
  return null;
}
