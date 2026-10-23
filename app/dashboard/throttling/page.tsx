"use client";

import { useEffect, useState } from "react";
import { parseThrottleRule, THROTTLE_BOTS, type ThrottleMode } from "@/lib/throttle-rules";
import { parseThrottleSnapshot, type ThrottleSnapshot } from "@/lib/throttle-report";

function draftFor(snapshot: ThrottleSnapshot, botId: string) {
  const rule = snapshot.rows.find((row) => row.botId === botId)?.rule;
  return {
    botId,
    mode: rule?.mode ?? ("off" as ThrottleMode),
    limit: rule?.limit ? String(rule.limit) : "",
  };
}
async function read(signal?: AbortSignal) {
  const response = await fetch("/api/throttling", {
    cache: "no-store",
    signal: signal ?? AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw new Error("Throttle data unavailable. Check owner access and storage, then reload.");
  return parseThrottleSnapshot(await response.json());
}

export default function ThrottlingPage() {
  const [data, setData] = useState<ThrottleSnapshot | null>(null);
  const [draft, setDraft] = useState({
    botId: THROTTLE_BOTS[0].id,
    mode: "off" as ThrottleMode,
    limit: "",
  });
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setData(null);
    setError("");
    setMessage("");
    void read(AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]))
      .then((snapshot) => {
        if (!controller.signal.aborted) {
          setData(snapshot);
          setDraft((current) => draftFor(snapshot, current.botId));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Throttle data unavailable. Check owner access and storage, then reload.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [attempt]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/throttling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, limit: draft.mode === "off" ? 0 : Number(draft.limit) }),
        signal: AbortSignal.timeout(15_000),
      });
      const confirmation = await response.json();
      if (response.status === 400) {
        setError("Choose a valid mode and whole-number limit from 1 to 100000.");
        return;
      }
      if (
        !response.ok ||
        confirmation.botId !== draft.botId ||
        typeof confirmation.changed !== "boolean"
      )
        throw new Error("Save could not be confirmed. Reload before retrying.");
      const rule = parseThrottleRule(confirmation.rule);
      const snapshot = await read();
      if (snapshot.rows.find((row) => row.botId === draft.botId)?.rule?.revision !== rule?.revision)
        throw new Error("Rule changed during confirmation. Reload before making more changes.");
      setData(snapshot);
      setDraft(draftFor(snapshot, draft.botId));
      setMessage(
        confirmation.changed
          ? "Rule saved with history and reloaded from storage. Enforcement applies only where collector integration is enabled."
          : "Rule already matched. No history entry was added.",
      );
    } catch (cause) {
      setData(null);
      setError(
        cause instanceof Error ? cause.message : "Save unconfirmed. Reload before retrying.",
      );
    } finally {
      setBusy(false);
    }
  }
  const selected = data?.rows.find((row) => row.botId === draft.botId);
  return (
    <div className="dashboard-page">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#E0DDD8] pb-5">
        <div>
          <h1 className="dashboard-title">Crawler throttling</h1>
          <p className="mt-2 text-sm text-[#6B6560]">
            Start with minute-level observations before choosing production limits.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => setAttempt((value) => value + 1)}
          className="border border-black px-4 py-2 text-sm disabled:opacity-50"
        >
          Reload throttle data
        </button>
      </header>
      <p className="mb-5 text-sm text-[#6B6560]">
        Rules are shared across all matching requests from a crawler to this one tracked site.
        User-Agent headers are spoofable. Confirmed Block rules take precedence; blocked requests do
        not consume quota. Samples exclude blocked requests and may have gaps.
      </p>
      {busy && (
        <p role="status" className="mb-4">
          Loading or saving throttle data…
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 border border-red-300 p-4 text-sm">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mb-4 text-sm text-green-800">
          {message}
        </p>
      )}
      {data && (
        <p className="mb-5 border border-[#E0DDD8] p-4 text-sm">
          Collector integration on this deployment:{" "}
          <strong>{data.collectorEnabled ? "enabled" : "off"}</strong>. A separate tracked site
          needs its own server flag and updated collector package. Saved rules alone do not prove
          installation or activation.
        </p>
      )}
      <form
        onSubmit={save}
        className="mb-8 grid gap-4 border border-[#E0DDD8] p-5 sm:grid-cols-3"
        aria-busy={busy}
      >
        <label className="text-sm">
          Crawler
          <select
            aria-label="Crawler"
            disabled={busy || !data}
            value={draft.botId}
            onChange={(event) => {
              if (data) setDraft(draftFor(data, event.target.value));
              setMessage("");
            }}
            className="mt-2 block w-full border border-black bg-white px-3 py-2"
          >
            {THROTTLE_BOTS.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Mode
          <select
            aria-label="Mode"
            disabled={busy || !data}
            value={draft.mode}
            onChange={(event) => {
              setDraft({ ...draft, mode: event.target.value as ThrottleMode });
              setMessage("");
            }}
            className="mt-2 block w-full border border-black bg-white px-3 py-2"
          >
            <option value="off">Off</option>
            <option value="observe">Observe only</option>
            <option value="enforce">Enforce (HTTP 429)</option>
          </select>
        </label>
        <label className="text-sm">
          Requests per minute
          <input
            aria-label="Requests per minute"
            type="number"
            min={1}
            max={100000}
            step={1}
            required={draft.mode !== "off"}
            disabled={busy || !data || draft.mode === "off"}
            value={draft.limit}
            onChange={(event) => {
              setDraft({ ...draft, limit: event.target.value });
              setMessage("");
            }}
            className="mt-2 block w-full border border-black px-3 py-2"
          />
        </label>
        <p className="text-sm text-[#6B6560] sm:col-span-3">
          Observe only never denies requests. Enforce returns HTTP 429 above the limit until the
          next UTC minute; confirmed Block rules take priority. Redis failures allow traffic and may
          leave reporting gaps. A changed rule starts a fresh quota revision within the current
          fixed UTC minute. Minute boundaries can permit bursts on both sides of a reset; this is
          not a smoothing or security limit.
        </p>
        <button
          disabled={busy || !data}
          className="justify-self-start bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Save crawler rule
        </button>
      </form>
      {data && (
        <>
          <h2 className="mb-3 text-lg font-semibold">Recent observed volume</h2>
          <p className="mb-4 text-sm text-[#6B6560]">
            Last 60 UTC minutes; the current minute is partial. Missing samples do not prove zero
            traffic. Checked at {data.checkedAt}. Would-limit counts below are for {data.date} UTC
            and retain 30 days.
          </p>
          <div
            role="region"
            aria-label="Crawler minute observations"
            tabIndex={0}
            className="mb-6 overflow-x-auto border border-[#E0DDD8]"
          >
            <table className="w-full min-w-[650px] text-left text-sm">
              <caption className="sr-only">
                Observed request volume and hypothetical quota exceedances
              </caption>
              <thead className="bg-[#F5F2EE]">
                <tr>
                  {[
                    "Crawler",
                    "Saved mode",
                    "Limit/min",
                    "Sampled requests",
                    "Peak sampled minute",
                    "Would-limit count",
                  ].map((label) => (
                    <th scope="col" key={label} className="p-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, index) => (
                  <tr key={row.botId} className="border-t border-[#E0DDD8]">
                    <th scope="row" className="p-3">
                      {THROTTLE_BOTS[index].name}
                    </th>
                    <td className="p-3">{row.rule?.mode ?? "off"}</td>
                    <td className="p-3">{row.rule?.limit || "—"}</td>
                    <td className="p-3">
                      {row.samples.length
                        ? row.samples
                            .reduce((sum, sample) => sum + sample.count, 0)
                            .toLocaleString()
                        : "No samples"}
                    </td>
                    <td className="p-3">
                      {row.samples.length
                        ? Math.max(...row.samples.map((sample) => sample.count)).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3">{row.wouldLimitToday.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="mb-6 border border-[#E0DDD8] p-4">
            <summary className="cursor-pointer text-sm font-medium">
              Retained minute samples for{" "}
              {THROTTLE_BOTS.find((bot) => bot.id === draft.botId)?.name}
            </summary>
            {selected?.samples.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {selected.samples.map((sample) => (
                  <li key={sample.minute}>
                    {new Date(sample.minute * 60_000).toISOString()}:{" "}
                    {sample.count.toLocaleString()} requests
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm">No retained samples for this crawler.</p>
            )}
          </details>
          <h2 className="mb-3 text-lg font-semibold">Rule change history</h2>
          <p className="mb-4 text-sm text-[#6B6560]">
            Latest 200 actual owner changes. No-op saves add no history. This is bounded operational
            history, not an immutable archive.
          </p>
          {!data.history.length ? (
            <p className="text-sm">No rule changes recorded.</p>
          ) : (
            <ol className="max-h-96 space-y-3 overflow-y-auto border border-[#E0DDD8] p-4">
              {data.history.map((entry) => (
                <li key={entry.id} className="break-words text-sm">
                  {entry.changedAt} (UTC) ·{" "}
                  {THROTTLE_BOTS.find((bot) => bot.id === entry.botId)?.name}:{" "}
                  {entry.previous?.mode ?? "off"} ({entry.previous?.limit ?? 0}/min) →{" "}
                  {entry.rule.mode} ({entry.rule.limit}/min)
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
