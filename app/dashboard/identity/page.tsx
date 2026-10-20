"use client";

import { useEffect, useState } from "react";

import {
  IDENTITY_STATUSES,
  parseIdentityReport,
  type IdentityReport,
} from "@/lib/crawler-identity";

export default function IdentityPage() {
  const [data, setData] = useState<IdentityReport | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    void (async () => {
      try {
        const response = await fetch("/api/crawler-identity", {
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
        });
        if (!response.ok)
          throw new Error(
            "Identity observations are unavailable. Check owner access and storage, then reload.",
          );
        const parsed = parseIdentityReport(await response.json());
        if (!controller.signal.aborted) setData(parsed);
      } catch {
        if (!controller.signal.aborted)
          setError("Identity observations could not be loaded. Reload to retry.");
      }
    })();
    return () => controller.abort();
  }, [attempt]);
  async function refresh(botId: string) {
    setSaving(botId);
    setError("");
    try {
      const response = await fetch("/api/crawler-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId }),
        signal: AbortSignal.timeout(15_000),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true || result.botId !== botId)
        throw new Error("Refresh not confirmed");
      setAttempt((value) => value + 1);
    } catch {
      setData(null);
      setError("Feed refresh could not be confirmed. Reload observations before retrying.");
    } finally {
      setSaving(null);
    }
  }
  return (
    <main className="mx-auto w-full max-w-7xl p-6 text-gray-900 md:p-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Crawler identity observations</h1>
        <button
          type="button"
          disabled={!!saving}
          onClick={() => setAttempt((value) => value + 1)}
          className="rounded border border-gray-900 px-3 py-2 text-sm"
        >
          Reload observations
        </button>
      </header>
      <p className="mb-4 text-sm">
        Optional IP-range checks for sites receiving requests directly through Vercel. A range match
        supports the claimed crawler identity; it does not prove page delivery or an AI citation.
        These observations never change Allow/Block rules.
      </p>
      {error && (
        <p role="alert" className="my-4 border border-red-300 p-4 text-sm">
          {error}
        </p>
      )}
      {!data && !error && <p role="status">Loading identity observations…</p>}
      {data && (
        <>
          <p className="my-4 rounded border border-gray-300 p-4 text-sm">
            Mode: <strong>{data.mode}</strong>.{" "}
            {data.mode === "disabled"
              ? "Set PROMPTWATCH_IP_VERIFICATION=vercel on the tracked site's server to opt in."
              : data.mode === "misconfigured"
                ? "The setting is enabled but this runtime is not Vercel. Requests cannot be verified here."
                : "Using Vercel's client-IP header. No raw IP addresses are stored."}{" "}
            Counts cover {data.start} — {data.end} UTC; today is partial. They include allowed and
            blocked requests, start only after opt-in, and may have collection gaps.
          </p>
          <p className="mb-5 text-sm text-gray-600">
            Vendor feeds expire after 24 hours. Refresh each supported feed at least daily; absent,
            stale or failed checks are unavailable. “Unverified” means no match in a fresh feed, not
            proof of impersonation. Other crawlers are unsupported by this version.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {data.rows.map((row) => (
              <section
                key={row.botId}
                className="min-w-0 rounded border border-gray-300 bg-white p-4"
              >
                <h2 className="font-semibold">{row.name}</h2>
                <dl className="my-3 grid grid-cols-2 gap-2 text-sm">
                  {IDENTITY_STATUSES.map((status) => (
                    <div key={status}>
                      <dt>{status === "verified" ? "Vendor range match" : status}</dt>
                      <dd className="font-mono">{row.counts[status].toLocaleString()}</dd>
                    </div>
                  ))}
                </dl>
                {row.source ? (
                  <>
                    <a href={row.source} className="text-sm underline">
                      Official IP feed
                    </a>
                    <p className="my-2 text-xs text-gray-600">
                      {row.fetchedAt
                        ? `Fetched ${new Date(row.fetchedAt).toLocaleString("en-GB", { timeZone: "UTC" })} UTC — ${row.fresh ? "fresh" : "stale"}`
                        : "No cached feed."}
                    </p>
                    <button
                      type="button"
                      disabled={!!saving}
                      onClick={() => void refresh(row.botId)}
                      className="rounded border border-gray-900 px-3 py-2 text-sm disabled:opacity-50"
                    >
                      {saving === row.botId ? "Refreshing…" : `Refresh ${row.name} ranges`}
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-gray-600">
                    No supported published IP feed configured.
                  </p>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
