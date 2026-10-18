import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { createClient } from "@/utils/supabase/server";
import { botSignatures } from "@/lib/botSignatures";
import { parseTrafficHistory, reportDays } from "@/lib/traffic-report";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json(
        { error: "Sign in to view traffic reports." },
        { status: 401, headers },
      );
    }

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      return NextResponse.json(
        { error: "Traffic reporting is not configured." },
        { status: 503, headers },
      );
    }

    const redis = new Redis({ url, token });
    const days = reportDays();
    const keys = botSignatures.flatMap((bot) => [
      ...days.map((day) => `bot:${bot.id}:${day}`),
      ...days.map((day) => `blocked:${bot.id}:${day}`),
    ]);
    const values = await redis.mget<(number | null)[]>(...keys);
    const history = parseTrafficHistory({
      days,
      bots: botSignatures.map((bot, index) => {
        const offset = index * days.length * 2;
        return {
          id: bot.id,
          name: bot.name,
          hitsByDay: values.slice(offset, offset + days.length).map((count) => count ?? 0),
          blockedByDay: values
            .slice(offset + days.length, offset + days.length * 2)
            .map((count) => count ?? 0),
        };
      }),
    });
    return NextResponse.json(history, { headers });
  } catch {
    return NextResponse.json(
      { error: "Traffic reporting is temporarily unavailable. Please try again." },
      { status: 503, headers },
    );
  }
}
