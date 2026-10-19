import type { Severity } from "@/lib/types";
import { CRAWLER_ACTION_LABELS, type CrawlerActionType } from "@/lib/crawler-actions";

interface ActionFiltersProps {
  severityFilter: Severity | "all";
  setSeverityFilter: (val: Severity | "all") => void;
  typeFilter: CrawlerActionType | "all";
  setTypeFilter: (val: CrawlerActionType | "all") => void;
}

export function ActionFilters({
  severityFilter,
  setSeverityFilter,
  typeFilter,
  setTypeFilter,
}: ActionFiltersProps) {
  return (
    <div className="mt-4 flex shrink-0 flex-wrap items-center gap-4 text-sm sm:ml-auto sm:mt-0">
      <div className="flex items-center gap-2">
        <label htmlFor="severity-filter" className="font-medium text-gray-500">
          Severity
        </label>
        <select
          id="severity-filter"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as Severity | "all")}
          className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <option value="all">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="type-filter" className="font-medium text-gray-500">
          Action type
        </label>
        <select
          id="type-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as CrawlerActionType | "all")}
          className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <option value="all">All</option>
          {(Object.keys(CRAWLER_ACTION_LABELS) as CrawlerActionType[]).map((kind) => (
            <option key={kind} value={kind}>
              {CRAWLER_ACTION_LABELS[kind]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
