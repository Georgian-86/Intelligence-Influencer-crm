"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDemo } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import { syncInstagramAccount } from "@/lib/instagram";
import { DEMO_INTEREST_COOKIE, DEMO_PROFILE_COOKIE, DEMO_SYNC_COOKIE } from "./_lib/data";

type Result = { ok: true; message?: string } | { ok: false; error: string };
const cookieOpts = { path: "/", maxAge: 60 * 60 * 24 * 14, sameSite: "lax" as const };

async function setDemoInterest(briefId: string, on: boolean) {
  const jar = await cookies();
  const cur = new Set((jar.get(DEMO_INTEREST_COOKIE)?.value ?? "").split(",").filter(Boolean));
  if (on) cur.add(briefId); else cur.delete(briefId);
  jar.set(DEMO_INTEREST_COOKIE, [...cur].join(","), cookieOpts);
}

/** One-tap "I'm interested". Returns instead of redirecting so the UI can stay optimistic. */
export async function markInterested(briefId: string, opts: { message?: string; quotedRate?: number | null } = {}): Promise<Result> {
  if (!/^[\w-]{1,64}$/.test(briefId)) return { ok: false, error: "Unknown brief." };
  if (isDemo()) {
    await new Promise((r) => setTimeout(r, 450));
    await setDemoInterest(briefId, true);
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Sent to Vigor. You'll hear back on WhatsApp." };
  }
  const supabase = await createClient();
  const { data: talentId } = await supabase.rpc("my_talent_id");
  if (!talentId) return { ok: false, error: "Finish your profile first." };
  const { error } = await supabase.from("intents").insert({
    brief_id: briefId,
    talent_id: talentId,
    message: opts.message?.trim() || null,
    quoted_rate: opts.quotedRate ?? null,
  });
  if (error && error.code !== "23505") return { ok: false, error: "Couldn't send your interest. Try again." };
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Sent to Vigor. You'll hear back on WhatsApp." };
}

/** No-JS fallback for the brief detail form. */
export async function expressInterest(formData: FormData) {
  const briefId = String(formData.get("brief_id"));
  const rate = String(formData.get("quoted_rate") ?? "").replace(/[^\d]/g, "");
  const res = await markInterested(briefId, { message: String(formData.get("message") ?? ""), quotedRate: rate ? parseInt(rate, 10) : null });
  redirect(`/dashboard/briefs/${briefId}?${res.ok ? "sent=1" : `error=${encodeURIComponent(res.error)}`}`);
}

export async function withdrawInterest(formData: FormData) {
  const id = String(formData.get("intent_id"));
  if (isDemo()) {
    if (id.startsWith("new-")) await setDemoInterest(id.slice(4), false);
    revalidatePath("/dashboard", "layout");
    redirect("/dashboard/applications");
  }
  const supabase = await createClient();
  await supabase.from("intents").delete().eq("id", id).eq("stage", "interested");
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/applications");
}

/** Re-fetch public Instagram stats (rate-limited to once an hour). */
export async function refreshMyInstagram(accountId: string): Promise<Result & { syncedAt?: string }> {
  if (isDemo()) {
    await new Promise((r) => setTimeout(r, 1200));
    (await cookies()).set(DEMO_SYNC_COOKIE, String(Date.now()), cookieOpts);
    revalidatePath("/dashboard", "layout");
    return { ok: true, syncedAt: new Date().toISOString(), message: "Synced from Instagram" };
  }
  const supabase = await createClient();
  const { data: acc } = await supabase.from("social_accounts").select("id, last_fetched_at, talent_id").eq("id", accountId).maybeSingle();
  const { data: mine } = await supabase.rpc("my_talent_id");
  if (!acc || acc.talent_id !== mine) return { ok: false, error: "Connect your Instagram first." };
  const recent = acc.last_fetched_at && Date.now() - new Date(acc.last_fetched_at).getTime() < 60 * 60 * 1000;
  if (recent) return { ok: false, error: "Synced less than an hour ago — try again later." };
  const res = await syncInstagramAccount(acc.id);
  revalidatePath("/dashboard", "layout");
  return res.ok ? { ok: true, syncedAt: new Date().toISOString(), message: "Synced from Instagram" } : { ok: false, error: res.error };
}

/** Edit-in-place saves from the profile page. Only whitelisted fields are written. */
export type ProfilePatch = Partial<{
  bio: string | null; city: string | null; languages: string[]; categories: string[]; gender: string | null; dob: string | null;
  ratePerPost: number | null; rateFullDay: number | null; rateNotes: string | null; whatsapp: string | null; portfolio: string[];
}>;

