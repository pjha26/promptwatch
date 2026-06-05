type TabState = "active" | "dismissed";

interface ActionTabsProps {
  activeTab: TabState;
  setActiveTab: (tab: TabState) => void;
  activeCount: number;
  dismissedCount: number;
}

export function ActionTabs({ activeTab, setActiveTab, activeCount, dismissedCount }: ActionTabsProps) {
  return (
    <div className="flex border-b border-gray-200 mb-6" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "active"}
        onClick={() => setActiveTab("active")}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "active"
            ? "border-gray-900 text-gray-900"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Active ({activeCount})
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "dismissed"}
        onClick={() => setActiveTab("dismissed")}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "dismissed"
            ? "border-gray-900 text-gray-900"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Dismissed ({dismissedCount})
      </button>
    </div>
  );
}
