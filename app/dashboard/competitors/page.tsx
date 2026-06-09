"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

type Engine = "chatgpt" | "claude" | "perplexity" | "gemini";

interface Competitor {
  name: string;
  citations: number;
  engines: Engine[];
  trend: "up" | "down";
}

const competitors: Competitor[] = [
  { name: "OrbitalSEO", citations: 68, engines: ["chatgpt", "claude", "perplexity"], trend: "up" },
  { name: "Veronia", citations: 54, engines: ["chatgpt", "gemini"], trend: "up" },
  { name: "Quench AI", citations: 47, engines: ["perplexity", "claude"], trend: "down" },
  { name: "Tellem", citations: 41, engines: ["chatgpt"], trend: "up" },
  { name: "Pulse AI", citations: 38, engines: ["chatgpt", "perplexity"], trend: "down" },
  { name: "Athrun", citations: 36, engines: ["gemini", "claude"], trend: "down" },
];

const maxCitations = 68;
const totalCitations = competitors.reduce((sum, c) => sum + c.citations, 0);

const getEngineColor = (engine: Engine) => {
  switch (engine) {
    case "chatgpt": return "text-[#10A37F]";
    case "claude": return "text-[#D4A843]";
    case "perplexity": return "text-[#1FB8CD]";
    case "gemini": return "text-[#4285F4]";
  }
};

export default function CompetitorsPage() {
  if (competitors.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full font-dm-sans bg-[#FFFFFF] min-h-screen text-[#0A0A0A]">
        <h1 className="font-barlow-condensed text-2xl font-bold tracking-tight uppercase mb-2">COMPETITORS</h1>
        <div className="border border-[#E0DDD8] p-16 flex flex-col items-center justify-center text-center mt-8">
          <h2 className="font-barlow-condensed text-xl font-bold mb-2">NO COMPETITORS DETECTED</h2>
          <p className="font-dm-sans text-sm text-[#6B6560]">Promptwatch hasn&apos;t detected any competitor citations yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full font-dm-sans bg-[#FFFFFF] min-h-screen text-[#0A0A0A]">
      {/* Header */}
      <h1 className="font-barlow-condensed text-2xl font-bold tracking-tight uppercase mb-2">COMPETITORS</h1>
      <div className="font-dm-mono text-xs text-[#6B6560] uppercase tracking-wider mb-8">
        {competitors.length} COMPETITORS DETECTED · LAST 90 DAYS
      </div>

      {/* Summary Strip */}
      <div className="flex flex-col md:flex-row border border-[#E0DDD8] divide-y md:divide-y-0 md:divide-x divide-[#E0DDD8] mb-8">
        <div className="flex-1 px-6 py-4">
          <div className="text-[#E63946] text-[10px] font-semibold uppercase tracking-widest mb-1">MOST CITED</div>
          <div className="font-dm-mono font-bold text-[#0A0A0A]">OrbitalSEO</div>
        </div>
        <div className="flex-1 px-6 py-4">
          <div className="text-[#E63946] text-[10px] font-semibold uppercase tracking-widest mb-1">TOTAL COMPETITOR CITATIONS</div>
          <div className="font-dm-mono font-bold text-[#0A0A0A]">{totalCitations}</div>
        </div>
        <div className="flex-1 px-6 py-4">
          <div className="text-[#E63946] text-[10px] font-semibold uppercase tracking-widest mb-1">ENGINES WITH COMPETITOR BIAS</div>
          <div className="font-dm-mono font-bold text-[#0A0A0A]">3 OF 4</div>
        </div>
      </div>

      {/* Competitors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competitors.map((c) => {
          const pct = Math.round((c.citations / totalCitations) * 100);
          const barWidth = Math.round((c.citations / maxCitations) * 100);

          return (
            <div
              key={c.name}
              className="border border-[#E0DDD8] p-6 bg-white hover:border-[#0A0A0A] transition-all duration-200 hover:-translate-y-[2px] cursor-default"
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-barlow-condensed text-xl font-bold text-[#0A0A0A]">{c.name}</h3>
                {c.trend === "up" ? (
                  <TrendingUp className="w-5 h-5 text-[#059669]" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-[#DC2626]" />
                )}
              </div>

              {/* Citation count */}
              <div className="font-dm-mono text-4xl font-bold text-[#0A0A0A] mb-1">{c.citations}</div>
              <div className="text-[#E63946] text-[10px] font-semibold uppercase tracking-widest">CITATIONS IN LAST 90 DAYS</div>

              {/* Divider */}
              <div className="border-t border-[#E0DDD8] my-4" />

              {/* Engines */}
              <div className="text-[#E63946] text-[10px] font-semibold uppercase tracking-widest mb-2">CITED BY</div>
              <div className="flex flex-nowrap gap-1 mb-4">
                {c.engines.map((engine) => (
                  <span
                    key={engine}
                    className={`text-[11px] border border-[#E0DDD8] px-1.5 py-0.5 capitalize bg-white ${getEngineColor(engine)}`}
                  >
                    {engine}
                  </span>
                ))}
              </div>

              {/* Citation share bar */}
              <div className="bg-[#F5F2EE] h-1 w-full mb-2">
                <div className="bg-[#0A0A0A] h-1" style={{ width: `${barWidth}%` }} />
              </div>
              <div className="font-dm-mono text-xs text-[#6B6560]">{pct}% of competitor citations</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
