import { apiJson, requireOwner, requireSameOriginJson } from "@/lib/api-auth";
import { readAlertStatus, runConfiguredAlerts } from "@/lib/alert-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    return apiJson(await readAlertStatus());
  } catch {
    return apiJson({ error: "Alert delivery history could not be loaded." }, 503);
  }
}

export async function POST(request: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const invalid = requireSameOriginJson(request);
  if (invalid) return invalid;
  try {
    const result = await runConfiguredAlerts();
    return apiJson(
      result,
      result.status === "partial" ? 503 : result.status === "busy" ? 202 : 200,
    );
  } catch {
    return apiJson(
      { error: "Alert check could not be confirmed. Reload delivery history before retrying." },
      503,
    );
  }
}
