import { Action, Status } from "@/lib/types";
import { MessageSquare, Mail, FileText, Check, X } from "lucide-react";

interface ActionCardProps {
  action: Action;
  onUpdateStatus: (id: string, status: Status) => void;
}

function getRelativeDateLabel(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date("2026-06-03T00:00:00Z"); // Use the fixed reference date as per spec
  
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}

export function ActionCard({ action, onUpdateStatus }: ActionCardProps) {
  const Icon = 
    action.type === "reddit" ? MessageSquare :
    action.type === "outreach" ? Mail :
    FileText;

  const typeLabel = 
    action.type === "reddit" ? "Reddit" :
    action.type === "outreach" ? "Outreach" :
    "Content";

  const isDismissedTab = action.status === "accepted" || action.status === "dismissed";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col min-h-[220px] shadow-sm hover:shadow-md transition-shadow">
      {/* Top Row: Type and Severity */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md text-gray-700 text-xs font-medium">
          <Icon className="w-3.5 h-3.5" />
          <span>{typeLabel}</span>
        </div>
        
        {/* Severity Badge */}
        <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          action.severity === "high" ? "bg-red-100 text-red-700" :
          action.severity === "medium" ? "bg-amber-100 text-amber-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {action.severity.charAt(0).toUpperCase() + action.severity.slice(1)}
        </div>
      </div>

      {/* Body: Title and Description */}
      <div className="flex-1 flex flex-col min-h-0">
        {action.source_url ? (
          <a href={action.source_url} target="_blank" rel="noopener noreferrer" className="font-bold text-gray-900 text-base leading-snug line-clamp-2 mb-2 hover:text-blue-600 transition-colors">
            {action.title}
          </a>
        ) : (
          <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 mb-2">
            {action.title}
          </h3>
        )}
        <p className="text-gray-500 text-sm line-clamp-3">
          {action.description}
        </p>
      </div>

      {/* Bottom Row: Date and Actions/Status */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
        <span className="text-gray-400 text-xs font-medium">
          {getRelativeDateLabel(action.created_at)}
        </span>
        
        <div className="flex items-center gap-2">
          {!isDismissedTab ? (
            <>
              <button
                type="button"
                onClick={() => onUpdateStatus(action.id, "dismissed")}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-xs font-semibold transition-colors"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus(action.id, "accepted")}
                className="px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-800 rounded-md text-xs font-semibold transition-colors"
              >
                Accept
              </button>
            </>
          ) : (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              action.status === "accepted" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {action.status === "accepted" ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>{action.status === "accepted" ? "Accepted" : "Dismissed"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
