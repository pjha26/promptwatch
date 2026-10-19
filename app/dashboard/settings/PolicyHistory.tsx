"use client";

import { useEffect, useState } from "react";
import { botSignatures } from "@/lib/botSignatures";
import { parsePolicyHistory, type PolicyChange } from "@/lib/policy-history";

export function PolicyHistory({ version }: { version: number }) {
  const [entries, setEntries] = useState<PolicyChange[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setEntries(null);
    setError("");
    void (async () => {
      try {
        const response = await fetch("/api/bot-policies/history", {
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
        });
        if (!response.ok) throw new Error("Policy history could not be loaded.");
        const data = await response.json();
        const parsed = parsePolicyHistory(data?.entries);
        if (!controller.signal.aborted) setEntries(parsed);
      } catch {
        if (!controller.signal.aborted)
          setError("Policy history could not be loaded. Refresh to retry.");
      }
    })();
    return () => controller.abort();
  }, [version, attempt]);
  return (
    <section
      className="min-w-0 border-t border-[#E0DDD8] py-8"
      aria-labelledby="policy-history-title"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="policy-history-title"
          className="text-xs font-semibold uppercase tracking-widest text-[#E63946]"
        >
          Policy change history
        </h2>
        <button
          type="button"
          onClick={() => setAttempt((value) => value + 1)}
          className="border border-black px-3 py-2 text-xs"
        >
          Refresh history
        </button>
      </div>
      <p className="mb-4 text-sm text-[#6B6560]">
        Latest 200 actual changes made by the deployment owner since this feature was installed.
        Older changes are not backfilled. Selecting the same rule creates no entry.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : entries === null ? (
        <p role="status" className="text-sm">
          Loading policy history…
        </p>
      ) : entries.length === 0 ? (
        <p className="text-sm">No policy changes recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Policy changes, newest recorded first. All times are UTC.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="p-2">
                  Crawler
                </th>
                <th scope="col" className="p-2">
                  Change
                </th>
                <th scope="col" className="p-2">
                  Saved at (UTC)
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-[#E0DDD8]">
                  <th scope="row" className="p-2 font-medium">
                    {botSignatures.find((bot) => bot.id === entry.botId)?.name}
                  </th>
                  <td className="p-2">
                    <span className="whitespace-nowrap">
                      {entry.previous} → {entry.policy}
                    </span>
                  </td>
                  <td className="p-2">
                    <time dateTime={entry.changedAt}>
                      {new Date(entry.changedAt).toLocaleString("en-GB", { timeZone: "UTC" })}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-[#6B6560]">
        This bounded history is not a permanent audit archive. Direct Redis edits are outside this
        history.
      </p>
    </section>
  );
}
