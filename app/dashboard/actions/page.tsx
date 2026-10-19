"use client";

import Link from "next/link";
import { useState } from "react";
import type { Severity } from "@/lib/types";
import type { CrawlerActionType } from "@/lib/crawler-actions";
import { useActionState } from "./hooks/useActionState";
import { PlanBanner } from "./components/PlanBanner";
import { ActionFilters } from "./components/ActionFilters";
import { ActionTabs } from "./components/ActionTabs";
import { ActionCard } from "./components/ActionCard";

export default function ActionsPage() {
  const {
    actions,
    loading,
    error,
    saveError,
    savingId,
    needsRefresh,
    window,
    observedRequests,
    retry,
    updateActionStatus,
  } = useActionState();
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [typeFilter, setTypeFilter] = useState<CrawlerActionType | "all">("all");
  const [activeTab, setActiveTab] = useState<"active" | "dismissed">("active");
  const filtered = actions.filter(
    (action) =>
      (severityFilter === "all" || action.severity === severityFilter) &&
      (typeFilter === "all" || action.type === typeFilter),
  );
  const active = filtered.filter((action) => action.status === "active");
  const closed = filtered.filter((action) => action.status !== "active");
  const visible = activeTab === "active" ? active : closed;
  const isFiltered = severityFilter !== "all" || typeFilter !== "all";
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <PlanBanner />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Actions</h1>
            <p className="mt-2 text-sm text-gray-600">
              Rule-based recommendations backed by recorded crawler counters.
            </p>
          </div>
          <button
            type="button"
            disabled={loading || !!savingId}
            onClick={retry}
            className="rounded border border-gray-900 px-4 py-2 text-sm disabled:opacity-50"
          >
            Refresh actions
          </button>
        </header>
        <p className="mb-6 text-sm text-gray-600">
          {window
            ? `Analysis window: ${window.start} — ${window.end} UTC. ${observedRequests.toLocaleString()} observed requests (allowed plus blocked).`
            : "Seven completed UTC days are required to assess these rules."}{" "}
          Today is excluded. Missing or expired counters can leave gaps; these recommendations do
          not prove crawler identity or citations.
        </p>
        <ActionFilters
          severityFilter={severityFilter}
          setSeverityFilter={setSeverityFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
        />
        {error && (
          <div role="alert" className="my-6 rounded border border-red-300 bg-white p-5 text-sm">
            {error}{" "}
            <button type="button" onClick={retry} className="ml-2 underline">
              Retry loading
            </button>
          </div>
        )}
        {saveError && (
          <p role="alert" className="my-6 rounded border border-amber-300 bg-amber-50 p-5 text-sm">
            {saveError} The list shows the last confirmed decisions.
          </p>
        )}
        {!loading && !error && window && observedRequests === 0 && (
          <p className="my-6 text-sm text-gray-600">
            No requests were recorded in the analysis window. This alone does not confirm collection
            is healthy.{" "}
            <Link href="/dashboard/health" className="underline">
              Check tracking health
            </Link>
            .
          </p>
        )}
        <div className="mt-6">
          <ActionTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeCount={active.length}
            dismissedCount={closed.length}
          />
        </div>
        {loading ? (
          <p role="status" className="rounded border border-gray-200 bg-white p-8">
            Loading recorded recommendations and review decisions…
          </p>
        ) : (
          !error &&
          (visible.length ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  disabled={!!savingId || needsRefresh}
                  onUpdateStatus={updateActionStatus}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
              {isFiltered
                ? "No recommendations match these filters."
                : activeTab === "active"
                  ? "No active recommendations meet the current rules."
                  : "No reviewed or dismissed recommendations in the current window."}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
