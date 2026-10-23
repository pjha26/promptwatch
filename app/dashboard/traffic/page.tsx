"use client";

import { useState, useCallback } from "react";
import { useTrafficData } from "./hooks/useTrafficData";
import { usePageData } from "./hooks/usePageData";
import { SummaryHeader } from "./components/SummaryHeader";
import { TrafficChart } from "./components/TrafficChart";
import { TopCrawlers } from "./components/TopCrawlers";
import { TopPages } from "./components/TopPages";

export default function TrafficDashboard() {
  const {
    loading,
    error,
    chartData,
    botTotals,
    botBlockedTotals,
    botLimitedTotals,
    totalVisits,
    retry,
  } = useTrafficData();
  const pages = usePageData();
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

  const botCount = Object.keys(botTotals).filter(
    (b) => botTotals[b] > 0 || botBlockedTotals[b] > 0 || botLimitedTotals[b] > 0,
  ).length;
  const pageCount = pages.data ? Object.keys(pages.data.pageTotals).length : null;
  const blockedTotal = Object.values(botBlockedTotals).reduce((sum, count) => sum + count, 0);

  if (loading) {
    return (
      <div className="dashboard-page">
        <header className="mb-gutter mt-8 md:mt-0">
          <h1 className="dashboard-title">AI Traffic</h1>
        </header>
        {/* Loading skeleton */}
        <p role="status" className="mb-4 text-sm text-[#6B6560]">
          Loading recorded traffic…
        </p>
        <div aria-hidden="true" className="animate-pulse space-y-6">
          <div className="h-16 rounded-xl bg-gray-200"></div>
          <div className="h-[400px] rounded-xl bg-gray-200"></div>
          <div className="flex gap-4">
            <div className="h-[300px] flex-1 rounded-xl bg-gray-200"></div>
            <div className="h-[300px] flex-1 rounded-xl bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <header className="mb-gutter mt-8 md:mt-0">
          <h1 className="dashboard-title">AI Traffic</h1>
        </header>
        <div role="alert" className="border border-[#E0DDD8] p-8 text-center">
          <p className="mb-4 text-gray-500">Failed to load traffic data.</p>
          <button
            onClick={retry}
            className="brutalist-hover border border-primary px-6 py-2 font-label-caps text-label-caps"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Responsive container for main content */}
      <div>
        {/* Summary */}
        <SummaryHeader
          total={totalVisits}
          blocked={blockedTotal}
          limited={Object.values(botLimitedTotals).reduce((sum, count) => sum + count, 0)}
          botCount={botCount}
          pageCount={pageCount}
        />

        {/* Stacked Bar Chart */}
        <p className="mb-4 text-sm text-gray-500">
          The chart shows requests allowed by bot policy. Blocked requests are counted separately.
          User-Agent matches do not verify crawler identity.
        </p>
        <TrafficChart
          chartData={chartData}
          botTotals={botTotals}
          hiddenBots={hiddenBots}
          toggleBot={toggleBot}
        />

        {/* Bottom panels */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          <TopCrawlers
            botTotals={botTotals}
            botBlockedTotals={botBlockedTotals}
            botLimitedTotals={botLimitedTotals}
          />
          <TopPages
            pageTotals={pages.data?.pageTotals ?? {}}
            blockedPageTotals={pages.data?.blockedPageTotals ?? {}}
            limitedPageTotals={pages.data?.limitedPageTotals ?? {}}
            startedAt={pages.data?.startedAt ?? null}
            loading={pages.loading}
            error={pages.error}
            retry={pages.retry}
          />
        </div>
      </div>
    </div>
  );
}
