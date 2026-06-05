import { BotName } from "./types";

export const BOT_COLORS: Record<BotName, string> = {
  GPTBot: "#10a37f", // OpenAI Green
  "ChatGPT-User": "#10a37f", // OpenAI Green (lighter or same)
  "OAI-SearchBot": "#10a37f", // OpenAI Green
  ClaudeBot: "#d97757", // Anthropic Orange
  PerplexityBot: "#22d3ee", // Perplexity Cyan
  "Perplexity-User": "#22d3ee", // Perplexity Cyan
  "Google-Extended": "#4285f4", // Google Blue
};

// Ensure distinct shades if needed, but grouping by parent is nice.
// Let's refine to be distinct per bot for chart clarity.
export const BOT_CHART_COLORS: Record<BotName, string> = {
  GPTBot: "#059669", // emerald-600
  "ChatGPT-User": "#34d399", // emerald-400
  "OAI-SearchBot": "#6ee7b7", // emerald-300
  ClaudeBot: "#ea580c", // orange-600
  PerplexityBot: "#06b6d4", // cyan-500
  "Perplexity-User": "#67e8f9", // cyan-300
  "Google-Extended": "#3b82f6", // blue-500
};

export const BOT_PARENTS: Record<BotName, string> = {
  GPTBot: "OpenAI",
  "ChatGPT-User": "OpenAI",
  "OAI-SearchBot": "OpenAI",
  ClaudeBot: "Anthropic",
  PerplexityBot: "Perplexity",
  "Perplexity-User": "Perplexity",
  "Google-Extended": "Google",
};
