import Link from "next/link";
import { BarChart2, Shield, Search, Check, X } from "lucide-react";
import { CRAWLER_ACTION_LABELS, type CrawlerAction } from "@/lib/crawler-actions";
import type { Status } from "@/lib/types";

interface ActionCardProps {
  action: CrawlerAction;
  disabled?: boolean;
  onUpdateStatus: (id: string, status: Status) => void | Promise<void>;
}

export function ActionCard({ action, disabled, onUpdateStatus }: ActionCardProps) {
  const Icon =
    action.type === "traffic-spike"
      ? BarChart2
      : action.type === "repeated-blocks"
        ? Shield
        : Search;
  return (
    <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium">
          <Icon aria-hidden="true" className="h-3.5 w-3.5" />
          {CRAWLER_ACTION_LABELS[action.type]}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${action.severity === "high" ? "bg-red-100 text-red-700" : action.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}
        >
          {action.severity} priority
        </span>
      </div>
      <h3 className="mb-2 text-base font-bold">{action.title}</h3>
      <p className="text-sm text-gray-600">{action.description}</p>
      <dl className="my-4 space-y-2 border-y border-gray-100 py-4 text-xs">
        {action.evidence.map((metric) => (
          <div key={metric.label} className="flex flex-wrap justify-between gap-2">
            <dt className="text-gray-600">{metric.label}</dt>
            <dd className="break-words font-mono font-medium">
              {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-gray-500">
        Evidence window: {action.windowStart} — {action.windowEnd} UTC
      </p>
      <Link
        href={action.source_url}
        className="mt-3 text-sm font-medium underline underline-offset-4"
      >
        {action.type === "repeated-blocks" ? "Review access rules" : "View traffic evidence"}
      </Link>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        {action.status === "active" ? (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => void onUpdateStatus(action.id, "dismissed")}
              className="rounded border border-gray-300 px-3 py-2 text-xs font-semibold disabled:opacity-50"
            >
              Dismiss
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => void onUpdateStatus(action.id, "accepted")}
              className="rounded bg-gray-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Mark reviewed
            </button>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
              {action.status === "accepted" ? (
                <Check aria-hidden="true" className="h-4 w-4" />
              ) : (
                <X aria-hidden="true" className="h-4 w-4" />
              )}
              {action.status === "accepted" ? "Reviewed" : "Dismissed"}
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => void onUpdateStatus(action.id, "active")}
              className="rounded border border-gray-300 px-3 py-2 text-xs font-semibold disabled:opacity-50"
            >
              Reopen
            </button>
          </>
        )}
      </div>
      {action.reviewedAt && (
        <p className="mt-3 text-xs text-gray-500">
          Decision saved: {new Date(action.reviewedAt).toLocaleString("en-GB", { timeZone: "UTC" })}{" "}
          UTC
        </p>
      )}
    </article>
  );
}
