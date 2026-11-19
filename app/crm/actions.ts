"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAgency, getUser, can } from "@/lib/session";
import { isDemo } from "@/lib/demo";
import { syncInstagramAccount } from "@/lib/instagram";
import { STAGES } from "@/lib/constants";
import { parseBrief, type ParsedBrief } from "@/components/crm/brief-parser";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim() || null;
const n = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").replace(/[^\d.]/g, "");
  return v ? Number(v) : null;
};
const list = (f: FormData, k: string) => f.getAll(k).map(String).filter(Boolean);
const backOf = (f: FormData, fallback: string) => {
  const b = String(f.get("back") ?? "");
  return b.startsWith("/crm") ? b : fallback;
};

/* Demo mode has no database: every mutation succeeds without persisting, and the UI keeps the
   change in local state. Live mode runs the real Supabase writes below (RLS-scoped). */

export async function createCampaign(formData: FormData) {
  const agency = await requireAgency("campaign.manage");
  if (isDemo()) redirect("/crm/campaigns/k1?created=1");
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
  if (isDemo()) return revalidatePath(`/crm/campaigns/${id}`);
  const supabase = await createClient();
  await supabase.from("campaigns").update({ status: String(formData.get("status")) }).eq("id", id);
  revalidatePath(`/crm/campaigns/${id}`);
}

