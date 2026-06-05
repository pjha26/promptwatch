import { BotName } from "@/lib/types";

interface SummaryHeaderProps {
  total: number;
  botCount: number;
  pageCount: number;
}

export function SummaryHeader({ total, botCount, pageCount }: SummaryHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-medium text-gray-900">AI Traffic</h1>
      <p className="mt-1 text-sm text-gray-500">
        {total.toLocaleString()} visits from {botCount} bots across {pageCount.toLocaleString()} pages, last 90 days
      </p>
    </div>
  );
}
