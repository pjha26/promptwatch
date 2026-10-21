import { apiJson } from "@/lib/api-auth";
import { cronAccessStatus } from "@/lib/cron-auth";
import { ownerAccessStatus } from "@/lib/owner-access";
import { createRedis } from "@/lib/redis";
import { refreshIdentityFeed } from "@/lib/identity-store";
import { runIdentityRefresh } from "@/lib/identity-refresh";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (process.env.PROMPTWATCH_AUTO_REFRESH_FEEDS !== "true") return apiJson({ status: "disabled" });
  const status = cronAccessStatus(request.headers.get("authorization"), process.env.CRON_SECRET);
  if (status !== 200)
    return apiJson(
      {
        error:
          status === 401
            ? "Unauthorized scheduled request."
            : "Scheduled refresh authentication is not configured.",
      },
      status,
    );
  const owner = process.env.PROMPTWATCH_OWNER_ID?.trim();
  if (ownerAccessStatus(owner ?? null, owner) !== 200)
    return apiJson(
      { error: "Configure the deployment owner before enabling scheduled refresh." },
      503,
    );
  try {
    const result = await runIdentityRefresh(createRedis, refreshIdentityFeed);
    return apiJson(
      result,
      result.status === "busy" ? 202 : result.status === "success" ? 200 : 503,
    );
  } catch {
    return apiJson(
      {
        error:
          "Scheduled refresh could not be confirmed. Check the last recorded completion and retry after the lease expires.",
      },
      503,
    );
  }
}
