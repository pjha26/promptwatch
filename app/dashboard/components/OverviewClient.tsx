"use client";

import Link from "next/link";
import { useTrafficData } from "../traffic/hooks/useTrafficData";
import { useActionState } from "../actions/hooks/useActionState";

export function OverviewClient() {
  const { chartData, totalVisits, loading: trafficLoading } = useTrafficData();
  const { actions, loading: actionsLoading, updateActionStatus } = useActionState();

  const activeActions = actions.filter((a) => a.status === "active");
  const activeCount = activeActions.length;

  const topActions = [...activeActions]
    .sort((a, b) => {
      const severityWeight = { high: 3, medium: 2, low: 1 };
      return severityWeight[b.severity] - severityWeight[a.severity];
    })
    .slice(0, 3);

  const last7Days = chartData.slice(-7);
  const maxTraffic = Math.max(...last7Days.map((d) => d.total), 1);

  // Pad to 7 days if less
  while (last7Days.length > 0 && last7Days.length < 7) {
    last7Days.unshift({ date: "", total: 0 });
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-[#E63946]";
      case "medium":
        return "bg-amber-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full font-dm-sans">
      {/* Header */}
      <div className="flex justify-between items-end mb-8 border-b border-[#E0DDD8] pb-4">
        <h1 className="font-barlow-condensed text-2xl font-bold tracking-tight text-[#0A0A0A] uppercase">
          OVERVIEW
        </h1>
        <div className="font-dm-mono text-[#6B6560] text-sm uppercase">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Row 1 - Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          href="/dashboard/traffic"
          className="bg-[#FFFFFF] border border-[#C8C4BE] rounded-none p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col justify-between h-full hover:bg-gray-50 transition-colors"
        >
          <div className="text-[#E63946] text-xs font-semibold uppercase tracking-widest mb-4">
            TOTAL AI VISITS
          </div>
          <div>
            <div className="font-dm-mono text-5xl font-bold text-[#0A0A0A] mb-1">
              {trafficLoading ? "..." : totalVisits.toLocaleString()}
            </div>
            <div className="text-[#6B6560] text-sm">last 30 days</div>
          </div>
        </Link>

        <Link
          href="/dashboard/actions"
          className="bg-[#FFFFFF] border border-[#C8C4BE] rounded-none p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col justify-between h-full hover:bg-gray-50 transition-colors"
        >
          <div className="text-[#E63946] text-xs font-semibold uppercase tracking-widest mb-4">
            ACTIVE ACTIONS
          </div>
          <div>
            <div className="font-dm-mono text-5xl font-bold text-[#0A0A0A] mb-1">
              {actionsLoading ? "..." : activeCount}
            </div>
            <div className="text-[#6B6560] text-sm">need your attention</div>
          </div>
        </Link>

        {/* Muted / Coming Soon */}
        <div className="bg-[#F5F2EE] opacity-60 border border-[#C8C4BE] border-dashed rounded-none p-6 shadow-none flex flex-col justify-between h-full cursor-not-allowed">
          <div className="text-[#6B6560] text-xs font-semibold uppercase tracking-widest mb-4">
            PROMPTS TRACKED
          </div>
          <div>
            <div className="font-dm-mono text-2xl font-bold text-[#6B6560] mb-1">
              COMING SOON
            </div>
            <div className="text-[#6B6560] text-sm">Feature in development</div>
          </div>
        </div>

        {/* Muted / Coming Soon */}
        <div className="bg-[#F5F2EE] opacity-60 border border-[#C8C4BE] border-dashed rounded-none p-6 shadow-none flex flex-col justify-between h-full cursor-not-allowed">
          <div className="text-[#6B6560] text-xs font-semibold uppercase tracking-widest mb-4">
            COMPETITORS DETECTED
          </div>
          <div>
            <div className="font-dm-mono text-2xl font-bold text-[#6B6560] mb-1">
              COMING SOON
            </div>
            <div className="text-[#6B6560] text-sm">Feature in development</div>
          </div>
        </div>
      </div>

      {/* Row 2 - Two Columns */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - 60% */}
        <div className="lg:w-[60%] flex flex-col">
          <div className="text-[#E63946] text-xs font-semibold uppercase tracking-widest mb-4">
            RECENT TRAFFIC
          </div>
          <div className="bg-[#FFFFFF] border border-[#E0DDD8] rounded-none p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex-1 flex flex-col">
            <div className="flex-1 flex items-end justify-between gap-2 h-48 mb-4 border-b border-[#E0DDD8] pb-4">
              {trafficLoading ? (
                <div className="w-full h-full flex items-center justify-center text-[#6B6560] text-sm">
                  Loading data...
                </div>
              ) : last7Days.length > 0 ? (
                last7Days.map((day, i) => (
                  <div
                    key={i}
                    className="w-full bg-[#0A0A0A] hover:bg-[#E63946] transition-colors relative group"
                    style={{
                      height: day.total > 0 ? `${(day.total / maxTraffic) * 100}%` : "1%",
                    }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {day.total} visits
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#6B6560] text-sm">
                  No data available
                </div>
              )}
            </div>
            {/* X-axis labels */}
            <div className="flex justify-between font-dm-mono text-xs text-[#6B6560]">
              {trafficLoading
                ? null
                : last7Days.map((day, i) => (
                    <div key={i} className="w-full text-center">
                      {day.date
                        ? (() => {
                            const d = new Date(day.date);
                            // Ensure UTC string display properly if needed, but local string is fine for simple display
                            return `${String(d.getUTCDate()).padStart(2, "0")}/${String(
                              d.getUTCMonth() + 1
                            ).padStart(2, "0")}`;
                          })()
                        : "-"}
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* Right Column - 40% */}
        <div className="lg:w-[40%] flex flex-col">
          <div className="text-[#E63946] text-xs font-semibold uppercase tracking-widest mb-4">
            TOP ACTIONS
          </div>
          <div className="bg-[#FFFFFF] border border-[#E0DDD8] rounded-none p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex-1 flex flex-col justify-between">
            <div>
              {actionsLoading ? (
                <div className="py-4 text-[#6B6560] text-sm">Loading actions...</div>
              ) : topActions.length > 0 ? (
                topActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between py-4 border-b border-[#E0DDD8] last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${getSeverityColor(
                          action.severity
                        )}`}
                      ></div>
                      <div>
                        <div className="text-sm font-medium text-[#0A0A0A] line-clamp-1">
                          {action.title}
                        </div>
                        <div className="mt-1 inline-block border border-[#E0DDD8] text-[#6B6560] text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-none">
                          {action.type.replace(/_/g, " ")}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => updateActionStatus(action.id, "accepted")}
                      className="border border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-medium px-3 py-1.5 rounded-none transition-colors hover:bg-gray-50 shrink-0 ml-4"
                    >
                      Accept
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-4 text-[#6B6560] text-sm">No active actions.</div>
              )}
            </div>

            <Link
              href="/dashboard/actions"
              className="text-[#E63946] text-sm font-medium hover:underline mt-6 block"
            >
              View all {activeCount} actions &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
