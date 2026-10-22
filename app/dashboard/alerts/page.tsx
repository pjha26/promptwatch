"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { parseAlertStatus, type AlertStatus } from "@/lib/alert-status";

export default function AlertsPage() {
  const [data, setData] = useState<AlertStatus | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch("/api/alerts", {
      cache: "no-store",
      signal: signal ?? AbortSignal.timeout(15_000),
    });
    if (!response.ok)
      throw new Error("Delivery history could not be loaded. Check owner access and storage.");
    const result = parseAlertStatus(await response.json());
    if (!signal?.aborted) setData(result);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let active = true;
    void load(controller.signal)
      .catch(() => {
        if (active)
          setError("Delivery history could not be loaded. Check owner access and storage.");
      })
      .finally(() => {
        clearTimeout(timeout);
        if (active) setBusy(false);
      });
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [load]);

  async function check(run: boolean) {
    setBusy(true);
    setData(null);
    setError("");
    setMessage("");
    try {
      let result = "";
      if (run) {
        const response = await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
          signal: AbortSignal.timeout(65_000),
        });
        const body = await response.json();
        if (body.status === "partial" && response.status === 503)
          result =
            "Some deliveries failed or the queue reached its limit. Review the recorded results below.";
        else if (response.ok && body.status === "completed")
          result = "Alert check completed. Confirmed results are shown below.";
        else if (response.status === 202 && body.status === "busy")
          result = "Another alert check is running. Reload history after it finishes.";
        else if (response.ok && body.status === "disabled")
          result = "Webhook delivery is disabled.";
        else throw new Error("Alert check could not be confirmed. Reload history before retrying.");
      }
      await load();
      setMessage(result);
    } catch (cause) {
      setData(null);
      setError(
        cause instanceof Error ? cause.message : "Delivery status is unavailable. Reload history.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dashboard-page">
      <Link href="/dashboard/settings" className="text-sm underline">
        Back to Settings
      </Link>
      <h1 className="dashboard-title mb-3 mt-5">Webhook alerts</h1>
      <p className="mb-5 text-sm text-[#6B6560]">
        Optional alerts for active traffic spikes, recorded collector failures and incomplete feed
        refreshes. Configure the HTTPS endpoint and signing secret on the server. Delivery is
        disabled by default.
      </p>
      <p className="mb-5 text-sm text-[#6B6560]">
        The configured daily job checks recorded evidence; it is not real-time uptime monitoring. At
        most four sends per run, three attempts per event, and a 24-hour cooldown per signal group.
        Pending events expire after seven days. Receivers must deduplicate event IDs because
        uncertain responses can be retried.
      </p>
      <div className="mb-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void check(false)}
          className="border border-black px-4 py-2 text-sm disabled:opacity-50"
        >
          Reload history
        </button>
        <button
          type="button"
          disabled={busy || !data?.ready}
          onClick={() => void check(true)}
          className="bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Check and deliver alerts
        </button>
      </div>
      {busy && <p role="status">Loading or checking alerts…</p>}
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mb-4 text-sm">
          {message}
        </p>
      )}
      {data && (
        <>
          <p className="mb-4 border border-[#E0DDD8] p-4 text-sm">
            {!data.enabled
              ? "Delivery disabled. No scheduled webhook requests will be sent."
              : !data.ready
                ? "Delivery enabled but setup incomplete. Configure a valid HTTPS URL and signing secret before running."
                : "Webhook configured. This does not confirm that the receiver or daily schedule is working."}
          </p>
          <p className="mb-5 text-sm">
            {data.lastRun
              ? `Last confirmed check: ${data.lastRun.at} (UTC). Attempted ${data.lastRun.attempted}; receiver accepted ${data.lastRun.delivered}; failed ${data.lastRun.failed}; queue overflow ${data.lastRun.dropped}.`
              : "No completed alert check recorded."}
          </p>
          <h2 className="mb-3 text-lg font-semibold">Recent retained deliveries</h2>
          {!data.deliveries.length && (
            <p className="text-sm">
              No retained delivery records. This alone does not prove collection is healthy.
            </p>
          )}
          <ul className="space-y-3">
            {data.deliveries.map((entry) => (
              <li key={entry.id} className="break-words border border-[#E0DDD8] p-4 text-sm">
                <p className="font-semibold">{entry.title}</p>
                <p>
                  Status: {entry.status}; attempts: {entry.attempts}/3.
                </p>
                {entry.nextAttemptAt && (
                  <p>
                    Retry eligible after: {entry.nextAttemptAt} (UTC), on the next scheduled or
                    manual check.
                  </p>
                )}
                {entry.deliveredAt && <p>Receiver accepted at: {entry.deliveredAt} (UTC).</p>}
                {entry.status === "exhausted" && (
                  <p>No further automatic attempts for this event.</p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
