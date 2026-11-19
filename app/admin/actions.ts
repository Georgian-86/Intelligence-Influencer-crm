"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, requirePlatform } from "@/lib/session";
import { RANKS, TALENT_STATUSES } from "@/lib/constants";
import { syncInstagramAccount } from "@/lib/instagram";

export async function reviewTalent(formData: FormData) {
  await requirePlatform("talent.approve");
  const user = await getUser();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const rank = String(formData.get("rank"));
  const num = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : Number(v);
  };
  const patch: Record<string, unknown> = {
    review_notes: String(formData.get("review_notes") ?? "").trim() || null,
    reviewed_by: user!.id,
    reviewed_at: new Date().toISOString(),
    rating: num("rating"),
    reliability_score: num("reliability_score"),
  };
  if ((TALENT_STATUSES as readonly string[]).includes(status)) patch.status = status;
  if ((RANKS as readonly string[]).includes(rank)) patch.rank = rank;
  const supabase = await createClient();
  const { error } = await supabase.from("talent_profiles").update(patch).eq("id", id);
  revalidatePath("/admin");
  redirect(`/admin/talent/${id}?${error ? `error=${encodeURIComponent(error.message)}` : "saved=1"}`);
}

export async function adminRefreshInstagram(formData: FormData) {
  await requirePlatform("talent.view");
  const id = String(formData.get("account_id"));
  const back = String(formData.get("back"));
  await syncInstagramAccount(id);
  revalidatePath(back);
  redirect(back);
}

export async function addMember(formData: FormData) {
  await requirePlatform("member.manage");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const orgId = String(formData.get("org_id"));
  const role = String(formData.get("role"));
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!profile) redirect(`/admin/team?error=${encodeURIComponent(`No account found for ${email}. Ask them to sign up first.`)}`);
  const { error } = await supabase.from("memberships").upsert({ user_id: profile.id, org_id: orgId, role }, { onConflict: "user_id,org_id" });
  redirect(`/admin/team?${error ? `error=${encodeURIComponent(error.message)}` : "saved=1"}`);
}

/**
 * Fast triage from the screening queue: changes status and/or rank only (keeps notes, rating and
 * reliability untouched, unlike the full review form) and returns to the list.
 */
export async function quickReview(formData: FormData) {
  await requirePlatform("talent.approve");
  const user = await getUser();
  const id = String(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  const rank = String(formData.get("rank") ?? "");
  const rawBack = String(formData.get("back") ?? "/admin");
  const back = rawBack.startsWith("/admin") ? rawBack : "/admin";
  const patch: Record<string, unknown> = { reviewed_by: user!.id, reviewed_at: new Date().toISOString() };
  if ((TALENT_STATUSES as readonly string[]).includes(status)) patch.status = status;
  if ((RANKS as readonly string[]).includes(rank)) patch.rank = rank;
  const supabase = await createClient();
  const { error } = await supabase.from("talent_profiles").update(patch).eq("id", id);
  revalidatePath("/admin");
  const sep = back.includes("?") ? "&" : "?";
  redirect(error ? `${back}${sep}error=${encodeURIComponent(error.message)}` : back);
}

export async function removeMember(formData: FormData) {
  await requirePlatform("member.manage");
  const supabase = await createClient();
  await supabase.from("memberships").delete().eq("user_id", String(formData.get("user_id"))).eq("org_id", String(formData.get("org_id")));
  revalidatePath("/admin/team");
}
