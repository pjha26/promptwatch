"use client";

import { useCallback, useEffect, useState } from "react";
import { botSignatures } from "@/lib/botSignatures";
import { readPolicies, type BotPolicy } from "@/lib/bot-policies";
import { PolicyHistory } from "./PolicyHistory";

export function BotPolicies() {
  const [policies, setPolicies] = useState<BotPolicy[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [historyVersion, setHistoryVersion] = useState(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    setSaved("");
    setPolicies(null);
    try {
      const response = await fetch("/api/bot-policies", { cache: "no-store", signal });
      if (!response.ok)
        throw new Error(
          "Could not read policies. Check your owner access and Redis connection, then retry.",
        );
      const data = await response.json();
      if (
        !Array.isArray(data) ||
        data.length !== botSignatures.length ||
        data.some((bot, index) => bot?.id !== botSignatures[index].id)
      ) {
        throw new Error("Unexpected policy response. Please retry.");
      }
      setPolicies(readPolicies(data.map((bot) => bot.policy)));
      return true;
    } catch (cause) {
      if (!signal?.aborted)
        setError(cause instanceof Error ? cause.message : "Could not load policies.");
      return false;
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function change(botId: string, policy: BotPolicy) {
    setSaving(true);
    setSaved("");
    setError("");
    try {
      const response = await fetch("/api/bot-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, policy }),
      });
      if (!response.ok)
        throw new Error(
          "The policy update could not be confirmed. Reload policies before retrying.",
        );
      const confirmation = await response.json();
      if (
        confirmation?.success !== true ||
        confirmation.botId !== botId ||
        confirmation.policy !== policy ||
        typeof confirmation.changed !== "boolean"
      )
        throw new Error("Unexpected save confirmation. Reload policies before retrying.");
      setHistoryVersion((value) => value + 1);
      if (await load())
        setSaved(
          confirmation.changed
            ? "Policy saved with its change history. The list shows the rules currently stored for enforcement."
            : "Policy already matched. No change history entry was needed.",
        );
    } catch (cause) {
      setPolicies(null);
      setError(
        cause instanceof Error
          ? cause.message
          : "Policy update failed. Reload policies before retrying.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="border-t border-[#E0DDD8] py-8" aria-labelledby="bot-policies-title">
        <h2
          id="bot-policies-title"
          className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#E63946]"
        >
          Bot policies
        </h2>
        <p className="mb-5 text-sm text-[#6B6560]">
          Allow or block known crawler User-Agent matches on public pages. Policy read outages fail
          open to keep the site available.
        </p>
        {loading && (
          <p role="status" className="text-sm">
            Loading enforced policies…
          </p>
        )}
        {error && (
          <div role="alert" className="mb-4 space-y-3 border border-[#E63946] p-4 text-sm">
            <p>{error}</p>
            <button
              type="button"
              className="border border-black px-3 py-2"
              disabled={saving || loading}
              onClick={() => void load()}
            >
              Reload policies
            </button>
          </div>
        )}
        {!error && saved && (
          <p role="status" className="mb-4 text-sm text-green-800">
            {saved}
          </p>
        )}
        {policies && (
          <div aria-busy={saving} className="space-y-3">
            {botSignatures.map((bot, index) => (
              <div
                key={bot.id}
                className="flex items-center justify-between gap-3 border-b border-[#E0DDD8] py-2 last:border-b-0"
              >
                <div>
                  <span className="block text-sm font-medium">{bot.name}</span>
                  <span className="text-xs text-[#6B6560]">{bot.company}</span>
                </div>
                {bot.robotsOnly ? (
                  <p className="max-w-48 text-right text-xs text-[#6B6560]">
                    Content-use control in robots.txt; not an HTTP crawler.
                  </p>
                ) : (
                  <div className="flex border border-[#E0DDD8] bg-[#F5F2EE] p-0.5">
                    {(["allow", "block"] as const).map((policy) => (
                      <button
                        key={policy}
                        type="button"
                        disabled={saving || loading}
                        aria-pressed={policies[index] === policy}
                        aria-label={`${policy} ${bot.name}`}
                        onClick={() => void change(bot.id, policy)}
                        className={`px-4 py-1.5 text-xs font-medium uppercase transition-colors disabled:opacity-50 ${policies[index] === policy ? (policy === "block" ? "bg-[#E63946] text-white" : "bg-[#0A0A0A] text-white") : "text-[#6B6560] hover:text-black"}`}
                      >
                        {policy}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <PolicyHistory version={historyVersion} />
    </>
  );
}
