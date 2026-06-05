"use client";

import { useState, useCallback } from "react";
import { useTrafficData } from "./hooks/useTrafficData";
import { SummaryHeader } from "./components/SummaryHeader";
import { TrafficChart } from "./components/TrafficChart";
import { TopPages } from "./components/TopPages";
import { TopCrawlers } from "./components/TopCrawlers";
import { BotName } from "@/lib/types";

export default function TrafficPage() {
  const { data, loading, error, chartData, botTotals, pageTotals, totalVisits } = useTrafficData();
  const [hiddenBots, setHiddenBots] = useState<Set<BotName>>(new Set());

  const toggleBot = useCallback((bot: BotName) => {
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

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-gray-900">AI Traffic</h1>
          <p className="mt-1 text-sm text-gray-500">—</p>
        </div>
        
        <div className="w-full bg-white border border-gray-200 rounded-xl mb-6 min-h-[380px] h-[45vh] max-h-[600px] flex flex-col items-center justify-center text-center p-6">
          <p className="text-gray-900 font-medium mb-1">Couldn't load traffic data.</p>
          <p className="text-gray-500 text-sm mb-4">Try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 flex flex-col min-w-0">
             <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Pages</h2>
             <div className="flex-1 flex items-center justify-center text-sm text-gray-500">No pages to show.</div>
          </div>
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 flex flex-col min-w-0">
             <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Crawlers</h2>
             <div className="flex-1 flex items-center justify-center text-sm text-gray-500">No crawlers to show.</div>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-gray-900">AI Traffic</h1>
          <p className="mt-1 text-sm text-gray-500">—</p>
        </div>
        
        {/* Chart Skeleton */}
        <div className="w-full bg-gray-100 rounded-xl mb-6 min-h-[380px] h-[45vh] max-h-[600px] animate-pulse"></div>
        
        {/* Panels Skeleton */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Pages</h2>
            <div className="flex flex-col gap-4 mt-2 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-0.5">
                  <div className={`h-3 bg-gray-200 rounded ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`}></div>
                  <div className="h-3 bg-gray-200 rounded w-8"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Crawlers</h2>
            <div className="flex flex-col gap-4 mt-2 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded-full shrink-0"></div>
                    <div className={`h-3 bg-gray-200 rounded ${i % 2 === 0 ? 'w-32' : 'w-24'}`}></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-8"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const hasData = data && data.length > 0;

  if (!hasData) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <SummaryHeader total={0} botCount={0} pageCount={0} />
        
        <div className="w-full bg-gray-50 border border-gray-200 border-dashed rounded-xl mb-6 min-h-[380px] h-[45vh] max-h-[600px] flex items-center justify-center text-center p-6">
          <div>
            <p className="text-gray-900 font-medium mb-1">No AI traffic yet.</p>
            <p className="text-gray-500 text-sm">Once AI crawlers visit your site, you'll see them here.</p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 flex flex-col min-w-0">
             <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Pages</h2>
             <div className="flex-1 flex items-center justify-center text-sm text-gray-500">No pages to show.</div>
          </div>
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 flex flex-col min-w-0">
             <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Crawlers</h2>
             <div className="flex-1 flex items-center justify-center text-sm text-gray-500">No crawlers to show.</div>
          </div>
        </div>
      </main>
    );
  }

  const activeBotCount = Object.keys(botTotals).length;
  const activePageCount = Object.keys(pageTotals).length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <SummaryHeader 
        total={totalVisits} 
        botCount={activeBotCount} 
        pageCount={activePageCount} 
      />
      
      <TrafficChart 
        chartData={chartData} 
        botTotals={botTotals} 
        hiddenBots={hiddenBots} 
        toggleBot={toggleBot} 
      />
      
      <div className="flex flex-col lg:flex-row gap-6">
        <TopPages pageTotals={pageTotals} />
        <TopCrawlers botTotals={botTotals} />
      </div>
    </main>
  );
}
