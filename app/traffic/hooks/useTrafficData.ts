import { useState, useEffect, useMemo } from "react";
import { AiVisit, BotName } from "@/lib/types";

export interface DailyTraffic {
  date: string;
  total: number;
  [key: string]: string | number; // Bot names mapped to their counts
}

export function useTrafficData() {
  const [data, setData] = useState<AiVisit[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const retry = () => setAttempt((a) => a + 1);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch("/visits.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, [attempt]);

  const { chartData, botTotals, pageTotals, totalVisits } = useMemo(() => {
    if (!data) {
      return { chartData: [], botTotals: {} as Record<BotName, number>, pageTotals: {} as Record<string, number>, totalVisits: 0 };
    }

    const botTotals = {} as Record<BotName, number>;
    const pageTotals = {} as Record<string, number>;
    const dailyMap = new Map<string, DailyTraffic>();
    let totalVisits = 0;

    for (let i = 0; i < data.length; i++) {
      const visit = data[i];
      const bot = visit.bot;
      const path = visit.page_path;
      // Extract date string YYYY-MM-DD from timestamp
      const date = visit.timestamp.substring(0, 10);

      // Total count
      totalVisits++;

      // Bot totals
      botTotals[bot] = (botTotals[bot] || 0) + 1;

      // Page totals
      pageTotals[path] = (pageTotals[path] || 0) + 1;

      // Daily aggregation
      let daily = dailyMap.get(date);
      if (!daily) {
        daily = { date, total: 0 };
        dailyMap.set(date, daily);
      }
      daily[bot] = (daily[bot] as number || 0) + 1;
      daily.total += 1;
    }

    // Sort chart data by date
    const chartData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return { chartData, botTotals, pageTotals, totalVisits };
  }, [data]);

  return { data, loading, error, chartData, botTotals, pageTotals, totalVisits };
}
