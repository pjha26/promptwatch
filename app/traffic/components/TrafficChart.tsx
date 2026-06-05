"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BotName } from "@/lib/types";
import { BOT_CHART_COLORS } from "@/lib/constants";
import { DailyTraffic } from "../hooks/useTrafficData";

interface TrafficChartProps {
  chartData: DailyTraffic[];
  botTotals: Record<BotName, number>;
  hiddenBots: Set<BotName>;
  toggleBot: (bot: BotName) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // payload is ordered according to the stack. We might want to sort it.
    // The prompt says: "tooltip shows date + one line per bot + Total: N"
    let total = 0;
    const items = payload
      .filter((p: any) => p.value > 0)
      .map((p: any) => {
        total += p.value;
        return {
          name: p.name,
          value: p.value,
          color: p.fill,
        };
      });

    // Format label to Wed, 5 Mar 2026
    const dateObj = new Date(label);
    const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md text-sm min-w-[150px]">
        <p className="font-medium text-gray-900 mb-2">{dateStr}</p>
        {/* Reversing items so largest at bottom is displayed at bottom of tooltip, or keep as is? Recharts reverses by default sometimes. */}
        {items.reverse().map((item: any) => (
          <div key={item.name} className="flex justify-between items-center py-0.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-gray-600">{item.name}</span>
            </div>
            <span className="font-medium text-gray-900 ml-4">{item.value.toLocaleString()}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center font-bold text-gray-900">
          <span>Total:</span>
          <span>{total.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  return null;
};

export function TrafficChart({ chartData, botTotals, hiddenBots, toggleBot }: TrafficChartProps) {
  // Sort bots by total visits descending for the legend and stack order
  const sortedBots = useMemo(() => {
    return (Object.entries(botTotals) as [BotName, number][])
      .sort(([, a], [, b]) => b - a)
      .map(([bot]) => bot);
  }, [botTotals]);

  // X-Axis tick logic: label every Nth bar where N = floor(barCount / 12)
  const xTickInterval = useMemo(() => {
    const n = Math.floor(chartData.length / 12);
    return n > 0 ? n - 1 : 0; // Recharts interval is 0-indexed gaps, but we will just pass a function to tickFormatter or filter ticks.
    // Actually, setting interval={n-1} usually works, but let's just let Recharts handle it if it gets messy, or implement it precisely.
  }, [chartData.length]);

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col mb-6">
      {/* Legend Strip */}
      <div className="flex flex-wrap gap-2 p-4 border-b border-gray-100 bg-gray-50/50">
        {sortedBots.map((bot) => {
          const isHidden = hiddenBots.has(bot);
          return (
            <button
              key={bot}
              onClick={() => toggleBot(bot)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-opacity ${
                isHidden ? "opacity-40 hover:opacity-60 bg-gray-100" : "bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
              }`}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: BOT_CHART_COLORS[bot] }}
              />
              <span className={isHidden ? "text-gray-500" : "text-gray-700"}>
                {bot}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chart Body */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[600px] min-h-[380px] h-[45vh] max-h-[600px] p-4 pt-6">
          {sortedBots.length === hiddenBots.size && sortedBots.length > 0 ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
              All bots hidden. Click a legend item to show data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  interval={xTickInterval}
                  tickFormatter={(val) => {
                     // Shorten date for x-axis, e.g. "Mar 5"
                     const d = new Date(val);
                     return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickFormatter={(val) => val.toLocaleString()}
                />
                <Tooltip cursor={{ fill: "#f3f4f6" }} content={<CustomTooltip />} />
                {/* Bars are stacked largest at bottom, smallest at top.
                    Recharts stacks in the order they are rendered.
                    So we render the largest bot first (sortedBots is descending).
                */}
                {sortedBots.map((bot) => (
                  <Bar
                    key={bot}
                    dataKey={bot}
                    stackId="a"
                    fill={BOT_CHART_COLORS[bot]}
                    hide={hiddenBots.has(bot)}
                    isAnimationActive={false} // Disable animation for pure performance
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
