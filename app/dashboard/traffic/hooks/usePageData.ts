"use client";

import { useEffect, useState } from "react";

interface PageHistory {
  pageTotals: Record<string, number>;
  blockedPageTotals: Record<string, number>;
  startedAt: string | null;
}

export function usePageData() {
  const [data, setData] = useState<PageHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    let active = true;
    setLoading(true);
    setError(false);
    setData(null);
    void (async () => {
      try {
        const response = await fetch("/api/top-pages", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Page request failed");
        const json = await response.json();
        // Counts are already filtered to the server's allowlist; validate shape here.
        for (const counts of [json.pageTotals, json.blockedPageTotals]) {
          if (
            !counts ||
            typeof counts !== "object" ||
            Array.isArray(counts) ||
            Object.values(counts).some(
              (count) => !Number.isSafeInteger(count) || (count as number) < 0,
            )
          )
            throw new Error("Invalid page data");
        }
        if (json.startedAt !== null && typeof json.startedAt !== "string")
          throw new Error("Invalid collection date");
        if (active) setData(json);
      } catch {
        if (active) setError(true);
      } finally {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);
  return { data, loading, error, retry: () => setAttempt((value) => value + 1) };
}
