"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncInstagramAccount } from "@/lib/instagram";

export async function expressInterest(formData: FormData) {
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
  if (error && error.code !== "23505") {
    redirect(`/dashboard/briefs/${briefId}?error=${encodeURIComponent("Could not register your interest.")}`);
  }
  revalidatePath("/dashboard/briefs");
  redirect(`/dashboard/briefs/${briefId}?sent=1`);
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
