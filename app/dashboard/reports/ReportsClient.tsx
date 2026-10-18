"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import {
  buildTrafficReport,
  parseTrafficHistory,
  trafficReportCsv,
  type ReportPeriod,
  type TrafficHistory,
} from "@/lib/traffic-report";

const buttonClass =
  "inline-flex items-center justify-center gap-2 border border-[#0A0A0A] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#F5F2EE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0A] disabled:cursor-wait disabled:opacity-50";
const numberFormat = new Intl.NumberFormat("en-US");
const percentageFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export function ReportsClient() {
  const [history, setHistory] = useState<TrafficHistory | null>(null);
  const [period, setPeriod] = useState<ReportPeriod>(7);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authExpired, setAuthExpired] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    setLoading(true);
    setError("");
    setAuthExpired(false);
    setDownloadError("");
    setHistory(null);

    async function load() {
      try {
        const response = await fetch("/api/traffic-report", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401) {
          if (active) setAuthExpired(true);
          throw new Error("Your session has expired. Sign in again to view reports.");
        }
        if (!response.ok) throw new Error("Could not load traffic reports. Please try again.");
        const data = parseTrafficHistory(await response.json());
        if (active) setHistory(data);
      } catch (cause) {
        if (active)
          setError(
            controller.signal.aborted
              ? "The request timed out. Please try again."
              : cause instanceof Error
                ? cause.message
                : "Could not load traffic reports.",
          );
      } finally {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  const report = useMemo(
    () => (history ? buildTrafficReport(history, period) : null),
    [history, period],
  );

  function download(kind: "daily" | "crawlers") {
    if (!report) return;
    setDownloadError("");
    try {
      const blob = new Blob(["\uFEFF", trafficReportCsv(report, kind)], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `promptwatch-${kind}-${report.daily[0].date}-to-${report.daily[report.daily.length - 1].date}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError("Could not create the CSV download. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-6 font-sans text-[#0A0A0A] md:p-8">
      <Link
        href="/dashboard/traffic"
        className="text-sm text-[#6B6560] underline underline-offset-4"
      >
        Back to AI Traffic
      </Link>
      <header className="mb-6 mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-[#E0DDD8] pb-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#E63946]">
            Traffic intelligence
          </p>
          <h1 className="font-condensed text-3xl font-bold uppercase tracking-tight">
            Traffic reports
          </h1>
          <p className="mt-2 text-sm text-[#6B6560]">
            Review crawler activity and export the numbers behind it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="report-period" className="text-sm font-medium">
            Period
          </label>
          <select
            id="report-period"
            value={period}
            onChange={(event) => setPeriod(Number(event.target.value) as ReportPeriod)}
            className="border border-[#0A0A0A] bg-white px-3 py-2 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button
            type="button"
            className={buttonClass}
            disabled={loading}
            onClick={() => setAttempt((value) => value + 1)}
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <p className="mb-6 border-l-2 border-[#E0DDD8] pl-4 text-sm text-[#6B6560]">
        Deployment-wide data. All dates are UTC; today is partial. These counts reflect recorded
        User-Agent matches, not verified crawler identities or AI citations. Missing counters are
        counted as zero; collection outages may leave gaps.
      </p>

      <div aria-busy={loading}>
        {loading && (
          <p role="status" className="border border-[#E0DDD8] p-8 text-sm">
            Loading traffic report…
          </p>
        )}
        {error && (
          <div role="alert" className="space-y-4 border border-[#E63946] p-6">
            <p>{error}</p>
            {authExpired ? (
              <Link className={buttonClass} href="/login">
                Sign in
              </Link>
            ) : (
              <button
                type="button"
                className={buttonClass}
                onClick={() => setAttempt((value) => value + 1)}
              >
                Retry
              </button>
            )}
          </div>
        )}
        {report && !loading && !error && (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-xs text-[#6B6560]">
                {report.daily[0].date} — {report.daily[report.daily.length - 1].date} (UTC)
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={buttonClass} onClick={() => download("daily")}>
                  <Download aria-hidden="true" className="h-4 w-4" /> Daily CSV
                </button>
                <button type="button" className={buttonClass} onClick={() => download("crawlers")}>
                  <Download aria-hidden="true" className="h-4 w-4" /> Crawler CSV
                </button>
              </div>
            </div>
            {downloadError && (
              <p role="alert" className="mb-4 text-sm text-[#E63946]">
                {downloadError}
              </p>
            )}
            <dl className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Observed requests", value: report.total, detail: "Allowed plus blocked" },
                {
                  label: "Allowed by bot policy",
                  value: report.allowed,
                  detail: "Page delivery is not measured",
                },
                {
                  label: "Blocked requests",
                  value: report.blocked,
                  detail: `${percentageFormat.format(report.blockRate)}% of observed requests`,
                },
                {
                  label: "Active crawlers",
                  value: report.activeCrawlers,
                  detail: "Includes blocked-only activity",
                },
              ].map((metric) => (
                <div key={metric.label} className="border border-[#E0DDD8] p-5">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">
                    {metric.label}
                  </dt>
                  <dd className="mt-3 font-mono text-3xl font-bold">
                    {numberFormat.format(metric.value)}
                  </dd>
                  <dd className="mt-2 text-xs text-[#6B6560]">{metric.detail}</dd>
                </div>
              ))}
            </dl>
            <p className="mb-8 text-sm text-[#6B6560]">
              {report.changePercent !== null
                ? `${report.changePercent > 0 ? "+" : ""}${percentageFormat.format(report.changePercent)}% observed requests versus the previous 7 days (${numberFormat.format(report.previousTotal!)} requests).`
                : report.previousTotal === 0
                  ? "The previous 7 days recorded no requests; percentage change is unavailable."
                  : "A comparison needs an earlier complete period; only 30 days of counters are available."}
            </p>
            {report.total === 0 && (
              <div
                role="status"
                className="mb-8 border border-dashed border-[#E0DDD8] bg-[#F5F2EE] p-6"
              >
                <h2 className="font-semibold">No crawler requests recorded in this period</h2>
                <p className="mt-2 text-sm text-[#6B6560]">
                  Try another period or check that collection is configured. Zero counts alone do
                  not confirm that collection is healthy.
                </p>
              </div>
            )}
            <section aria-labelledby="crawler-breakdown" className="mb-8">
              <h2
                id="crawler-breakdown"
                className="mb-4 font-condensed text-xl font-bold uppercase"
              >
                Crawler breakdown
              </h2>
              <div
                role="region"
                aria-labelledby="crawler-breakdown"
                tabIndex={0}
                className="overflow-x-auto border border-[#E0DDD8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <table className="w-full min-w-[560px] text-left text-sm">
                  <caption className="sr-only">
                    Crawler totals for the selected UTC period, ordered by observed requests
                  </caption>
                  <thead className="bg-[#F5F2EE]">
                    <tr>
                      <th scope="col" className="p-4">
                        Crawler
                      </th>
                      <th scope="col" className="p-4 text-right">
                        Allowed
                      </th>
                      <th scope="col" className="p-4 text-right">
                        Blocked
                      </th>
                      <th scope="col" className="p-4 text-right">
                        Observed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.crawlers.map((bot) => (
                      <tr key={bot.id} className="border-t border-[#E0DDD8]">
                        <th scope="row" className="p-4 font-medium">
                          {bot.name}
                        </th>
                        {[bot.allowed, bot.blocked, bot.total].map((value, index) => (
                          <td key={index} className="p-4 text-right font-mono">
                            {numberFormat.format(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section aria-labelledby="daily-breakdown">
              <h2 id="daily-breakdown" className="mb-4 font-condensed text-xl font-bold uppercase">
                Daily breakdown
              </h2>
              <div
                role="region"
                aria-labelledby="daily-breakdown"
                tabIndex={0}
                className="overflow-x-auto border border-[#E0DDD8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <table className="w-full min-w-[560px] text-left text-sm">
                  <caption className="sr-only">
                    Daily totals for the selected UTC period, most recent first
                  </caption>
                  <thead className="bg-[#F5F2EE]">
                    <tr>
                      <th scope="col" className="p-4">
                        Date (UTC)
                      </th>
                      <th scope="col" className="p-4 text-right">
                        Allowed
                      </th>
                      <th scope="col" className="p-4 text-right">
                        Blocked
                      </th>
                      <th scope="col" className="p-4 text-right">
                        Observed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...report.daily].reverse().map((day) => (
                      <tr key={day.date} className="border-t border-[#E0DDD8]">
                        <th scope="row" className="p-4 font-mono font-normal">
                          {day.date}
                        </th>
                        {[day.allowed, day.blocked, day.total].map((value, index) => (
                          <td key={index} className="p-4 text-right font-mono">
                            {numberFormat.format(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
