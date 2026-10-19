"use client";

import { useCallback, useEffect, useState } from "react";
import { parseActionResponse, parseDecision } from "@/lib/crawler-actions";
import type { Status } from "@/lib/types";

type Snapshot = ReturnType<typeof parseActionResponse>;

export function useActionState() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]);
    setLoading(true);
    setError("");
    setSnapshot(null);
    void (async () => {
      try {
        const response = await fetch("/api/actions", { cache: "no-store", signal });
        if (!response.ok)
          throw new Error(
            "Could not load recommendations and saved decisions. Check owner access and storage, then retry.",
          );
        const data = parseActionResponse(await response.json());
        if (!controller.signal.aborted) {
          setSnapshot(data);
          setSaveError("");
          setNeedsRefresh(false);
        }
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "Recommendations are unavailable.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [attempt]);

  const updateActionStatus = useCallback(
    async (id: string, status: Status) => {
      if (savingId || needsRefresh) return;
      setSavingId(id);
      setSaveError("");
      try {
        const response = await fetch("/api/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok)
          throw new Error(
            "The review decision could not be confirmed. Refresh actions before making more changes.",
          );
        const json = await response.json();
        const decision = parseDecision(json);
        if (json.id !== id || decision.status !== status || !decision.reviewedAt)
          throw new Error("Unexpected review response. Refresh actions before retrying.");
        setSnapshot((current) =>
          current
            ? {
                ...current,
                actions: current.actions.map((action) =>
                  action.id === id ? { ...action, ...decision } : action,
                ),
              }
            : current,
        );
      } catch (cause) {
        setNeedsRefresh(true);
        setSaveError(
          cause instanceof Error
            ? cause.message
            : "The review decision could not be confirmed. Refresh actions.",
        );
      } finally {
        setSavingId(null);
      }
    },
    [savingId, needsRefresh],
  );

  return {
    actions: snapshot?.actions ?? [],
    window: snapshot?.window ?? null,
    observedRequests: snapshot?.observedRequests ?? 0,
    generatedAt: snapshot?.generatedAt ?? null,
    loading,
    error,
    saveError,
    savingId,
    needsRefresh,
    retry: () => setAttempt((value) => value + 1),
    updateActionStatus,
  };
}