export async function updateProfile(patch: ProfilePatch): Promise<Result> {
  const clean: ProfilePatch = {};
  if ("bio" in patch) clean.bio = patch.bio?.slice(0, 600) || null;
  if ("city" in patch) clean.city = patch.city?.slice(0, 60) || null;
  if (patch.languages) clean.languages = patch.languages.slice(0, 10).map((s) => s.slice(0, 30));
  if (patch.categories) clean.categories = patch.categories.slice(0, 12).map((s) => s.slice(0, 40));
  if ("gender" in patch) clean.gender = patch.gender || null;
  if ("dob" in patch) clean.dob = patch.dob && /^\d{4}-\d{2}-\d{2}$/.test(patch.dob) ? patch.dob : null;
  for (const k of ["ratePerPost", "rateFullDay"] as const) if (k in patch) clean[k] = patch[k] && patch[k]! > 0 ? Math.min(10_000_000, Math.round(patch[k]!)) : null;
  if ("rateNotes" in patch) clean.rateNotes = patch.rateNotes?.slice(0, 300) || null;
  if ("whatsapp" in patch) clean.whatsapp = patch.whatsapp?.replace(/[^\d+ ]/g, "").slice(0, 20) || null;
  if (patch.portfolio) clean.portfolio = patch.portfolio.filter((u) => /^https?:\/\//i.test(u)).slice(0, 5);

  if (isDemo()) {
    const jar = await cookies();
    let cur: Record<string, unknown> = {};
    try { cur = JSON.parse(jar.get(DEMO_PROFILE_COOKIE)?.value ?? "{}"); } catch { cur = {}; }
    jar.set(DEMO_PROFILE_COOKIE, JSON.stringify({ ...cur, ...clean }), cookieOpts);
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Saved" };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Your session expired. Log in again." };
  const row: Record<string, unknown> = {};
  if ("bio" in clean) row.bio = clean.bio;
  if ("city" in clean) row.city = clean.city;
  if (clean.languages) row.languages = clean.languages;
  if (clean.categories) row.categories = clean.categories;
  if ("gender" in clean) row.gender = clean.gender;
  if ("dob" in clean) row.date_of_birth = clean.dob;
  if ("ratePerPost" in clean) row.rate_per_post = clean.ratePerPost;
  if ("rateFullDay" in clean) row.rate_full_day = clean.rateFullDay;
  if ("rateNotes" in clean) row.rate_notes = clean.rateNotes;
  const { data: talent, error } = Object.keys(row).length
    ? await supabase.from("talent_profiles").update(row).eq("user_id", auth.user.id).select("id").single()
    : await supabase.from("talent_profiles").select("id").eq("user_id", auth.user.id).single();
  if (error || !talent) return { ok: false, error: "Couldn't save. Try again." };
  if ("whatsapp" in clean) await supabase.from("talent_contacts").upsert({ talent_id: talent.id, whatsapp: clean.whatsapp });
  if (clean.portfolio) {
    await supabase.from("talent_media").delete().eq("talent_id", talent.id);
    if (clean.portfolio.length) await supabase.from("talent_media").insert(clean.portfolio.map((url) => ({ talent_id: talent.id, url, kind: "portfolio" })));
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Saved" };
}

/* ------------------------------------------------------------------ deliverables */
const rpcError = (m: string) => (/row-level security|permission denied|Not your deliverable/i.test(m) ? "This isn't one of your deliverables." : m);

/** New draft version: a link (Drive / Instagram / YouTube) or a file already uploaded to storage. */
export async function submitDraft(deliverableId: string, input: { caption?: string; link?: string; storagePath?: string; note?: string }): Promise<Result> {
  if (isDemo()) {
    await new Promise((r) => setTimeout(r, 500));
    return { ok: true, message: "Draft submitted. Vigor reviews within 24h." };
  }
  const link = input.link?.trim() || null;
  if (link && !/^https?:\/\/\S+\.\S+/.test(link)) return { ok: false, error: "Paste a full link, e.g. https://drive.google.com/…" };
  if (!link && !input.storagePath) return { ok: false, error: "Choose a file or paste a link." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_deliverable", {
    p_id: deliverableId, p_caption: input.caption?.slice(0, 2200) ?? null, p_media_url: link, p_storage_path: input.storagePath ?? null, p_note: input.note?.slice(0, 2000) ?? null,
  });
  if (error) return { ok: false, error: rpcError(error.message) };
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: `Version ${data} submitted. Vigor reviews within 24h.` };
}

/** After approval: the creator posts and pastes the live Instagram / YouTube link. */
export async function submitLiveLink(deliverableId: string, url: string): Promise<Result> {
  if (isDemo()) return { ok: true, message: "Live link saved. Payout unlocks once Vigor verifies the post." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_live_link", { p_id: deliverableId, p_url: url.trim() });
  if (error) return { ok: false, error: rpcError(error.message) };
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Live link saved. Your payout is processed once everything on this booking is live." };
}
