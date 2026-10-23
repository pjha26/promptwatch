"use client";

import { useCallback, useEffect, useState } from "react";
import { parseHealthResponse, type TrackingHealth } from "@/lib/collector-health";

const buttonClass = "border border-gray-900 px-4 py-2 text-sm font-medium disabled:opacity-50";
const dateLabel = (value: string | null) =>
  value ? new Date(value).toLocaleString("en-GB", { timeZone: "UTC" }) + " UTC" : "None recorded";

export function TrackingHealthPanel() {
  const [health, setHealth] = useState<TrackingHealth | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async (selfCheck = false, signal?: AbortSignal) => {
    setBusy(true);
    setError("");
    setHealth(null);
    const timeout = AbortSignal.timeout(10_000);
    try {
      const response = await fetch("/api/tracking-health", {
        method: selfCheck ? "POST" : "GET",
        cache: "no-store",
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
        ...(selfCheck ? { headers: { "Content-Type": "application/json" }, body: "{}" } : {}),
      });
      if (!response.ok)
        throw new Error(
          response.status === 401 || response.status === 403
            ? "Owner sign-in is required. Sign in again and retry."
            : "Storage status could not be confirmed. Check the service connection and refresh.",
        );
      const data = parseHealthResponse(await response.json());
      if (!signal?.aborted) setHealth(data);
    } catch (cause) {
      if (!signal?.aborted)
        setError(cause instanceof Error ? cause.message : "Storage status is unavailable.");
    } finally {
      if (!signal?.aborted) setBusy(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(false, controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <div className="dashboard-page">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="dashboard-title">Tracking health</h1>
          <p className="mt-2 text-sm text-gray-600">
            Storage connectivity and evidence from the collector.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className={buttonClass} disabled={busy} onClick={() => void load()}>
            Refresh status
          </button>
          <button className={buttonClass} disabled={busy} onClick={() => void load(true)}>
            Run storage self-check
          </button>
        </div>
      </header>
      <p className="mb-6 text-sm text-gray-600">
        Zero crawler traffic does not prove a collection failure. A storage self-check tests the
        counter script and read/write access using temporary keys; it does not send a public crawler
        request or change traffic totals.
      </p>
      {busy && (
        <p role="status" className="border border-gray-200 p-6">
          Checking storage…
        </p>
      )}
      {error && (
        <p role="alert" className="border border-red-500 p-6 text-sm">
          {error}
        </p>
      )}
      {health && (
        <>
          <div
            className={`mb-6 border p-5 ${health.status === "degraded" ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
          >
            <h2 className="font-semibold">
              {health.status === "degraded"
                ? "Collector failure recorded"
                : health.status === "recorded"
                  ? "Collector has recorded traffic"
                  : "No collector evidence yet"}
            </h2>
            <p className="mt-2 text-sm">
              {health.status === "degraded"
                ? "A collector failure is as recent as, or newer than, the last confirmed write. Investigate it; a successful storage self-check does not clear this state."
                : health.status === "recorded"
                  ? "The last successful collector write is shown below. It is historical evidence, not continuous uptime monitoring."
                  : "No requests have been recorded by the health-aware collector yet. Traffic may be quiet, or the collector may need installation or configuration."}
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Storage connectivity", "Redis reachable"],
              ["Checked at", dateLabel(health.checkedAt)],
              ["First collector evidence", dateLabel(health.firstRecordedAt)],
              ["Last recorded request", dateLabel(health.lastRecordedAt)],
              ["Last collector failure", dateLabel(health.lastFailureAt)],
              ["Last storage self-check", dateLabel(health.lastSelfCheckAt)],
            ].map(([label, value]) => (
              <div key={label} className="border border-gray-200 p-5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {label}
                </dt>
                <dd className="mt-3 break-words text-sm">{value}</dd>
              </div>
            ))}
          </dl>
          {health.lastFailureKind && (
            <p className="mt-5 text-sm text-gray-600">
              Last failure stage:{" "}
              {health.lastFailureKind === "policy-read"
                ? "reading the crawler policy"
                : health.lastFailureKind === "throttle-check"
                  ? "checking the optional crawler quota"
                  : "recording counters"}
              . Outages can prevent failure markers from being saved, so this is not a complete
              outage history.
            </p>
          )}
        </>
      )}
    </div>
  );
}
