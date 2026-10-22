"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parseSetupChecks } from "@/lib/setup-checks";

type Checks = ReturnType<typeof parseSetupChecks>;
const unavailable =
  "Unavailable — check owner access and storage, then reload. No healthy or empty result has been assumed.";

export default function SetupPage() {
  const [checks, setChecks] = useState<Checks | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [checkedAt, setCheckedAt] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]);
    setChecks(null);
    setCheckedAt("");
    async function read(url: string) {
      const response = await fetch(url, { cache: "no-store", signal });
      if (!response.ok) throw new Error("Setup source unavailable");
      return response.json() as Promise<unknown>;
    }
    void Promise.allSettled([
      read("/api/site-settings"),
      read("/api/tracking-health"),
      read("/api/alerts"),
      read("/api/crawler-identity"),
    ]).then((results) => {
      if (!controller.signal.aborted) {
        setChecks(parseSetupChecks(results));
        setCheckedAt(new Date().toISOString());
      }
    });
    return () => controller.abort();
  }, [attempt]);

  const site = checks?.site.data;
  const health = checks?.health.data;
  const alerts = checks?.alerts.data;
  const identity = checks?.identity.data;
  const refresh = identity?.automaticRefresh;
  const hasErrors = checks && Object.values(checks).some((check) => check.error);

  return (
    <div className="mx-auto w-full max-w-7xl p-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#E0DDD8] pb-5">
        <div>
          <h1 className="text-3xl font-bold">Deployment setup</h1>
          <p className="mt-2 text-sm text-[#6B6560]">
            Review each part of the single-owner installation. These checks are read-only.
          </p>
        </div>
        <button
          type="button"
          disabled={!checks}
          onClick={() => setAttempt((value) => value + 1)}
          className="border border-black px-4 py-2 text-sm disabled:opacity-50"
        >
          Reload setup checks
        </button>
      </header>
      <p className="mb-6 text-sm text-[#6B6560]">
        Saved settings, service connectivity and historical evidence are separate signals. This page
        does not install a collector, change policies, enable jobs, or send webhooks.
      </p>
      {!checks && <p role="status">Loading setup checks…</p>}
      {hasErrors && (
        <p role="alert" className="mb-5 border border-amber-300 bg-amber-50 p-4 text-sm">
          Some checks could not be confirmed. Available results remain visible; reload after
          checking access and services.
        </p>
      )}
      {checks && (
        <>
          <p className="mb-5 text-xs text-[#6B6560]">
            Dashboard checks finished: {checkedAt} (UTC). Sources are read separately.
          </p>
          <ol className="grid gap-5 lg:grid-cols-2">
            <li className="min-w-0 border border-[#E0DDD8] p-5">
              <h2 className="mb-3 text-lg font-semibold">1. Site details</h2>
              <p className="mb-2 text-sm font-medium">
                {checks.site.error ? "Unavailable" : site ? "Saved" : "Needs site details"}
              </p>
              <p className="break-words text-sm">
                {checks.site.error
                  ? unavailable
                  : site
                    ? `${site.name} · ${site.url}`
                    : "Save the name and origin of the one website tracked by this dedicated database."}
              </p>
              <p className="mt-2 text-sm text-[#6B6560]">
                Saving a URL does not prove ownership or assign existing traffic to it.
              </p>
              <Link href="/dashboard/settings" className="mt-4 inline-block text-sm underline">
                Edit site details
              </Link>
            </li>
            <li className="min-w-0 border border-[#E0DDD8] p-5">
              <h2 className="mb-3 text-lg font-semibold">2. Storage connection</h2>
              <p className="mb-2 text-sm font-medium">
                {health ? "Reachable at last check" : "Unavailable"}
              </p>
              <p className="break-words text-sm">
                {health
                  ? `Redis responded at ${health.checkedAt} (UTC). This does not confirm collector installation.`
                  : unavailable}
              </p>
              <Link href="/dashboard/health" className="mt-4 inline-block text-sm underline">
                Inspect storage and self-check
              </Link>
            </li>
            <li className="min-w-0 border border-[#E0DDD8] p-5">
              <h2 className="mb-3 text-lg font-semibold">3. Collector evidence</h2>
              <p className="mb-2 text-sm font-medium">
                {!health
                  ? "Unavailable"
                  : health.status === "degraded"
                    ? "Failure recorded"
                    : health.status === "waiting"
                      ? "No evidence yet"
                      : "Historical traffic recorded"}
              </p>
              <p className="break-words text-sm">
                {!health
                  ? unavailable
                  : health.status === "degraded"
                    ? `Failure at ${health.lastFailureAt} (UTC), stage: ${health.lastFailureKind}. Check the collector and storage.`
                    : health.lastRecordedAt
                      ? `Last recorded request: ${health.lastRecordedAt} (UTC). Historical evidence is not continuous uptime monitoring.`
                      : "Traffic may be quiet or collection may need installation. Zero activity does not distinguish those cases."}
              </p>
              <p className="mt-2 text-sm text-[#6B6560]">
                Verify the collector on the intended website. Stored evidence has no site-origin
                attribution.
              </p>
              <Link href="/dashboard/health" className="mt-4 inline-block text-sm underline">
                Review collector evidence
              </Link>
            </li>
            <li className="min-w-0 border border-[#E0DDD8] p-5">
              <h2 className="mb-3 text-lg font-semibold">4. Identity observations · optional</h2>
              <p className="mb-2 text-sm font-medium">
                {!identity
                  ? "Unavailable"
                  : identity.mode === "disabled"
                    ? "Off on this deployment"
                    : identity.mode === "misconfigured"
                      ? "Hosting setup needs attention"
                      : "Direct-Vercel mode configured"}
              </p>
              <p className="text-sm">
                {identity
                  ? `${identity.rows.filter((row) => row.source && row.fresh).length} official feeds were fresh at the source check. Range observations do not change Allow/Block rules.`
                  : unavailable}
              </p>
              <p className="mt-2 text-sm text-[#6B6560]">
                For a separate tracked website, verify its own environment too. Dashboard
                configuration does not prove collection is enabled there.
              </p>
              <Link href="/dashboard/identity" className="mt-4 inline-block text-sm underline">
                Review identity setup
              </Link>
            </li>
            <li className="min-w-0 border border-[#E0DDD8] p-5">
              <h2 className="mb-3 text-lg font-semibold">5. Automatic feed refresh · optional</h2>
              <p className="mb-2 text-sm font-medium">
                {!refresh
                  ? "Unavailable"
                  : !refresh.configured
                    ? "Off"
                    : !refresh.ready
                      ? "Configuration incomplete"
                      : "Configured"}
              </p>
              <p className="break-words text-sm">
                {!refresh
                  ? unavailable
                  : refresh.lastRun
                    ? `Last confirmed result: ${refresh.lastRun.status} at ${refresh.lastRun.finishedAt} (UTC).`
                    : "No completed refresh recorded. A schedule entry alone does not prove a run happened."}
              </p>
              <Link href="/dashboard/identity" className="mt-4 inline-block text-sm underline">
                Inspect feed refresh results
              </Link>
            </li>
            <li className="min-w-0 border border-[#E0DDD8] p-5">
              <h2 className="mb-3 text-lg font-semibold">6. Webhook delivery · optional</h2>
              <p className="mb-2 text-sm font-medium">
                {!alerts
                  ? "Unavailable"
                  : !alerts.enabled
                    ? "Off"
                    : !alerts.ready
                      ? "Configuration incomplete"
                      : "Endpoint and secret configured"}
              </p>
              <p className="break-words text-sm">
                {!alerts
                  ? unavailable
                  : alerts.lastRun
                    ? `Last completed check: ${alerts.lastRun.at} (UTC); receiver accepted ${alerts.lastRun.delivered}, failed ${alerts.lastRun.failed}.`
                    : "No completed alert check recorded. Configuration does not prove delivery or scheduled execution."}
              </p>
              <Link href="/dashboard/alerts" className="mt-4 inline-block text-sm underline">
                Review webhook delivery
              </Link>
            </li>
          </ol>
        </>
      )}
      <p className="mt-6 text-sm text-[#6B6560]">
        Optional features may stay off. Before release, complete the repository release checklist,
        including real owner access and controlled tracked-site verification. Independent outage
        monitoring must run outside this application and its Redis database.
      </p>
    </div>
  );
}
