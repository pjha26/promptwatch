import { apiJson, requireOwner } from "@/lib/api-auth";
import { createRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    await createRedis().ping();
    return apiJson({ status: "ok" });
  } catch {
    return apiJson({ error: "Redis is unavailable." }, 503);
  }
}
