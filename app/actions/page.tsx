"use client";

import { useState } from "react";
import { ActionType, Severity } from "@/lib/types";
import { useActionState } from "./hooks/useActionState";
import { PlanBanner } from "./components/PlanBanner";
import { ActionFilters } from "./components/ActionFilters";
import { ActionTabs } from "./components/ActionTabs";
import { ActionCard } from "./components/ActionCard";

type TabState = "active" | "dismissed";

export default function ActionsPage() {
  const { actions, loading, hydrated, storageError, updateActionStatus } = useActionState();
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ActionType | "all">("all");
  const [activeTab, setActiveTab] = useState<TabState>("active");

  // Filter actions based on dropdowns (both tabs)
  const filteredActions = actions.filter((action) => {
    if (severityFilter !== "all" && action.severity !== severityFilter) return false;
    if (typeFilter !== "all" && action.type !== typeFilter) return false;
    return true;
  });

  const activeFiltered = filteredActions.filter((a) => a.status === "active");
  const dismissedFiltered = filteredActions.filter((a) => a.status === "accepted" || a.status === "dismissed");

  const visibleActions = activeTab === "active" ? activeFiltered : dismissedFiltered;
  const isFiltered = severityFilter !== "all" || typeFilter !== "all";

  const clearFilters = () => {
    setSeverityFilter("all");
    setTypeFilter("all");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PlanBanner />
      
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Actions</h1>
            <p className="mt-2 text-gray-500">
              Prioritized recommendations to improve AI visibility, performance, and coverage.
            </p>
          </div>
          <ActionFilters 
            severityFilter={severityFilter} setSeverityFilter={setSeverityFilter}
            typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          />
        </div>

        {storageError && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm font-medium">
            Couldn't save your changes — they won't persist if you reload.
          </div>
        )}

        {/* AI Suggestions Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">AI Suggestions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Promptwatch detected {activeFiltered.length} new {activeFiltered.length === 1 ? 'action' : 'actions'} from your recent monitoring data.
          </p>
        </div>

        <ActionTabs 
          activeTab={activeTab} setActiveTab={setActiveTab} 
          activeCount={activeFiltered.length} dismissedCount={dismissedFiltered.length} 
        />

        {/* Gated Render: Wait for Hydration */}
        {!hydrated || loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl min-h-[220px] animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            {/* Empty States */}
            {visibleActions.length === 0 ? (
              <div className="w-full bg-white border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-12 text-center min-h-[220px]">
                {activeTab === "active" ? (
                  <p className="text-gray-500 font-medium">All caught up — no active actions</p>
                ) : (
                  <p className="text-gray-500 font-medium">Nothing here yet.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleActions.map(action => (
                  <ActionCard 
                    key={action.id} 
                    action={action} 
                    onUpdateStatus={updateActionStatus} 
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
