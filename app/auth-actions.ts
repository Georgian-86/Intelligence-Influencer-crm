"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeNext(next: FormDataEntryValue | null, fallback: string) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}

export async function signUp(formData: FormData) {
  const type = formData.get("type") === "event" ? "event" : "influencer";
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const back = `/register?type=${type}`;
  if (!fullName || !email || password.length < 8) {
    redirect(`${back}&error=${encodeURIComponent("Enter your name, email and a password of at least 8 characters.")}`);
  }
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(`/onboarding?type=${type}`)}`,
    },
  });
  if (error) redirect(`${back}&error=${encodeURIComponent(error.message)}`);
  if (!data.session) redirect(`/login?checkEmail=1`);
  redirect(`/onboarding?type=${type}`);
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"), "/dashboard");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

async function requestOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "");
}

/**
 * Google OAuth (PKCE). Supabase sends the user back to /auth/callback with a `code`; the callback
 * exchanges it for a session and routes first-time users to /onboarding.
 */
export async function signInWithGoogle(formData: FormData) {
  const rawType = formData.get("type");
  const type = rawType === "event" || rawType === "influencer" ? rawType : null;
  const next = safeNext(formData.get("next"), type ? `/onboarding?type=${type}` : "/dashboard");
  const from = formData.get("from") === "register" ? `/register?type=${type ?? "influencer"}` : `/login?next=${encodeURIComponent(next)}`;
  const origin = await requestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) {
    const msg = error?.message ?? "Google sign-in isn't available right now. Use email instead.";
    redirect(`${from}&error=${encodeURIComponent(msg)}`);
  }
  redirect(data.url);
}
