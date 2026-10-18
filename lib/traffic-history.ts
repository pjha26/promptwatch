import { botSignatures } from "@/lib/botSignatures";
import { createRedis } from "@/lib/redis";
import { parseTrafficHistory, reportDays } from "@/lib/traffic-report";

export async function readTrafficHistory() {
  const days = reportDays();
  const keys = botSignatures.flatMap((bot) => [
    ...days.map((day) => `bot:${bot.id}:${day}`),
    ...days.map((day) => `blocked:${bot.id}:${day}`),
  ]);
  const values = await createRedis().mget<(number | null)[]>(...keys);
  return parseTrafficHistory({
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
}
