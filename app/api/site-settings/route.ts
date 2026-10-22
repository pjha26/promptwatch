import { apiJson, requireOwner, requireSameOriginJson } from "@/lib/api-auth";
import { createRedis } from "@/lib/redis";
import {
  parseSiteInput,
  parseSiteSettings,
  saveSiteSettings,
  SITE_SETTINGS_KEY,
} from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    return apiJson({ site: parseSiteSettings(await createRedis().get(SITE_SETTINGS_KEY)) });
  } catch {
    return apiJson({ error: "Site settings could not be loaded. Check storage and retry." }, 503);
  }
}

export async function POST(request: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const invalid = requireSameOriginJson(request);
  if (invalid) return invalid;
  let input;
  try {
    input = parseSiteInput(await request.json());
  } catch (cause) {
    return apiJson(
      { error: cause instanceof Error ? cause.message : "Invalid site settings." },
      400,
    );
  }
  try {
    return apiJson({ site: await saveSiteSettings(createRedis(), input) });
  } catch {
    return apiJson({ error: "Save could not be confirmed. Reload settings before retrying." }, 503);
  }
}
