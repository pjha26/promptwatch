import { apiJson, requireOwner, requireSameOriginJson } from "@/lib/api-auth";
import { IDENTITY_SOURCES } from "@/lib/crawler-identity";
import { readIdentityReport, refreshIdentityFeed } from "@/lib/identity-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    return apiJson(await readIdentityReport());
  } catch {
    return apiJson({ error: "Identity observations could not be loaded." }, 503);
  }
}

export async function POST(request: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const invalid = requireSameOriginJson(request);
  if (invalid) return invalid;
  let botId: unknown;
  try {
    botId = (await request.json())?.botId;
  } catch {
    /* Invalid JSON is rejected below. */
  }
  if (typeof botId !== "string" || !Object.hasOwn(IDENTITY_SOURCES, botId))
    return apiJson({ error: "Choose a supported crawler feed." }, 400);
  try {
    await refreshIdentityFeed(botId);
    return apiJson({ success: true, botId });
  } catch {
    return apiJson(
      {
        error:
          "Feed refresh could not be confirmed. Reload before retrying; existing valid data has not been replaced by an error.",
      },
      503,
    );
  }
}
