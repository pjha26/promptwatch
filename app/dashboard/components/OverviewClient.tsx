"use client";

import Link from "next/link";
import { useTrafficData } from "../traffic/hooks/useTrafficData";
import { useActionState } from "../actions/hooks/useActionState";
import { CRAWLER_ACTION_LABELS } from "@/lib/crawler-actions";
import { buildTrafficReport } from "@/lib/traffic-report";

export function OverviewClient() {
  const {
    data,
    chartData,
    loading: trafficLoading,
    error: trafficError,
    retry: retryTraffic,
  } = useTrafficData();
  const traffic = data ? buildTrafficReport(data, 30) : null;
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
    <div className="dashboard-page">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-[#E0DDD8] pb-4">
        <h1 className="dashboard-title">OVERVIEW</h1>
        <p className="text-sm text-[#6B6560]">
          Recorded crawler activity · UTC dates; today is partial
        </p>
      </div>

      {/* Row 1 - Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Allowed crawler requests",
            value: traffic?.allowed,
            detail: "Last 30 days; page delivery is not measured",
          },
          {
            label: "Blocked crawler requests",
            value: traffic?.blocked,
            detail: "Last 30 days; denied by bot policy",
          },
          {
            label: "Active crawlers",
            value: traffic?.activeCrawlers,
            detail: "Last 30 days; includes blocked-only activity",
          },
        ].map((metric) => (
          <Link
            key={metric.label}
            href="/dashboard/reports"
            className="flex h-full min-w-0 flex-col justify-between border border-[#E0DDD8] bg-white p-6 transition-colors hover:bg-gray-50"
          >
            <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#E63946]">
              {metric.label}
            </div>
            <div className="mb-2 break-words font-mono text-3xl font-bold">
              {trafficLoading
                ? "Loading…"
                : trafficError || !traffic
                  ? "Unavailable"
                  : metric.value?.toLocaleString()}
            </div>
            <p className="text-sm text-[#6B6560]">{metric.detail}</p>
          </Link>
        ))}

        <Link
          href="/dashboard/actions"
          className="flex h-full flex-col justify-between rounded-none border border-[#E0DDD8] bg-[#FFFFFF] p-6 transition-colors hover:bg-gray-50"
        >
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#E63946]">
            ACTIVE ACTIONS
          </div>
          <div>
            <div className="mb-2 break-words font-mono text-3xl font-bold text-[#0A0A0A]">
              {actionsLoading ? "Loading…" : actionsError ? "Unavailable" : activeCount}
            </div>
            <div className="text-sm text-[#6B6560]">Need attention; last 7 complete UTC days</div>
          </div>
        </Link>
      </div>

      <p className="mb-6 text-sm text-[#6B6560]">
        Counts reflect recorded User-Agent matches, not verified identities or AI citations. Zero
        counts alone do not confirm collection is healthy.{" "}
        <Link href="/dashboard/health" className="underline">
          Check tracking health
        </Link>
        .
      </p>

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
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#E63946]">
            ALLOWED REQUESTS · LAST 7 UTC DAYS
          </h2>
          <div className="flex flex-1 flex-col rounded-none border border-[#E0DDD8] bg-[#FFFFFF] p-6">
            <div
              aria-hidden="true"
              className="mb-4 flex h-48 items-end justify-between gap-2 border-b border-[#E0DDD8] pb-4"
            >
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
                      height: `${(day.total / maxTraffic) * 100}%`,
                    }}
                  >
                    <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {day.total} allowed requests
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
            <div
              aria-hidden="true"
              className="flex justify-between font-mono text-xs text-[#6B6560]"
            >
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
            {!trafficLoading && !trafficError && (
              <table className="sr-only">
                <caption>
                  Allowed crawler requests for the last seven available UTC dates; today is partial
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Date (UTC)</th>
                    <th scope="col">Allowed requests</th>
                  </tr>
                </thead>
                <tbody>
                  {last7Days.map((day) => (
                    <tr key={day.date}>
                      <th scope="row">{day.date}</th>
                      <td>{day.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!trafficLoading && trafficError && (
              <p role="alert" className="mt-3 text-sm">
                Traffic could not be loaded.{" "}
                <button type="button" onClick={retryTraffic} className="underline">
                  Retry traffic
                </button>
              </p>
            )}
            {!trafficLoading &&
              !trafficError &&
              last7Days.length > 0 &&
              last7Days.every((day) => day.total === 0) && (
                <p className="mt-3 text-sm text-[#6B6560]">
                  No allowed requests recorded in these dates. Check blocked counts and tracking
                  health separately.
                </p>
              )}
          </div>
        </div>

        {/* Right Column - 40% */}
        <div className="flex flex-col lg:w-[40%]">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#E63946]">
            TOP ACTIONS
          </h2>
          <div className="flex flex-1 flex-col justify-between rounded-none border border-[#E0DDD8] bg-[#FFFFFF] p-6">
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
                        aria-hidden="true"
                      ></div>
                      <div>
                        <div className="line-clamp-1 text-sm font-medium text-[#0A0A0A]">
                          {action.title}
                        </div>
                        <div className="mt-1 inline-block rounded-none border border-[#E0DDD8] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#6B6560]">
                          {action.severity} priority · {CRAWLER_ACTION_LABELS[action.type]}
                        </div>
                      </div>
                    </div>
                    <button
                      disabled={!!savingId || needsRefresh}
                      aria-label={`Mark ${action.title} as reviewed`}
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
              {actionsLoading || actionsError ? "View actions" : `View all ${activeCount} actions`}{" "}
              &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
