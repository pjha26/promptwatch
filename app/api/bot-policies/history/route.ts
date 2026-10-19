import { apiJson, requireOwner } from "@/lib/api-auth";
import { createRedis } from "@/lib/redis";
import { parsePolicyHistory, POLICY_HISTORY_KEY, POLICY_HISTORY_LIMIT } from "@/lib/policy-history";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    const entries = parsePolicyHistory(
      await createRedis().lrange(POLICY_HISTORY_KEY, 0, POLICY_HISTORY_LIMIT - 1),
    );
    return apiJson({ entries });
  } catch {
    return apiJson({ error: "Policy history could not be loaded. Refresh to retry." }, 503);
  }
}
