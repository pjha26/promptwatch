import { apiJson, requireOwner, requireSameOriginJson } from "@/lib/api-auth";
import { checkCollectorStorage, readTrackingHealth } from "@/lib/tracking-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    return apiJson(await readTrackingHealth());
  } catch {
    return apiJson(
      { error: "Storage health is unavailable. Existing traffic data may be incomplete." },
      503,
    );
  }
}

export async function POST(request: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const invalid = requireSameOriginJson(request);
  if (invalid) return invalid;
  try {
    await checkCollectorStorage();
    return apiJson(await readTrackingHealth());
  } catch {
    return apiJson(
      { error: "The storage self-check could not be confirmed. Refresh status before retrying." },
      503,
    );
  }
}
