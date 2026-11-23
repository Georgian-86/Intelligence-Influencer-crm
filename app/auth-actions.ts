"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/demo";
import { DEMO_COOKIE, PERSONA_HOME, isPersona, personaForPath, type DemoPersona } from "@/lib/demo/persona";

/** Demo mode: "sign in" as one persona. Real auth never touches this cookie. */
async function setDemoPersona(p: DemoPersona) {
  (await cookies()).set(DEMO_COOKIE, p, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
}

export async function demoSignIn(formData: FormData) {
  if (!isDemo()) redirect("/login");
  const persona = formData.get("persona");
  if (!isPersona(persona)) redirect("/login");
  await setDemoPersona(persona);
  const next = safeNext(formData.get("next"), PERSONA_HOME[persona]);
  const need = personaForPath(next);
  redirect(need === persona || need === "any" ? next : PERSONA_HOME[persona]);
}

type Result = { ok: true } | { ok: false; error: string };

function safeNext(next: FormDataEntryValue | string | null | undefined, fallback: string) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}

async function origin() {
  const h = await headers();
  return h.get("origin") ?? (h.get("host") ? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}` : "");
}

/** Normalise Indian mobile numbers to E.164 (+91XXXXXXXXXX). Returns null if it doesn't look valid. */
function toE164(raw: string) {
  const d = raw.replace(/[^\d+]/g, "");
  if (/^\+\d{10,15}$/.test(d)) return d;
  const digits = d.replace(/\D/g, "").replace(/^0+/, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  return null;
}

/** Primary path (D2): Google OAuth. New accounts land on onboarding, returning users on `next`. */
export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"), "/onboarding");
  if (isDemo()) { await setDemoPersona("creator"); redirect(next); }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`, queryParams: { prompt: "select_account" } },
  });
  if (error || !data.url) redirect(`/register?error=${encodeURIComponent("Google sign-in is unavailable right now. Try phone or email.")}`);
  redirect(data.url);
}

/** Second path: one-time code on WhatsApp (falls back to SMS if the WhatsApp channel isn't configured). */
export async function sendPhoneOtp(phone: string): Promise<Result & { phone?: string; channel?: "whatsapp" | "sms" }> {
  const e164 = toE164(phone);
  if (!e164) return { ok: false, error: "Enter a 10-digit mobile number." };
  if (isDemo()) {
    await new Promise((r) => setTimeout(r, 700));
    return { ok: true, phone: e164, channel: "whatsapp" };
  }
  const supabase = await createClient();
  const wa = await supabase.auth.signInWithOtp({ phone: e164, options: { channel: "whatsapp" } });
  if (!wa.error) return { ok: true, phone: e164, channel: "whatsapp" };
  const sms = await supabase.auth.signInWithOtp({ phone: e164 });
  if (!sms.error) return { ok: true, phone: e164, channel: "sms" };
  console.error("[auth] phone OTP failed", { whatsapp: wa.error?.message, sms: sms.error?.message });
  if (/provider|disabled|not enabled|unsupported|sms_send_failed|twilio/i.test(`${wa.error?.message} ${sms.error?.message}`)) {
    return { ok: false, error: "Phone sign-in isn't switched on yet. Use email instead for now." };
  }
  return { ok: false, error: "Couldn't send a code to that number. Try again in a minute." };
}

export async function verifyPhoneOtp(phone: string, token: string, next: string): Promise<Result & { redirectTo?: string }> {
  const code = token.replace(/\D/g, "");
  const dest = safeNext(next, "/onboarding");
  if (code.length !== 6) return { ok: false, error: "Enter the 6-digit code." };
  if (isDemo()) {
    await setDemoPersona("creator");
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true, redirectTo: dest };
  }
  const e164 = toE164(phone);
  if (!e164) return { ok: false, error: "Enter a valid mobile number." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ phone: e164, token: code, type: "sms" });
  if (error) return { ok: false, error: "That code didn't work. Check it or resend." };
  return { ok: true, redirectTo: dest };
}

/** Fallback: passwordless magic link by email. */
export async function sendMagicLink(email: string, next: string): Promise<Result> {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, error: "Enter a valid email address." };
  if (isDemo()) {
    await setDemoPersona("creator");
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: e,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(safeNext(next, "/onboarding"))}` },
  });
  if (error) {
    console.error("[auth] magic link failed", error.message);
    return { ok: false, error: error.message.includes("rate") ? "Too many attempts. Wait a minute and try again." : "Couldn't send the link. Try again." };
  }
  return { ok: true };
}

/** Legacy email + password (accounts created before passwordless). */
export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"), "/dashboard");
  if (isDemo()) { await setDemoPersona("creator"); redirect(next); }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("[auth] password sign-in failed", error.code, error.message);
    const msg = /not confirmed/i.test(error.message) ? "Confirm your email first: open the link we sent you." : "Email or password is incorrect.";
    redirect(`/login?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`);
  }
  // Staff accounts (admin, agency, brand) land in their workspace, not the creator dashboard or onboarding.
  if (next === "/dashboard" || next.startsWith("/onboarding")) {
    const home = await staffHome(supabase, data.user.id);
    if (home) redirect(home);
  }
  redirect(next);
}

/** Legacy email + password sign-up (kept for API compatibility; the UI is passwordless). */
export async function signUp(formData: FormData) {
  const type = formData.get("type") === "event" ? "event" : "influencer";
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const back = `/register?type=${type}`;
  if (isDemo()) { await setDemoPersona("creator"); redirect(`/onboarding?type=${type}`); }
  if (!fullName || !email || password.length < 8) {
    redirect(`${back}&error=${encodeURIComponent("Enter your name, email and a password of at least 8 characters.")}`);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(`/onboarding?type=${type}`)}` },
  });
  if (error) {
    console.error("[auth] sign-up failed", error.code, error.message);
    redirect(`${back}&error=${encodeURIComponent(error.message)}`);
  }
  if (!data.session) redirect(`/login?checkEmail=1`);
  redirect(`/onboarding?type=${type}`);
}

export async function signOut() {
  if (isDemo()) { (await cookies()).delete(DEMO_COOKIE); redirect("/"); }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** Workspace for a user with org memberships: admin for platform staff, CRM for agency staff, brand portal for brand users. */
async function staffHome(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string | null> {
  const { data } = await supabase.from("memberships").select("organizations(type)").eq("user_id", userId);
  const types = (data ?? []).map((m) => (m.organizations as unknown as { type: string } | null)?.type);
  if (types.includes("platform")) return "/admin";
  if (types.includes("agency")) return "/crm";
  if (types.includes("brand")) return "/brand";
  return null;
}
