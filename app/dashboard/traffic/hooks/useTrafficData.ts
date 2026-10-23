"use client";

import { useState, useEffect, useMemo } from "react";
import { parseTrafficHistory, type TrafficHistory } from "@/lib/traffic-report";

export interface DailyTraffic {
  date: string;
  total: number;
  [key: string]: string | number; // Bot names mapped to their counts
}

export function useTrafficData() {
  const [historyData, setHistoryData] = useState<TrafficHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const retry = () => setAttempt((a) => a + 1);

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]);
    setLoading(true);
    setError(false);
    setHistoryData(null);
    fetch("/api/bot-stats/history", { cache: "no-store", signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json: unknown) => {
        const history = parseTrafficHistory(json);
        if (controller.signal.aborted) return;
        setHistoryData(history);
        setLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  const { chartData, botTotals, botBlockedTotals, botLimitedTotals, totalVisits } = useMemo(() => {
    if (!historyData) {
      return {
        chartData: [] as DailyTraffic[],
        botTotals: {} as Record<string, number>,
        botBlockedTotals: {} as Record<string, number>,
        botLimitedTotals: {} as Record<string, number>,
        totalVisits: 0,
      };
    }

    const { days, bots } = historyData;
    const botTotals = {} as Record<string, number>;
    const botBlockedTotals = {} as Record<string, number>;
    const botLimitedTotals = {} as Record<string, number>;
    let totalVisits = 0;

    // The API returns pre-aggregated day × bot data, so we just reshape it
    // into the DailyTraffic[] format the TrafficChart component expects.
    const chartData: DailyTraffic[] = days.map((date, dayIndex) => {
      const row: DailyTraffic = { date, total: 0 };
      for (const bot of bots) {
        const hits = bot.hitsByDay[dayIndex] ?? 0;
        const blocked = bot.blockedByDay[dayIndex] ?? 0;
        // Use bot.name as the key to match what TrafficChart expects
        row[bot.name] = hits;
        row.total += hits;

        // Accumulate bot totals
        botTotals[bot.name] = (botTotals[bot.name] || 0) + hits;
        botBlockedTotals[bot.name] = (botBlockedTotals[bot.name] || 0) + blocked;
        botLimitedTotals[bot.name] =
          (botLimitedTotals[bot.name] || 0) + (bot.limitedByDay?.[dayIndex] ?? 0);
        totalVisits += hits;
      }
      return row;
    });

    return { chartData, botTotals, botBlockedTotals, botLimitedTotals, totalVisits };
  }, [historyData]);

  return {
    data: historyData,
    loading,
    error,
    chartData,
    botTotals,
    botBlockedTotals,
    botLimitedTotals,
    totalVisits,
    retry,
  };
}
