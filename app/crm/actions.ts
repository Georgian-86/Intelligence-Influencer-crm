"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAgency, getUser, can } from "@/lib/session";
import { syncInstagramAccount } from "@/lib/instagram";
import { STAGES } from "@/lib/constants";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim() || null;
const n = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").replace(/[^\d.]/g, "");
  return v ? Number(v) : null;
};
const list = (f: FormData, k: string) => f.getAll(k).map(String).filter(Boolean);

export async function createCampaign(formData: FormData) {
  const agency = await requireAgency("campaign.manage");
  const user = await getUser();
  const supabase = await createClient();
  const name = s(formData, "name");
  if (!name) redirect("/crm/campaigns?error=Name%20is%20required");
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      org_id: agency.orgId,
      name,
      brand_name: s(formData, "brand_name"),
      description: s(formData, "description"),
      start_date: s(formData, "start_date"),
      end_date: s(formData, "end_date"),
      created_by: user!.id,
    })
    .select("id")
    .single();
  if (error) redirect(`/crm/campaigns?error=${encodeURIComponent(error.message)}`);
  redirect(`/crm/campaigns/${data.id}`);
}

export async function setCampaignStatus(formData: FormData) {
  await requireAgency("campaign.manage");
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("campaigns").update({ status: String(formData.get("status")) }).eq("id", id);
  revalidatePath(`/crm/campaigns/${id}`);
}

export async function createBrief(formData: FormData) {
  await requireAgency("brief.manage");
  const user = await getUser();
  const supabase = await createClient();
  const campaignId = String(formData.get("campaign_id"));
  const title = s(formData, "title");
  if (!title) redirect(`/crm/briefs/new?campaign=${campaignId}&error=Title%20is%20required`);
  const { data, error } = await supabase
    .from("briefs")
    .insert({
      campaign_id: campaignId,
      title,
      description: s(formData, "description"),
      brand_display: s(formData, "brand_display"),
      talent_kind: s(formData, "talent_kind") ?? "influencer",
      categories: list(formData, "categories"),
      cities: list(formData, "cities"),
      ranks: list(formData, "ranks"),
      min_followers: n(formData, "min_followers"),
      max_followers: n(formData, "max_followers"),
      min_engagement: n(formData, "min_engagement"),
      deliverables: s(formData, "deliverables"),
      budget_min: n(formData, "budget_min"),
      budget_max: n(formData, "budget_max"),
      event_date: s(formData, "event_date"),
      apply_by: s(formData, "apply_by"),
      status: formData.get("publish") === "1" ? "open" : "draft",
      created_by: user!.id,
    })
    .select("id")
    .single();
  if (error) redirect(`/crm/briefs/new?campaign=${campaignId}&error=${encodeURIComponent(error.message)}`);
  redirect(`/crm/briefs/${data.id}`);
}

export async function setBriefStatus(formData: FormData) {
  await requireAgency("brief.manage");
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("briefs").update({ status: String(formData.get("status")) }).eq("id", id);
  revalidatePath(`/crm/briefs/${id}`);
}

export async function updateIntent(formData: FormData) {
  await requireAgency("pipeline.manage");
  const id = String(formData.get("id"));
  const stage = String(formData.get("stage") ?? "");
  const patch: Record<string, unknown> = {};
  if ((STAGES as readonly string[]).includes(stage)) patch.stage = stage;
  if (formData.has("agreed_rate")) patch.agreed_rate = n(formData, "agreed_rate");
  if (formData.has("rating")) patch.rating = n(formData, "rating");
  const supabase = await createClient();
  await supabase.from("intents").update(patch).eq("id", id);
  const back = String(formData.get("back") ?? "/crm");
  revalidatePath(back);
  redirect(back);
}

export async function inviteTalent(formData: FormData) {
  await requireAgency("pipeline.manage");
  const briefId = String(formData.get("brief_id"));
  const talentIds = formData.getAll("talent_id").map(String);
  const supabase = await createClient();
  if (talentIds.length) {
    await supabase
      .from("intents")
      .upsert(
        talentIds.map((t) => ({ brief_id: briefId, talent_id: t, source: "invited", stage: "shortlisted" })),
        { onConflict: "brief_id,talent_id", ignoreDuplicates: true },
      );
  }
  const back = String(formData.get("back") ?? `/crm/briefs/${briefId}`);
  revalidatePath(back);
  redirect(back);
}

export async function addNote(formData: FormData) {
  const agency = await requireAgency("note.write");
  const user = await getUser();
  const talentId = String(formData.get("talent_id"));
  const body = s(formData, "body");
  if (body) {
    const supabase = await createClient();
    await supabase.from("notes").insert({ org_id: agency.orgId, talent_id: talentId, body, author_id: user!.id });
  }
  revalidatePath(`/crm/talent/${talentId}`);
  redirect(`/crm/talent/${talentId}`);
}

export async function setEnquiryStatus(formData: FormData) {
  await requireAgency("enquiry.view");
  const supabase = await createClient();
  await supabase.from("brand_enquiries").update({ status: String(formData.get("status")) }).eq("id", String(formData.get("id")));
  revalidatePath("/crm/enquiries");
}

export async function refreshInstagram(formData: FormData) {
  const agency = await requireAgency();
  if (!can(agency, "talent.view")) redirect("/crm");
  const id = String(formData.get("account_id"));
  const back = String(formData.get("back") ?? "/crm/talent");
  const supabase = await createClient();
  const { data: acc } = await supabase.from("social_accounts").select("id, last_fetched_at").eq("id", id).maybeSingle();
  if (acc && (!acc.last_fetched_at || Date.now() - new Date(acc.last_fetched_at).getTime() > 10 * 60 * 1000)) {
    await syncInstagramAccount(acc.id);
  }
  revalidatePath(back);
  redirect(back);
}
