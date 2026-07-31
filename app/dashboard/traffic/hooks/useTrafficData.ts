"use client";

import { useState, useEffect, useMemo } from "react";

export interface DailyTraffic {
  date: string;
  total: number;
  [key: string]: string | number; // Bot names mapped to their counts
}

interface HistoryBot {
  id: string;
  name: string;
  hitsByDay: number[];
}

interface HistoryResponse {
  days: string[];
  bots: HistoryBot[];
}

export function useTrafficData() {
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const retry = () => setAttempt((a) => a + 1);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch("/api/bot-stats/history")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json: HistoryResponse) => {
        setHistoryData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, [attempt]);

  const { chartData, botTotals, pageTotals, totalVisits } = useMemo(() => {
    if (!historyData) {
      return {
        chartData: [] as DailyTraffic[],
        botTotals: {} as Record<string, number>,
        pageTotals: {} as Record<string, number>,
        totalVisits: 0,
      };
    }

    const { days, bots } = historyData;
    const botTotals = {} as Record<string, number>;
    let totalVisits = 0;

    // The API returns pre-aggregated day × bot data, so we just reshape it
    // into the DailyTraffic[] format the TrafficChart component expects.
    const chartData: DailyTraffic[] = days.map((date, dayIndex) => {
      const row: DailyTraffic = { date, total: 0 };
      for (const bot of bots) {
        const hits = bot.hitsByDay[dayIndex] ?? 0;
        // Use bot.name as the key to match what TrafficChart expects
        row[bot.name] = hits;
        row.total += hits;

        // Accumulate bot totals
        botTotals[bot.name] = (botTotals[bot.name] || 0) + hits;
        totalVisits += hits;
      }
      return row;
    });

    // TODO: Top Pages data requires path-level logging in middleware.ts (not yet implemented).
    // Passing empty pageTotals so the TopPages panel renders its empty state.
    const pageTotals = {} as Record<string, number>;

    return { chartData, botTotals, pageTotals, totalVisits };
  }, [historyData]);

  return { data: historyData, loading, error, chartData, botTotals, pageTotals, totalVisits, retry };
}
