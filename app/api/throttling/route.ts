import { apiJson, requireOwner, requireSameOriginJson } from "@/lib/api-auth";
import { createRedis } from "@/lib/redis";
import { parseThrottleInput, saveThrottleRule } from "@/lib/throttle-rules";
import { readThrottleSnapshot } from "@/lib/throttle-store";

export const dynamic = "force-dynamic";
export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    return apiJson(await readThrottleSnapshot());
  } catch {
    return apiJson({ error: "Throttle settings and observations could not be loaded." }, 503);
  }
}
export async function POST(request: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const invalid = requireSameOriginJson(request);
  if (invalid) return invalid;
  let input;
  try {
    input = parseThrottleInput(await request.json());
  } catch {
    return apiJson(
      {
        error:
          "Choose a supported crawler/mode and a whole-number requests-per-minute limit (1–100000).",
      },
      400,
    );
  }
  try {
    return apiJson(await saveThrottleRule(createRedis(), input));
  } catch {
    return apiJson({ error: "Throttle save could not be confirmed. Reload before retrying." }, 503);
  }
}
