import { useMemo } from "react";
import { BotName } from "@/lib/types";
import { BOT_CHART_COLORS, BOT_PARENTS } from "@/lib/constants";

interface TopCrawlersProps {
  botTotals: Record<BotName, number>;
}

export function TopCrawlers({ botTotals }: TopCrawlersProps) {
  const topBots = useMemo(() => {
    return (Object.entries(botTotals) as [BotName, number][])
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [botTotals]);

  const maxCount = topBots.length > 0 ? topBots[0][1] : 1;

  if (topBots.length === 0) {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 flex flex-col min-w-0">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Crawlers</h2>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          No crawlers to show.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 flex flex-col min-w-0">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Crawlers</h2>
      <div className="flex flex-col gap-3">
        {topBots.map(([bot, count]) => {
          const percentage = (count / maxCount) * 100;
          const initial = bot.charAt(0).toUpperCase();
          const color = BOT_CHART_COLORS[bot];
          const parent = BOT_PARENTS[bot];

          return (
            <div key={bot} className="relative flex items-center justify-between text-sm py-1">
              {/* Background fill */}
              <div
                className="absolute inset-y-0 left-0 rounded-sm -z-10 transition-all duration-300"
                style={{ width: `${percentage}%`, backgroundColor: color, opacity: 0.08 }}
              />
              <div className="flex items-center gap-2 z-10 pl-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {initial}
                </div>
                <span className="text-gray-900 font-medium truncate">
                  {bot} <span className="text-gray-500 font-normal">({parent})</span>
                </span>
              </div>
              <span className="text-gray-900 font-medium z-10 pr-1 shrink-0">{count.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
