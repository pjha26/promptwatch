import { apiJson, requireOwner, requireSameOriginJson } from "@/lib/api-auth";
import { readCrawlerActionSnapshot, saveActionDecision } from "@/lib/action-store";
import { parseActionUpdate } from "@/lib/crawler-actions";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    return apiJson(await readCrawlerActionSnapshot());
  } catch {
    return apiJson(
      { error: "Recommendations could not be loaded from recorded traffic and saved decisions." },
      503,
    );
  }
}

export async function POST(request: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const invalid = requireSameOriginJson(request);
  if (invalid) return invalid;
  let update;
  try {
    update = parseActionUpdate(await request.json());
  } catch {
    return apiJson({ error: "Provide a valid current action and supported review status." }, 400);
  }
  try {
    const snapshot = await readCrawlerActionSnapshot();
    if (!snapshot.actions.some((action) => action.id === update.id))
      return apiJson(
        { error: "This recommendation is no longer in the current window. Refresh actions." },
        409,
      );
    const decision = await saveActionDecision(update.id, update.status);
    return apiJson({ id: update.id, ...decision });
  } catch {
    return apiJson(
      { error: "The review decision could not be confirmed. Refresh actions before retrying." },
      503,
    );
  }
}
