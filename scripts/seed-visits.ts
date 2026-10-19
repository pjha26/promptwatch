/**
 * seed-visits.ts
 *
 * Generates ~100,000 deterministic AI bot visit records spread over the
 * 90 days ending 2026-06-03 (a fixed date, so reviewer diffs across
 * candidate submissions are stable). Writes to /public/visits.json.
 *
 * Run: npm run seed:visits
 *
 * You do NOT need to edit this file. If you do (e.g. to reduce row count
 * for local dev iteration), commit your edits and note them in the
 * README. The reviewer's check will regenerate from this script.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { AiVisit, BotName } from "../lib/types";

// ─── seeded RNG (mulberry32) ─────────────────────────────────────────
const SEED = 0xc0ffee_42;
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);

function pickWeighted<T>(items: readonly { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rand() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it.value;
  }
  return items[items.length - 1].value;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

// ─── distributions ───────────────────────────────────────────────────
const BOT_WEIGHTS: readonly { value: BotName; weight: number }[] = [
  { value: "GPTBot", weight: 30 },
  { value: "ChatGPT-User", weight: 25 },
  { value: "ClaudeBot", weight: 15 },
  { value: "PerplexityBot", weight: 10 },
  { value: "OAI-SearchBot", weight: 8 },
  { value: "Google-Extended", weight: 7 },
  { value: "Perplexity-User", weight: 5 },
];

const PATH_WEIGHTS: readonly { value: string; weight: number }[] = [
  { value: "/", weight: 100 },
  { value: "/docs", weight: 60 },
  { value: "/docs/quickstart", weight: 45 },
  { value: "/docs/api", weight: 35 },
  { value: "/pricing", weight: 30 },
  { value: "/features", weight: 25 },
  { value: "/features/ai-visibility", weight: 22 },
  { value: "/features/citation-tracking", weight: 18 },
  { value: "/features/competitor-analysis", weight: 16 },
  { value: "/blog", weight: 14 },
  { value: "/blog/ai-search-changes-everything", weight: 12 },
  { value: "/blog/how-llm-citations-work", weight: 10 },
  { value: "/blog/2026-state-of-aeo", weight: 9 },
  { value: "/blog/case-study-acme", weight: 8 },
  { value: "/blog/perplexity-vs-google", weight: 7 },
  { value: "/blog/claude-3-7-changes", weight: 6 },
  { value: "/changelog", weight: 6 },
  { value: "/about", weight: 5 },
  { value: "/customers", weight: 4 },
  { value: "/integrations", weight: 4 },
  { value: "/docs/sdk/javascript", weight: 4 },
  { value: "/docs/sdk/python", weight: 3 },
  { value: "/docs/webhooks", weight: 3 },
  { value: "/docs/auth", weight: 3 },
  { value: "/blog/2025-eoy-recap", weight: 3 },
  { value: "/blog/founders-letter", weight: 2 },
  { value: "/security", weight: 2 },
  { value: "/legal/privacy", weight: 1 },
  { value: "/legal/terms", weight: 1 },
  { value: "/sitemap", weight: 1 },
];

// Realistic UA strings — each contains the canonical substring for its bot
// (per lib/types.ts BOT_UA_SUBSTRINGS).
const UA_TEMPLATES: Record<BotName, readonly string[]> = {
  GPTBot: [
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
    "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)",
  ],
  "ChatGPT-User": [
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
    "Mozilla/5.0 (compatible; ChatGPT-User/2.0; +https://platform.openai.com/docs/plugins/bot)",
  ],
  "OAI-SearchBot": [
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
  ],
  ClaudeBot: [
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ClaudeBot/1.0; +claudebot@anthropic.com",
    "Claude-Web/1.0 (+https://www.anthropic.com)",
  ],
  PerplexityBot: [
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot",
  ],
  "Perplexity-User": [
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user",
  ],
  "Google-Extended": [
    "Mozilla/5.0 (compatible; Google-Extended; +http://www.google.com/bot.html)",
  ],
};

// ─── time generation ─────────────────────────────────────────────────
// Fixed end date 2026-06-03 (UTC midnight) — same for every reviewer.
const END_DATE = new Date(Date.UTC(2026, 5, 3, 0, 0, 0)); // months are 0-indexed
const DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const START_DATE = new Date(END_DATE.getTime() - DAYS * MS_PER_DAY);

/**
 * Picks a timestamp inside the [start, end) window with:
 *   - gentle upward trend (later days slightly heavier)
 *   - mild weekday vs weekend skew (Mon–Fri ~20% heavier than Sat/Sun)
 *   - mild hour-of-day variation (not perfectly flat)
 */
