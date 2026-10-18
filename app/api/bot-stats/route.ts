import { apiJson, requireOwner } from "@/lib/api-auth";
import { botSignatures } from "@/lib/botSignatures";
import { createRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    const date = new Date().toISOString().slice(0, 10);
    const values = await createRedis().mget<(number | null)[]>(
      ...botSignatures.map((bot) => `bot:${bot.id}:${date}`),
    );
    if (
      values.length !== botSignatures.length ||
      values.some((value) => value !== null && (!Number.isSafeInteger(value) || value < 0))
    ) {
      throw new Error("Invalid counters");
    }
    return apiJson({
      date,
      counts: botSignatures.map((bot, index) => ({
        id: bot.id,
        name: bot.name,
        hits: values[index] ?? 0,
      })),
    });
  } catch {
    return apiJson({ error: "Traffic statistics are temporarily unavailable." }, 503);
  }
}
