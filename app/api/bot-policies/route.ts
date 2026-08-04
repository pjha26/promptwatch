import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { botSignatures } from "@/lib/botSignatures";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface BotPolicyRow {
  bot_id: string;
  policy: "allow" | "block";
  updated_at: string;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const db = supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => Promise<{ data: BotPolicyRow[] | null; error: unknown }>;
      };
    };
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch policies
  const { data: policies, error } = await db.from('bot_policies').select('*');
  if (error) {
    // If table doesn't exist yet, we still return the defaults rather than failing hard
    console.error("Error fetching policies:", error);
  }

  const policyMap = new Map((policies || []).map((p: BotPolicyRow) => [p.bot_id, p.policy]));

  const result = botSignatures.map(bot => ({
    id: bot.id,
    name: bot.name,
    company: bot.company,
    policy: policyMap.get(bot.id) || "allow"
  }));

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("API GET Error:", err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "Unknown error", 
      stack: err instanceof Error ? err.stack : undefined 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const db = supabase as unknown as {
    from: (table: string) => {
      upsert: (values: BotPolicyRow) => Promise<{ error: unknown }>;
    };
  };
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { botId, policy } = await req.json();

    if (!botId || !botSignatures.some(b => b.id === botId)) {
      return NextResponse.json({ error: "Invalid botId" }, { status: 400 });
    }
    if (policy !== "allow" && policy !== "block") {
      return NextResponse.json({ error: "Invalid policy" }, { status: 400 });
    }

    // Upsert to Supabase
    const { error } = await db
      .from('bot_policies')
      .upsert({ bot_id: botId, policy, updated_at: new Date().toISOString() });

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Write to Redis
    await redis.set(`policy:${botId}`, policy);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