export async function createBrief(formData: FormData) {
  await requireAgency("brief.manage");
  const campaignId = String(formData.get("campaign_id") ?? "");
  const title = s(formData, "title");
  if (!title) redirect(`/crm/briefs/new?campaign=${campaignId}&error=Title%20is%20required`);
  if (isDemo()) redirect(`/crm/briefs/b1?created=1`);
  const user = await getUser();
  const supabase = await createClient();
  const cats = list(formData, "categories");
  const { data, error } = await supabase
    .from("briefs")
    .insert({
      campaign_id: campaignId,
      title,
      description: s(formData, "description"),
      brand_display: s(formData, "brand_display"),
      talent_kind: s(formData, "talent_kind") ?? "influencer",
      // Campus-only is stored as the "Student / Campus" category until briefs get a dedicated column.
      categories: formData.get("colleges_only") === "1" && !cats.includes("Student / Campus") ? [...cats, "Student / Campus"] : cats,
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

/**
 * Turn a pasted brand email / WhatsApp message into brief fields.
 * TODO(llm): in live mode call the LLM extractor here (structured output matching ParsedBrief,
 * with the deterministic parser as fallback when the call fails or times out).
 */
export async function extractBrief(text: string): Promise<ParsedBrief> {
  await requireAgency("brief.manage");
  return parseBrief(text.slice(0, 6000), isDemo() ? Date.UTC(2026, 10, 19) : Date.now());
}

export async function setBriefStatus(formData: FormData) {
  await requireAgency("brief.manage");
  const id = String(formData.get("id"));
  if (isDemo()) return revalidatePath(`/crm/briefs/${id}`);
  const supabase = await createClient();
  await supabase.from("briefs").update({ status: String(formData.get("status")) }).eq("id", id);
  revalidatePath(`/crm/briefs/${id}`);
}

export async function updateIntent(formData: FormData) {
  await requireAgency("pipeline.manage");
  const back = backOf(formData, "/crm");
  if (isDemo()) redirect(back);
  const id = String(formData.get("id"));
  const stage = String(formData.get("stage") ?? "");
  const patch: Record<string, unknown> = {};
  if ((STAGES as readonly string[]).includes(stage)) patch.stage = stage;
  if (formData.has("agreed_rate")) patch.agreed_rate = n(formData, "agreed_rate");
  if (formData.has("rating")) patch.rating = n(formData, "rating");
  const supabase = await createClient();
  await supabase.from("intents").update(patch).eq("id", id);
  revalidatePath(back);
  redirect(back);
}

/** Kanban move (no redirect — called from the client board). */
export async function moveIntent(id: string, stage: string): Promise<{ ok: boolean; error?: string }> {
  await requireAgency("pipeline.manage");
  if (!(STAGES as readonly string[]).includes(stage)) return { ok: false, error: "Unknown stage" };
  if (isDemo()) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.from("intents").update({ stage, updated_at: new Date().toISOString() }).eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function inviteTalent(formData: FormData) {
  await requireAgency("pipeline.manage");
  const briefId = String(formData.get("brief_id"));
  const talentIds = formData.getAll("talent_id").map(String);
  const back = backOf(formData, `/crm/briefs/${briefId}`);
  if (isDemo()) redirect(back);
  const supabase = await createClient();
  if (talentIds.length) {
    await supabase
      .from("intents")
      .upsert(
        talentIds.map((t) => ({ brief_id: briefId, talent_id: t, source: "invited", stage: "shortlisted" })),
        { onConflict: "brief_id,talent_id", ignoreDuplicates: true },
      );
  }
  revalidatePath(back);
  redirect(back);
}

/** Bulk "Add to brief" from talent search (client). */
export async function addTalentToBrief(briefId: string, talentIds: string[]): Promise<{ ok: boolean; added: number; error?: string }> {
  await requireAgency("pipeline.manage");
  if (!briefId || !talentIds.length) return { ok: false, added: 0, error: "Pick a brief and at least one creator" };
  if (isDemo()) return { ok: true, added: talentIds.length };
  const supabase = await createClient();
  const { error } = await supabase
    .from("intents")
    .upsert(talentIds.map((t) => ({ brief_id: briefId, talent_id: t, source: "invited", stage: "shortlisted" })), { onConflict: "brief_id,talent_id", ignoreDuplicates: true });
  revalidatePath(`/crm/briefs/${briefId}`);
  return error ? { ok: false, added: 0, error: error.message } : { ok: true, added: talentIds.length };
}

export async function addNote(formData: FormData) {
  const agency = await requireAgency("note.write");
  const talentId = String(formData.get("talent_id"));
  if (isDemo()) redirect(`/crm/talent/${talentId}`);
  const user = await getUser();
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
  if (isDemo()) return revalidatePath("/crm/enquiries");
  const supabase = await createClient();
  await supabase.from("brand_enquiries").update({ status: String(formData.get("status")) }).eq("id", String(formData.get("id")));
  revalidatePath("/crm/enquiries");
}

export async function moveEnquiry(id: string, status: string): Promise<{ ok: boolean }> {
  await requireAgency("enquiry.view");
  if (!["new", "in_progress", "converted", "closed"].includes(status)) return { ok: false };
  if (isDemo()) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.from("brand_enquiries").update({ status }).eq("id", id);
  revalidatePath("/crm/enquiries");
  return { ok: !error };
}

/** Creates a planning campaign from an enquiry and marks the enquiry converted. */
export async function convertEnquiry(id: string): Promise<{ ok: boolean; campaignId?: string; error?: string }> {
  const agency = await requireAgency("campaign.manage");
  if (isDemo()) return { ok: true, campaignId: "k3" };
  const user = await getUser();
  const supabase = await createClient();
  const { data: e } = await supabase.from("brand_enquiries").select("id, company, requirement").eq("id", id).maybeSingle();
  if (!e) return { ok: false, error: "Enquiry not found" };
  const { data, error } = await supabase
    .from("campaigns")
    .insert({ org_id: agency.orgId, name: `${e.company} campaign`, brand_name: e.company, description: e.requirement, created_by: user!.id })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await supabase.from("brand_enquiries").update({ status: "converted" }).eq("id", id);
  revalidatePath("/crm/enquiries");
  return { ok: true, campaignId: data.id };
}

/**
 * Content review decision on a deliverable version.
 * TODO(deliverables): live mode needs the `deliverables` + `deliverable_versions` tables (v2.1).
 */
export async function reviewDeliverable(id: string, decision: "approve" | "changes", comment?: string): Promise<{ ok: boolean; error?: string }> {
  await requireAgency("pipeline.manage");
  if (isDemo()) return { ok: true };
  void id; void decision; void comment;
  return { ok: false, error: "Content review needs the deliverables tables (ships in v2.1)" };
}

/**
 * WhatsApp broadcast of a brief to matched creators.
 * TODO(whatsapp): send through the Meta Cloud API / BSP with the approved "brief_match" marketing
 * template, record opt-ins and usage_events (kind "wa.broadcast") for billing.
 */
export async function sendBroadcast(briefId: string, talentIds: string[]): Promise<{ ok: boolean; queued: number; error?: string }> {
  const agency = await requireAgency("pipeline.manage");
  if (isDemo()) return { ok: true, queued: talentIds.length };
  const supabase = await createClient();
  await supabase.from("usage_events").insert({ org_id: agency.orgId, kind: "wa.broadcast", ref_id: briefId }).then(() => null, () => null);
  return { ok: false, queued: 0, error: "WhatsApp sending isn't connected yet — templates are pending Meta approval" };
}

export async function refreshInstagram(formData: FormData) {
  const agency = await requireAgency();
  if (!can(agency, "talent.view")) redirect("/crm");
  const back = backOf(formData, "/crm/talent");
  if (isDemo()) redirect(back);
  const id = String(formData.get("account_id"));
  const supabase = await createClient();
  const { data: acc } = await supabase.from("social_accounts").select("id, last_fetched_at").eq("id", id).maybeSingle();
  if (acc && (!acc.last_fetched_at || Date.now() - new Date(acc.last_fetched_at).getTime() > 10 * 60 * 1000)) {
    await syncInstagramAccount(acc.id);
  }
  revalidatePath(back);
  redirect(back);
}
