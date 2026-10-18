import { apiJson, requireOwner } from "@/lib/api-auth";
import { readTrafficHistory } from "@/lib/traffic-history";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    return apiJson(await readTrafficHistory());
  } catch {
    return apiJson(
      { error: "Traffic reporting is temporarily unavailable. Please try again." },
      503,
    );
  }
}
