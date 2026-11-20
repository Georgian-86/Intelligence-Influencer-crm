import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/demo";

/**
 * Finishes Google OAuth (?code=) and email magic links (?code= or ?token_hash=&type=).
 * New accounts without a talent profile always go to onboarding first.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const nextParam = url.searchParams.get("next") ?? "/dashboard";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";
  if (isDemo()) return NextResponse.redirect(new URL(next, url.origin));

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;

  if (ok) {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user && !next.startsWith("/crm") && !next.startsWith("/admin")) {
      const { data: talent } = await supabase.from("talent_profiles").select("id").eq("user_id", auth.user.id).maybeSingle();
      if (!talent) {
        const { data: staff } = await supabase.from("memberships").select("organizations(type)").eq("user_id", auth.user.id);
        const types = (staff ?? []).map((m) => (m.organizations as unknown as { type: string } | null)?.type);
        const home = types.includes("platform") ? "/admin" : types.includes("agency") ? "/crm" : types.includes("brand") ? "/brand" : next.startsWith("/onboarding") ? next : "/onboarding";
        return NextResponse.redirect(new URL(home, url.origin));
      }
    }
    return NextResponse.redirect(new URL(next, url.origin));
  }
  // Link opened on another device/browser, or expired: ask them to sign in again.
  return NextResponse.redirect(new URL(`/login?expired=1&next=${encodeURIComponent(next)}`, url.origin));
}
