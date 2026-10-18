import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { safeAuthRedirect } from "@/lib/auth-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeAuthRedirect(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, redirect back to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
