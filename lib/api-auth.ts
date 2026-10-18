import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ownerAccessStatus } from "@/lib/owner-access";

export function apiJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
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
