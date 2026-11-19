"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncInstagramAccount } from "@/lib/instagram";

/** Shared insert used by both interest actions. A duplicate (23505) counts as success. */
async function insertIntent(formData: FormData) {
  const briefId = String(formData.get("brief_id"));
  const supabase = await createClient();
  const { data: talentId } = await supabase.rpc("my_talent_id");
  if (!talentId) redirect("/onboarding");
  const rate = String(formData.get("quoted_rate") ?? "").replace(/[^\d]/g, "");
  const { error } = await supabase.from("intents").insert({
    brief_id: briefId,
    talent_id: talentId,
    message: String(formData.get("message") ?? "").trim() || null,
    quoted_rate: rate ? parseInt(rate, 10) : null,
  });
  return { briefId, ok: !error || error.code === "23505" };
}

export async function expressInterest(formData: FormData) {
  const { briefId, ok } = await insertIntent(formData);
  if (!ok) {
    redirect(`/dashboard/briefs/${briefId}?error=${encodeURIComponent("Could not register your interest.")}`);
  }
  revalidatePath("/dashboard/briefs");
  redirect(`/dashboard/briefs/${briefId}?sent=1`);
}

export type InterestState = { status: "idle" | "sent" | "error"; message?: string };

/**
 * One-tap "I'm in" (A5). Same insert as expressInterest, but returns state instead of redirecting
 * so the brief card / detail panel can show an optimistic success state in place.
 */
export async function quickInterest(_prev: InterestState, formData: FormData): Promise<InterestState> {
  const { ok } = await insertIntent(formData);
  if (!ok) return { status: "error", message: "Couldn't register your interest — please try again." };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/briefs");
  revalidatePath("/dashboard/applications");
  return { status: "sent" };
}

export async function withdrawInterest(formData: FormData) {
  const id = String(formData.get("intent_id"));
  const supabase = await createClient();
  await supabase.from("intents").delete().eq("id", id);
  revalidatePath("/dashboard/applications");
  redirect("/dashboard/applications");
}

export async function refreshMyInstagram(formData: FormData) {
  const id = String(formData.get("account_id"));
  const supabase = await createClient();
  const { data: acc } = await supabase
    .from("social_accounts")
    .select("id, last_fetched_at, talent_id")
    .eq("id", id)
    .maybeSingle();
  const { data: mine } = await supabase.rpc("my_talent_id");
  if (!acc || acc.talent_id !== mine) redirect("/dashboard");
  const recent = acc.last_fetched_at && Date.now() - new Date(acc.last_fetched_at).getTime() < 60 * 60 * 1000;
  if (!recent) await syncInstagramAccount(acc.id);
  revalidatePath("/dashboard");
  redirect(recent ? "/dashboard?refresh=wait" : "/dashboard");
}
