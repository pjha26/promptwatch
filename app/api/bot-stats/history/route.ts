import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { botSignatures } from "@/lib/botSignatures";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    // Build last 30 days of UTC date strings (29 days ago through today)
    const days: string[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    // Build all Redis keys: one per bot per day
    const keys = botSignatures.flatMap((bot) =>
      days.map((day) => ({ botId: bot.id, botName: bot.name, day, key: `bot:${bot.id}:${day}` }))
    );

    // Fetch all counts in parallel (regular hits + blocked hits)
    const values = await Promise.all([
      ...keys.map((k) => redis.get<number>(k.key)),
      ...keys.map((k) => redis.get<number>(`blocked:${k.botId}:${k.day}`))
    ]);

    // Reshape into per-bot hitsByDay arrays
    const botsData = botSignatures.map((bot, botIndex) => {
      const hitsByDay = days.map((_, dayIndex) => {
        const flatIndex = botIndex * days.length + dayIndex;
        return values[flatIndex] ?? 0;
      });
      const blockedByDay = days.map((_, dayIndex) => {
        const flatIndex = keys.length + (botIndex * days.length + dayIndex);
        return values[flatIndex] ?? 0;
      });
      return { id: bot.id, name: bot.name, hitsByDay, blockedByDay };
    });

    return NextResponse.json({ days, bots: botsData });
  } catch (error) {
    console.error("[api/bot-stats/history] Redis read error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bot history from Redis" },
      { status: 500 }
    );
  }
}
