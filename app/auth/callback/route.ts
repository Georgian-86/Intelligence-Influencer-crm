import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safe(next: string | null, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/**
 * Finishes every Supabase redirect flow: email confirmation links and Google OAuth (PKCE code).
 * First-time users (no talent profile, no team membership) are sent to /onboarding.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = safe(url.searchParams.get("next"), "/dashboard");

  // Provider refused / user cancelled the Google consent screen.
  const oauthError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (oauthError && !code) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(oauthError)}&next=${encodeURIComponent(next)}`, url.origin),
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      return NextResponse.redirect(new URL(await routeFor(supabase, data.user.id, next), url.origin));
    }
  }
  // Opened on another device/browser: the email is already confirmed, so just ask them to log in.
  return NextResponse.redirect(new URL(`/login?confirmed=1&next=${encodeURIComponent(next)}`, url.origin));
}

async function routeFor(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, next: string) {
  if (next.startsWith("/onboarding")) return next;
  // Team members (agency / platform) go wherever they were headed.
  const [{ data: talent }, { data: member }] = await Promise.all([
    supabase.from("talent_profiles").select("id").eq("user_id", userId).maybeSingle(),
    supabase.from("memberships").select("org_id").eq("user_id", userId).limit(1).maybeSingle(),
  ]);
  if (talent || member) return next;
  return "/onboarding";
}
