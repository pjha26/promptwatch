"use client";

import { useState, useCallback } from "react";
import { useTrafficData } from "./hooks/useTrafficData";
import { SummaryHeader } from "./components/SummaryHeader";
import { TrafficChart } from "./components/TrafficChart";
import { TopCrawlers } from "./components/TopCrawlers";
import { TopPages } from "./components/TopPages";

export default function TrafficDashboard() {
  const { loading, error, chartData, botTotals, botBlockedTotals, pageTotals, totalVisits, retry } = useTrafficData();
  const [hiddenBots, setHiddenBots] = useState<Set<string>>(new Set());

  const toggleBot = useCallback((bot: string) => {
    setHiddenBots((prev) => {
      const next = new Set(prev);
      if (next.has(bot)) {
        next.delete(bot);
      } else {
        next.add(bot);
      }
      return next;
    });
  }, []);

  const botCount = Object.keys(botTotals).filter((b) => botTotals[b] > 0).length;
  const pageCount = Object.keys(pageTotals).length;

  if (loading) {
    return (
      <div className="w-full px-margin-mobile md:px-0">
        <header className="mb-gutter mt-8 md:mt-0">
          <h1 className="font-data-mono text-data-mono text-secondary uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-secondary block"></span>
            01 — BOT TRAFFIC OVERVIEW
          </h1>
        </header>
        {/* Loading skeleton */}
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-gray-200 rounded-xl"></div>
          <div className="h-[400px] bg-gray-200 rounded-xl"></div>
          <div className="flex gap-4">
            <div className="flex-1 h-[300px] bg-gray-200 rounded-xl"></div>
            <div className="flex-1 h-[300px] bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-margin-mobile md:px-0">
        <header className="mb-gutter mt-8 md:mt-0">
          <h1 className="font-data-mono text-data-mono text-secondary uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-secondary block"></span>
            01 — BOT TRAFFIC OVERVIEW
          </h1>
        </header>
        <div className="border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 mb-4">Failed to load traffic data.</p>
          <button
            onClick={retry}
            className="border border-primary px-6 py-2 font-label-caps text-label-caps brutalist-hover"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <header className="mb-gutter mt-8 md:mt-0 px-margin-mobile md:px-0">
        <h1 className="font-data-mono text-data-mono text-secondary uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-secondary block"></span>
          01 — BOT TRAFFIC OVERVIEW
        </h1>
      </header>

      {/* Responsive container for main content */}
      <div className="px-margin-mobile md:px-0">
        {/* Summary */}
        <SummaryHeader total={totalVisits} botCount={botCount} pageCount={pageCount} />

        {/* Stacked Bar Chart */}
        <TrafficChart
          chartData={chartData}
          botTotals={botTotals}
          hiddenBots={hiddenBots}
          toggleBot={toggleBot}
        />

        {/* Bottom panels */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <TopCrawlers botTotals={botTotals} botBlockedTotals={botBlockedTotals} />
          {/* TODO: TopPages requires path-level logging in middleware.ts — currently shows empty state */}
          <TopPages pageTotals={pageTotals} />
        </div>
      </div>
    </div>
  );
}
