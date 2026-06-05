import { useMemo } from "react";

interface TopPagesProps {
  pageTotals: Record<string, number>;
}

export function TopPages({ pageTotals }: TopPagesProps) {
  const topPages = useMemo(() => {
    return Object.entries(pageTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [pageTotals]);

  const maxCount = topPages.length > 0 ? topPages[0][1] : 1;

  if (topPages.length === 0) {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 flex flex-col min-w-0">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Pages</h2>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          No pages to show.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 flex flex-col min-w-0">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Pages</h2>
      <div className="flex flex-col gap-3">
        {topPages.map(([path, count]) => {
          const percentage = (count / maxCount) * 100;
          return (
            <div key={path} className="relative flex items-center justify-between text-sm py-1 group">
              {/* Background fill */}
              <div
                className="absolute inset-y-0 left-0 bg-gray-100/80 rounded-sm -z-10 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
              <span className="font-mono text-gray-700 truncate pr-4 z-10 pl-1">{path}</span>
              <span className="text-gray-900 font-medium z-10 pr-1">{count.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
