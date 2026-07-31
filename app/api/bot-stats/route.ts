import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { botSignatures } from "@/lib/botSignatures";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const counts = await Promise.all(
      botSignatures.map(async (bot) => {
        const key = `bot:${bot.id}:${today}`;
        const hits = (await redis.get<number>(key)) ?? 0;
        return { id: bot.id, name: bot.name, hits };
      })
    );

    return NextResponse.json({ date: today, counts });
  } catch (error) {
    console.error("[api/bot-stats] Redis read error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bot stats from Redis" },
      { status: 500 }
    );
  }
}
