"use client";

import Link from "next/link";
import { useTrafficData } from "../traffic/hooks/useTrafficData";
import { useActionState } from "../actions/hooks/useActionState";
import { CRAWLER_ACTION_LABELS } from "@/lib/crawler-actions";

export function OverviewClient() {
  const { chartData, totalVisits, loading: trafficLoading, error: trafficError } = useTrafficData();
  const {
    actions,
    loading: actionsLoading,
    error: actionsError,
    saveError,
    savingId,
    needsRefresh,
    retry: retryActions,
    updateActionStatus,
  } = useActionState();

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
    <div className="font-dm-sans mx-auto w-full max-w-7xl p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between border-b border-[#E0DDD8] pb-4">
        <h1 className="font-barlow-condensed text-2xl font-bold uppercase tracking-tight text-[#0A0A0A]">
          OVERVIEW
        </h1>
        <div className="font-dm-mono text-sm uppercase text-[#6B6560]">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Row 1 - Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/dashboard/traffic"
          className="flex h-full flex-col justify-between rounded-none border border-[#C8C4BE] bg-[#FFFFFF] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-colors hover:bg-gray-50"
        >
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#E63946]">
            ALLOWED CRAWLER REQUESTS
          </div>
          <div>
            <div
              className={`font-dm-mono mb-1 font-bold text-[#0A0A0A] ${trafficError ? "text-2xl" : "text-5xl"}`}
            >
              {trafficLoading ? "..." : trafficError ? "Unavailable" : totalVisits.toLocaleString()}
            </div>
            <div className="text-sm text-[#6B6560]">last 30 days</div>
          </div>
        </Link>

        <Link
          href="/dashboard/actions"
          className="flex h-full flex-col justify-between rounded-none border border-[#C8C4BE] bg-[#FFFFFF] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-colors hover:bg-gray-50"
        >
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#E63946]">
            ACTIVE ACTIONS
          </div>
          <div>
            <div
              className={`font-dm-mono mb-1 font-bold text-[#0A0A0A] ${actionsError ? "text-2xl" : "text-5xl"}`}
            >
              {actionsLoading ? "..." : actionsError ? "Unavailable" : activeCount}
            </div>
            <div className="text-sm text-[#6B6560]">need your attention</div>
          </div>
        </Link>

        {/* Muted / Coming Soon */}
        <div className="flex h-full cursor-not-allowed flex-col justify-between rounded-none border border-dashed border-[#C8C4BE] bg-[#F5F2EE] p-6 opacity-60 shadow-none">
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#6B6560]">
            PROMPTS TRACKED
          </div>
          <div>
            <div className="font-dm-mono mb-1 text-2xl font-bold text-[#6B6560]">COMING SOON</div>
            <div className="text-sm text-[#6B6560]">Feature in development</div>
          </div>
        </div>

        {/* Muted / Coming Soon */}
        <div className="flex h-full cursor-not-allowed flex-col justify-between rounded-none border border-dashed border-[#C8C4BE] bg-[#F5F2EE] p-6 opacity-60 shadow-none">
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#6B6560]">
            COMPETITORS DETECTED
          </div>
          <div>
            <div className="font-dm-mono mb-1 text-2xl font-bold text-[#6B6560]">COMING SOON</div>
            <div className="text-sm text-[#6B6560]">Feature in development</div>
          </div>
        </div>
      </div>

      {saveError && (
        <p role="alert" className="mb-6 border border-amber-300 bg-amber-50 p-4 text-sm">
          {saveError}{" "}
          <button type="button" onClick={retryActions} className="underline">
            Refresh actions
          </button>
        </p>
      )}
      {/* Row 2 - Two Columns */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Column - 60% */}
        <div className="flex flex-col lg:w-[60%]">
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#E63946]">
            RECENT TRAFFIC
          </div>
          <div className="flex flex-1 flex-col rounded-none border border-[#E0DDD8] bg-[#FFFFFF] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex h-48 flex-1 items-end justify-between gap-2 border-b border-[#E0DDD8] pb-4">
              {trafficLoading ? (
                <div className="flex h-full w-full items-center justify-center text-sm text-[#6B6560]">
                  Loading data...
                </div>
              ) : trafficError ? (
                <p role="alert" className="text-sm text-gray-600">
                  Traffic could not be loaded.
                </p>
              ) : last7Days.length > 0 ? (
                last7Days.map((day, i) => (
                  <div
                    key={i}
                    className="group relative w-full bg-[#0A0A0A] transition-colors hover:bg-[#E63946]"
                    style={{
                      height: day.total > 0 ? `${(day.total / maxTraffic) * 100}%` : "1%",
                    }}
                  >
                    <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {day.total} visits
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-[#6B6560]">
                  No data available
                </div>
              )}
            </div>
            {/* X-axis labels */}
            <div className="font-dm-mono flex justify-between text-xs text-[#6B6560]">
              {trafficLoading || trafficError
                ? null
                : last7Days.map((day, i) => (
                    <div key={i} className="w-full text-center">
                      {day.date
                        ? (() => {
                            const d = new Date(day.date);
                            // Ensure UTC string display properly if needed, but local string is fine for simple display
                            return `${String(d.getUTCDate()).padStart(2, "0")}/${String(
                              d.getUTCMonth() + 1,
                            ).padStart(2, "0")}`;
                          })()
                        : "-"}
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* Right Column - 40% */}
        <div className="flex flex-col lg:w-[40%]">
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#E63946]">
            TOP ACTIONS
          </div>
          <div className="flex flex-1 flex-col justify-between rounded-none border border-[#E0DDD8] bg-[#FFFFFF] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div>
              {actionsLoading ? (
                <div className="py-4 text-sm text-[#6B6560]">Loading actions...</div>
              ) : actionsError ? (
                <p role="alert" className="py-4 text-sm text-gray-600">
                  Recommendations could not be loaded.{" "}
                  <button type="button" onClick={retryActions} className="underline">
                    Retry actions
                  </button>
                </p>
              ) : topActions.length > 0 ? (
                topActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E0DDD8] py-4 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 shrink-0 rounded-full ${getSeverityColor(
                          action.severity,
                        )}`}
                      ></div>
                      <div>
                        <div className="line-clamp-1 text-sm font-medium text-[#0A0A0A]">
                          {action.title}
                        </div>
                        <div className="mt-1 inline-block rounded-none border border-[#E0DDD8] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#6B6560]">
                          {CRAWLER_ACTION_LABELS[action.type]}
                        </div>
                      </div>
                    </div>
                    <button
                      disabled={!!savingId || needsRefresh}
                      onClick={() => void updateActionStatus(action.id, "accepted")}
                      className="ml-4 shrink-0 rounded-none border border-[#0A0A0A] bg-white px-3 py-1.5 text-xs font-medium text-[#0A0A0A] transition-colors hover:bg-gray-50"
                    >
                      {savingId === action.id ? "Saving…" : "Mark reviewed"}
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-4 text-sm text-[#6B6560]">No active actions.</div>
              )}
            </div>

            <Link
              href="/dashboard/actions"
              className="mt-6 block text-sm font-medium text-[#E63946] hover:underline"
            >
              {actionsError ? "View actions" : `View all ${activeCount} actions`} &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
