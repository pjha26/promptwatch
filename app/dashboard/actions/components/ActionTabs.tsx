type TabState = "active" | "dismissed";

interface ActionTabsProps {
  activeTab: TabState;
  setActiveTab: (tab: TabState) => void;
  activeCount: number;
  dismissedCount: number;
}

export function ActionTabs({
  activeTab,
  setActiveTab,
  activeCount,
  dismissedCount,
}: ActionTabsProps) {
  return (
    <div
      className="mb-6 flex flex-wrap border-b border-gray-200"
      role="group"
      aria-label="Review status"
    >
      <button
        type="button"
        aria-pressed={activeTab === "active"}
        onClick={() => setActiveTab("active")}
        className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === "active"
            ? "border-gray-900 text-gray-900"
            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
        }`}
      >
        Active ({activeCount})
      </button>
      <button
        type="button"
        aria-pressed={activeTab === "dismissed"}
        onClick={() => setActiveTab("dismissed")}
        className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === "dismissed"
            ? "border-gray-900 text-gray-900"
            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
        }`}
      >
        Reviewed / dismissed ({dismissedCount})
      </button>
    </div>
  );
}
