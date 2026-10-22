import { apiJson } from "@/lib/api-auth";
import { alertConfiguration, runConfiguredAlerts } from "@/lib/alert-store";
import { cronAccessStatus } from "@/lib/cron-auth";
import { ownerAccessStatus } from "@/lib/owner-access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!alertConfiguration().enabled) return apiJson({ status: "disabled" });
  const status = cronAccessStatus(request.headers.get("authorization"), process.env.CRON_SECRET);
  if (status !== 200)
    return apiJson({ error: "Scheduled alert authentication is unavailable or invalid." }, status);
  const owner = process.env.PROMPTWATCH_OWNER_ID?.trim();
  if (ownerAccessStatus(owner ?? null, owner) !== 200)
    return apiJson(
      { error: "Configure the deployment owner before enabling scheduled alerts." },
      503,
    );
  try {
    const result = await runConfiguredAlerts();
    return apiJson(
      result,
      result.status === "partial" ? 503 : result.status === "busy" ? 202 : 200,
    );
  } catch {
    return apiJson(
      {
        error:
          "Scheduled alert check could not be confirmed. Check webhook setup and delivery history.",
      },
      503,
    );
  }
}
