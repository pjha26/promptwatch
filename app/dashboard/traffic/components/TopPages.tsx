import { useMemo } from "react";

interface TopPagesProps {
  pageTotals: Record<string, number>;
  blockedPageTotals?: Record<string, number>;
  startedAt?: string | null;
  loading?: boolean;
  error?: boolean;
  retry?: () => void;
}

export function TopPages({
  pageTotals,
  blockedPageTotals = {},
  startedAt,
  loading,
  error,
  retry,
}: TopPagesProps) {
  const topPages = useMemo(
    () =>
      [...new Set([...Object.keys(pageTotals), ...Object.keys(blockedPageTotals)])]
        .map((path) => ({
          path,
          allowed: pageTotals[path] ?? 0,
          blocked: blockedPageTotals[path] ?? 0,
        }))
        .sort((a, b) => b.allowed + b.blocked - (a.allowed + a.blocked))
        .slice(0, 8),
    [pageTotals, blockedPageTotals],
  );
  const max = topPages.length ? topPages[0].allowed + topPages[0].blocked : 1;
  return (
    <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-2 text-sm font-semibold text-gray-900">Top Pages</h2>
      <p className="mb-4 text-xs text-gray-500">
        Configured public paths only; up to 200 paths per day per outcome. Query strings are never
        stored.
      </p>
      {startedAt && (
        <p className="mb-4 text-xs text-gray-500">
          Path collection first recorded: {startedAt} (UTC).
        </p>
      )}
      {loading ? (
        <p role="status" className="text-sm text-gray-500">
          Loading pages…
        </p>
      ) : error ? (
        <div role="alert" className="space-y-3 text-sm text-gray-700">
          <p>Page analytics could not be loaded. Traffic totals remain available.</p>
          <button
            type="button"
            onClick={retry}
            className="rounded border border-gray-400 px-3 py-2"
          >
            Retry pages
          </button>
        </div>
      ) : topPages.length === 0 ? (
        <p className="text-sm text-gray-500">
          No eligible public-page requests recorded in this period. Check your public path allowlist
          if collection is new.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {topPages.map((page) => (
            <li
              key={page.path}
              className="relative flex flex-wrap items-center justify-between gap-2 py-2 text-sm text-gray-900"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 bg-gray-900 opacity-5"
                style={{ width: `${((page.allowed + page.blocked) / max) * 100}%` }}
              />
              <span className="z-10 min-w-0 max-w-full truncate pl-1 font-mono" title={page.path}>
                {page.path}
              </span>
              <span className="z-10 pr-1 text-xs">
                {page.allowed.toLocaleString()} allowed · {page.blocked.toLocaleString()} blocked
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
