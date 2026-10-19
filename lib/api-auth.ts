import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ownerAccessStatus } from "@/lib/owner-access";

export function apiJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function requireSameOriginJson(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return apiJson({ error: "Invalid request origin." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return apiJson({ error: "Send a JSON request." }, 415);
  return null;
}

export async function requireOwner() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    const status = ownerAccessStatus(
      error ? null : (user?.id ?? null),
      process.env.PROMPTWATCH_OWNER_ID,
    );
    if (status === 200) return null;
    return apiJson(
      {
        error:
          status === 401
            ? "Sign in to continue."
            : status === 403
              ? "Only the deployment owner can access this resource."
              : "The deployment owner has not been configured.",
      },
      status,
    );
  } catch {
    return apiJson({ error: "Authentication is temporarily unavailable." }, 503);
  }
}
