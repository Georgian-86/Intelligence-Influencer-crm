"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, requirePlatform } from "@/lib/session";
import { isDemo } from "@/lib/demo";
import { RANKS, TALENT_STATUSES } from "@/lib/constants";
import { syncInstagramAccount } from "@/lib/instagram";
import { attachMember, slugify } from "@/lib/invite";

const demoNote = (msg: string) => `demo=${encodeURIComponent(msg)}`;

/** Full review from the talent detail page. */
export async function reviewTalent(formData: FormData) {
  await requirePlatform("talent.approve");
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const rank = String(formData.get("rank"));
  if (isDemo()) redirect(`/admin/talent/${id}?${demoNote(`Review saved as ${status}, ${rank}. Demo mode, so nothing was written.`)}`);
  const user = await getUser();
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

/** One-click approve / reject + rank from the screening queue. */
export async function quickReview(formData: FormData) {
  await requirePlatform("talent.approve");
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "Creator");
  const status = String(formData.get("status"));
  const rank = String(formData.get("rank"));
  const back = String(formData.get("back") || "/admin");
  const sep = back.includes("?") ? "&" : "?";
  if (!["approved", "rejected", "screening"].includes(status)) redirect(`${back}${sep}error=${encodeURIComponent("Unknown decision")}`);
  const verb = status === "approved" ? `approved as ${rank}` : status === "rejected" ? "rejected" : "moved to screening";
  if (isDemo()) redirect(`${back}${sep}${demoNote(`${name} ${verb}. Demo mode, so nothing was written.`)}`);
  const user = await getUser();
  const patch: Record<string, unknown> = { status, reviewed_by: user!.id, reviewed_at: new Date().toISOString() };
  if ((RANKS as readonly string[]).includes(rank)) patch.rank = rank;
  const supabase = await createClient();
  const { error } = await supabase.from("talent_profiles").update(patch).eq("id", id);
  revalidatePath("/admin");
  redirect(`${back}${sep}${error ? `error=${encodeURIComponent(error.message)}` : `done=${encodeURIComponent(`${name} ${verb}.`)}`}`);
}

export async function adminRefreshInstagram(formData: FormData) {
  await requirePlatform("talent.view");
  const back = String(formData.get("back"));
  if (isDemo()) redirect(`${back}?${demoNote("Instagram refetch queued. Demo data doesn't change.")}`);
  await syncInstagramAccount(String(formData.get("account_id")));
  revalidatePath(back);
  redirect(back);
}

export async function addMember(formData: FormData) {
  await requirePlatform("member.manage");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const orgId = String(formData.get("org_id"));
  const role = String(formData.get("role"));
  if (!email) redirect(`/admin/team?error=${encodeURIComponent("Enter an email address.")}`);
  if (isDemo()) redirect(`/admin/team?${demoNote(`Invite to ${email} would be sent. Demo mode, so nothing was written.`)}`);
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("type").eq("id", orgId).maybeSingle();
  const home = org?.type === "brand" ? "/brand" : org?.type === "platform" ? "/admin" : "/crm";
  const res = await attachMember(supabase, email, orgId, role, home);
  revalidatePath("/admin/team");
  redirect(`/admin/team?${res.ok ? (res.invited ? `done=${encodeURIComponent(`Invite sent to ${email}.`)}` : "saved=1") : `error=${encodeURIComponent(res.error)}`}`);
}

/** Create a brand workspace, optionally with its first admin. */
export async function createBrandOrg(formData: FormData) {
  await requirePlatform("org.manage");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!name) redirect(`/admin/brands?error=${encodeURIComponent("Enter the brand's name.")}`);
  if (isDemo()) redirect(`/admin/brands?${demoNote(`${name} would be created${email ? ` and ${email} invited` : ""}. Demo mode, so nothing was written.`)}`);
  const supabase = await createClient();
  const base = slugify(name);
  const { data: taken } = await supabase.from("organizations").select("slug").like("slug", `${base}%`);
  const slugs = new Set((taken ?? []).map((t) => t.slug));
  let slug = base;
  for (let i = 2; slugs.has(slug); i++) slug = `${base}-${i}`;
  const { data: org, error } = await supabase.from("organizations").insert({ name, slug, type: "brand" }).select("id").single();
  if (error || !org) redirect(`/admin/brands?error=${encodeURIComponent(error?.message ?? "Could not create the brand.")}`);
  let note = `${name} created. Link it to a campaign from the campaign's Plan & billing tab.`;
  if (email) {
    const res = await attachMember(supabase, email, org.id, "brand_admin", "/brand");
    note = res.ok ? `${name} created and ${email} ${res.invited ? "invited" : "added as brand admin"}.` : `${name} created, but ${res.error}`;
    if (!res.ok) { revalidatePath("/admin/brands"); redirect(`/admin/brands?error=${encodeURIComponent(note)}`); }
  }
  revalidatePath("/admin/brands");
  redirect(`/admin/brands?done=${encodeURIComponent(note)}`);
}

export async function inviteBrandUser(formData: FormData) {
  await requirePlatform("member.manage");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const orgId = String(formData.get("org_id"));
  const role = String(formData.get("role")) === "brand_member" ? "brand_member" : "brand_admin";
  if (!email) redirect(`/admin/brands?error=${encodeURIComponent("Enter an email address.")}`);
  if (isDemo()) redirect(`/admin/brands?${demoNote(`Invite to ${email} would be sent. Demo mode, so nothing was written.`)}`);
  const supabase = await createClient();
  const res = await attachMember(supabase, email, orgId, role, "/brand");
  revalidatePath("/admin/brands");
  redirect(`/admin/brands?${res.ok ? `done=${encodeURIComponent(res.invited ? `Invite sent to ${email}.` : `${email} added.`)}` : `error=${encodeURIComponent(res.error)}`}`);
}

export async function removeMember(formData: FormData) {
  await requirePlatform("member.manage");
  if (isDemo()) redirect(`/admin/team?${demoNote("Member would be removed. Demo mode, so nothing was written.")}`);
  const supabase = await createClient();
  await supabase.from("memberships").delete().eq("user_id", String(formData.get("user_id"))).eq("org_id", String(formData.get("org_id")));
  revalidatePath("/admin/team");
}
