import { Severity, ActionType } from "@/lib/types";

interface ActionFiltersProps {
  severityFilter: Severity | "all";
  setSeverityFilter: (val: Severity | "all") => void;
  typeFilter: ActionType | "all";
  setTypeFilter: (val: ActionType | "all") => void;
}

export function ActionFilters({
  severityFilter,
  setSeverityFilter,
  typeFilter,
  setTypeFilter,
}: ActionFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm mt-4 sm:mt-0 sm:ml-auto shrink-0">
      <div className="flex items-center gap-2">
        <label htmlFor="severity-filter" className="text-gray-500 font-medium">Severity</label>
        <select
          id="severity-filter"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as Severity | "all")}
          className="bg-white border border-gray-200 rounded-md px-2 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <option value="all">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="type-filter" className="text-gray-500 font-medium">Action type</label>
        <select
          id="type-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ActionType | "all")}
          className="bg-white border border-gray-200 rounded-md px-2 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <option value="all">All</option>
          <option value="reddit">Reddit</option>
          <option value="outreach">Outreach</option>
          <option value="content">Content</option>
        </select>
      </div>
    </div>
  );
}
