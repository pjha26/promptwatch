import { apiJson, requireOwner } from "@/lib/api-auth";
import { readPageHistory } from "@/lib/page-history";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    return apiJson(await readPageHistory());
  } catch {
    return apiJson({ error: "Page analytics are temporarily unavailable." }, 503);
  }
}
