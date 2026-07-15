"use client";

import { MetricCards } from './components/MetricCards';
import { VolumeChart } from './components/VolumeChart';
import { BotTable } from './components/BotTable';
import { mockMetrics, mockChartData, mockBots } from './mockData';

export default function TrafficDashboard() {
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
        {/* Top Section: Metric Heroes */}
        <MetricCards metrics={mockMetrics} />

        {/* Center Section: Chart Panel */}
        <VolumeChart data={mockChartData} />

        {/* Bottom Section: Detailed Table */}
        <BotTable bots={mockBots} />
      </div>
    </div>
  );
}