function pickTimestamp(): Date {
  // Reject sampling to apply the trend + weekday weight.
  for (let i = 0; i < 32; i++) {
    const t = START_DATE.getTime() + rand() * DAYS * MS_PER_DAY;
    const d = new Date(t);
    const dayIndex = Math.floor((t - START_DATE.getTime()) / MS_PER_DAY);
    const trendFactor = 0.7 + (dayIndex / DAYS) * 0.6; // 0.7 → 1.3
    const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
    const weekdayFactor = isWeekend ? 0.85 : 1.05;
    const hour = d.getUTCHours();
    // Small hour pattern: slight peaks around 04 and 14 UTC.
    const hourFactor =
      1 + 0.12 * Math.sin(((hour - 4) / 24) * Math.PI * 2);
    const accept = (trendFactor * weekdayFactor * hourFactor) / 2;
    if (rand() < accept) return d;
  }
  // Fallback (should rarely hit).
  return new Date(START_DATE.getTime() + rand() * DAYS * MS_PER_DAY);
}

// ─── id generation ───────────────────────────────────────────────────
function shortId(): string {
  // 8-char hex from rand() — deterministic enough for stable ids.
  let s = "";
  for (let i = 0; i < 8; i++) s += Math.floor(rand() * 16).toString(16);
  return `v_${s}`;
}

// ─── generate ────────────────────────────────────────────────────────
const ROW_COUNT = 100_000;

const visits: AiVisit[] = new Array(ROW_COUNT);
for (let i = 0; i < ROW_COUNT; i++) {
  const bot = pickWeighted(BOT_WEIGHTS);
  const page_path = pickWeighted(PATH_WEIGHTS);
  const ua_templates = UA_TEMPLATES[bot];
  const user_agent = ua_templates[randInt(0, ua_templates.length - 1)];
  const timestamp = pickTimestamp().toISOString();

  visits[i] = {
    id: shortId(),
    timestamp,
    bot,
    page_path,
    user_agent,
  };
}

// Sort ascending by timestamp so the file is naturally ordered.
visits.sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0));

// ─── write ───────────────────────────────────────────────────────────
const outDir = join(process.cwd(), "public");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "visits.json");
writeFileSync(outPath, JSON.stringify(visits));

// Stats for the seeder's stdout (so the candidate sees what got generated).
const botCounts = new Map<BotName, number>();
for (const v of visits) botCounts.set(v.bot, (botCounts.get(v.bot) ?? 0) + 1);
const pageCounts = new Map<string, number>();
for (const v of visits) pageCounts.set(v.page_path, (pageCounts.get(v.page_path) ?? 0) + 1);

console.log(`✓ wrote ${visits.length.toLocaleString()} visits → ${outPath}`);
console.log(`  date range: ${visits[0].timestamp} → ${visits[visits.length - 1].timestamp}`);
console.log("  bot mix:");
for (const [bot, count] of [...botCounts.entries()].sort((a, b) => b[1] - a[1])) {
  const pct = ((count / visits.length) * 100).toFixed(1);
  console.log(`    ${bot.padEnd(18)} ${count.toString().padStart(7)} (${pct}%)`);
}
console.log(`  unique pages: ${pageCounts.size}`);
console.log(`  top 5 pages:`);
for (const [path, count] of [...pageCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
  console.log(`    ${path.padEnd(40)} ${count.toString().padStart(7)}`);
}
