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
      .map(([bot, count]) => [bot, count + (botBlockedTotals?.[bot] ?? 0)] as const)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [botTotals, botBlockedTotals]);

  const maxCount = topBots.length > 0 ? topBots[0][1] : 1;

  if (topBots.length === 0) {
    return (
      <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Top Crawlers</h2>
        <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
          No crawlers to show.
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">Top Crawlers</h2>
      <div className="flex flex-col gap-3">
        {topBots.map(([bot, count], i) => {
          const percentage = (count / maxCount) * 100;
          const initial = bot.charAt(0).toUpperCase();
          const color =
            (BOT_CHART_COLORS as Record<string, string>)[bot] ??
            FALLBACK_COLORS[i % FALLBACK_COLORS.length];
          const parent = (BOT_PARENTS as Record<string, string>)[bot] ?? "";

          const blockedCount = botBlockedTotals?.[bot] ?? 0;

          return (
            <div
              key={bot}
              className="relative flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1 text-sm text-gray-900"
            >
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
              <div className="z-10 flex min-w-0 basis-full items-center gap-2 pl-1 sm:basis-auto">
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {initial}
                </div>
                <span className="truncate font-medium text-gray-900">
                  {bot} {parent && <span className="font-normal text-gray-500">({parent})</span>}
                </span>
              </div>
              <div className="z-10 ml-auto flex max-w-full flex-wrap items-center gap-3 pr-1">
                {blockedCount > 0 && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400">
                    Blocked: {blockedCount.toLocaleString()}
                  </span>
                )}
                <span className="font-medium text-gray-900">
                  {(botTotals[bot] ?? 0).toLocaleString()} allowed
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
