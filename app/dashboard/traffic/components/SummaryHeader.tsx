interface SummaryHeaderProps {
  total: number;
  botCount: number;
  pageCount: number | null;
  blocked?: number;
}

export function SummaryHeader({ total, botCount, pageCount, blocked = 0 }: SummaryHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-medium text-gray-900">AI Traffic</h1>
      <p className="mt-1 text-sm text-gray-500">
        {total.toLocaleString()} allowed requests and {blocked.toLocaleString()} blocked requests
        from {botCount} crawler identities, last 30 UTC days.
        {pageCount === null
          ? " Page data unavailable."
          : ` Allowed traffic recorded on ${pageCount.toLocaleString()} allowlisted pages.`}
      </p>
    </div>
  );
}
