import { apiJson, requireOwner, requireSameOriginJson } from "@/lib/api-auth";
import { botSignatures } from "@/lib/botSignatures";
import { createRedis } from "@/lib/redis";
import { parsePolicyUpdate, readPolicies } from "@/lib/bot-policies";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    const redis = createRedis();
    const policies = readPolicies(
      await redis.mget<(string | null)[]>(...botSignatures.map((bot) => `policy:${bot.id}`)),
    );
    return apiJson(botSignatures.map((bot, index) => ({ ...bot, policy: policies[index] })));
  } catch {
    return apiJson({ error: "Could not read the enforced bot policies. Please retry." }, 503);
  }
}

export async function POST(request: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const invalid = requireSameOriginJson(request);
  if (invalid) return invalid;
  let update;
  try {
    update = parsePolicyUpdate(await request.json());
  } catch {
    return apiJson({ error: "Provide a known botId and an allow or block policy." }, 400);
  }
  try {
    // One authoritative write: the middleware reads this same key.
    await createRedis().set(`policy:${update.botId}`, update.policy);
    return apiJson({ success: true, ...update });
  } catch {
    return apiJson(
      { error: "Could not confirm the policy update. Refresh policies before retrying." },
      503,
    );
  }
}
