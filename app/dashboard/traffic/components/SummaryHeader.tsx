interface SummaryHeaderProps {
  total: number;
  botCount: number;
  pageCount: number | null;
  blocked?: number;
  limited?: number;
}

export function SummaryHeader({
  total,
  botCount,
  pageCount,
  blocked = 0,
  limited = 0,
}: SummaryHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="dashboard-title">AI Traffic</h1>
      <p className="mt-1 text-sm text-gray-500">
        {total.toLocaleString()} allowed, {blocked.toLocaleString()} blocked and{" "}
        {limited.toLocaleString()} rate-limited requests from {botCount} crawler identities, last 30
        UTC days.
        {pageCount === null
          ? " Page data unavailable."
          : ` Allowed traffic recorded on ${pageCount.toLocaleString()} allowlisted pages.`}
      </p>
    </div>
  );
}
