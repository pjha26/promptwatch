import { useMemo } from "react";
import { BOT_CHART_COLORS, BOT_PARENTS } from "@/lib/constants";

// Fallback palette for bots not in the legacy color map
const FALLBACK_COLORS = ["#8b5cf6", "#f59e0b", "#ef4444", "#14b8a6", "#6366f1", "#ec4899"];

interface TopCrawlersProps {
  botTotals: Record<string, number>;
  botBlockedTotals?: Record<string, number>;
}

export function TopCrawlers({ botTotals, botBlockedTotals }: TopCrawlersProps) {
  const topBots = useMemo(() => {
    return Object.entries(botTotals)
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
        {topBots.map(([bot, count], i) => {
          const percentage = (count / maxCount) * 100;
          const initial = bot.charAt(0).toUpperCase();
          const color = (BOT_CHART_COLORS as Record<string, string>)[bot] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
          const parent = (BOT_PARENTS as Record<string, string>)[bot] ?? "";

          const blockedCount = botBlockedTotals?.[bot] ?? 0;

          return (
            <div key={bot} className="relative flex items-center justify-between text-sm py-1 text-gray-900">
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${percentage}%`,
                  backgroundColor: "currentColor",
                  opacity: 0.07,
                  pointerEvents: "none",
                }}
              />
              <div className="flex items-center gap-2 z-10 pl-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {initial}
                </div>
                <span className="text-gray-900 font-medium truncate">
                  {bot} {parent && <span className="text-gray-500 font-normal">({parent})</span>}
                </span>
              </div>
              <div className="flex items-center gap-3 z-10 pr-1 shrink-0">
                {blockedCount > 0 && (
                  <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">
                    Blocked: {blockedCount.toLocaleString()}
                  </span>
                )}
                <span className="text-gray-900 font-medium">{count.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
