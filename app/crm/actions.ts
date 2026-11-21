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
/** Turn Postgres / PostgREST errors into something a person can act on. */
const friendly = (m: string) => (/row-level security|permission denied/i.test(m) ? "You don't have permission to do that" : m);
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

/** Content review decision (or plain comment) on the latest version of a deliverable. */
export async function reviewDeliverable(id: string, decision: "approve" | "changes" | "comment", comment?: string, internal = false): Promise<{ ok: boolean; error?: string }> {
  await requireAgency("pipeline.manage");
  if (isDemo()) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_deliverable", { p_id: id, p_decision: decision, p_body: comment ?? "", p_internal: internal });
  if (error) return { ok: false, error: friendly(error.message) };
  revalidatePath("/crm/campaigns", "layout");
  return { ok: true };
}

/** Show or hide a draft in the brand's review room. */
export async function setDeliverableBrandVisible(id: string, visible: boolean): Promise<{ ok: boolean; error?: string }> {
  await requireAgency("pipeline.manage");
  if (isDemo()) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.from("deliverables").update({ brand_visible: visible }).eq("id", id);
  return error ? { ok: false, error: friendly(error.message) } : { ok: true };
}

/** Add an extra deliverable to a booking (e.g. 3 Stories on top of the Reel). */
export async function addDeliverable(formData: FormData) {
  await requireAgency("pipeline.manage");
  const back = backOf(formData, "/crm/campaigns");
  if (isDemo()) redirect(back);
  const supabase = await createClient();
  const { error } = await supabase.from("deliverables").insert({
    intent_id: String(formData.get("intent_id")),
    kind: s(formData, "kind") ?? "Reel",
    title: s(formData, "title"),
    due_date: s(formData, "due_date"),
  });
  revalidatePath(back);
  redirect(error ? `${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent(friendly(error.message))}` : back);
}

/** Agency edits on a deliverable: due date, live link, manual metrics, or marking an event shift done. */
export async function updateDeliverable(formData: FormData) {
  await requireAgency("pipeline.manage");
  const back = backOf(formData, "/crm/campaigns");
  if (isDemo()) redirect(back);
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (formData.has("due_date")) patch.due_date = s(formData, "due_date");
  for (const k of ["views", "likes", "comments"] as const) if (formData.has(k)) patch[k] = n(formData, k);
  if (Object.keys(patch).length) patch.metrics_at = new Date().toISOString();
  let error: { message: string } | null = null;
  if (Object.keys(patch).length) ({ error } = await supabase.from("deliverables").update(patch).eq("id", id));
  const live = s(formData, "live_url");
  if (!error && live) ({ error } = await supabase.rpc("submit_live_link", { p_id: id, p_url: live }));
  if (!error && formData.get("mark_done") === "1") ({ error } = await supabase.from("deliverables").update({ status: "live", posted_at: new Date().toISOString() }).eq("id", id));
  revalidatePath(back);
  redirect(error ? `${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent(friendly(error.message))}` : back);
}

/**
 * Pull views / likes / comments for live Instagram posts. Re-syncs each creator's public profile
 * (Apify, at most every 6 hours) and matches the post's shortcode against their recent posts.
 */
export async function refreshCampaignMetrics(campaignId: string): Promise<{ ok: boolean; updated: number; error?: string }> {
  await requireAgency("pipeline.manage");
  if (isDemo()) return { ok: true, updated: 0 };
  const supabase = await createClient();
  const { data: rows } = await supabase.from("deliverables").select("id, talent_id, live_url").eq("campaign_id", campaignId).eq("status", "live").not("live_url", "is", null);
  let updated = 0;
  const synced = new Set<string>();
  for (const d of rows ?? []) {
    const code = String(d.live_url).match(/instagram\.com\/(?:p|reel|reels|tv)\/([\w-]+)/i)?.[1];
    if (!code) continue;
    const { data: acc } = await supabase.from("social_accounts").select("id, last_fetched_at").eq("talent_id", d.talent_id).eq("platform", "instagram").maybeSingle();
    if (!acc) continue;
    if (!synced.has(acc.id) && (!acc.last_fetched_at || Date.now() - new Date(acc.last_fetched_at).getTime() > 6 * 3600_000)) {
      synced.add(acc.id);
      await syncInstagramAccount(acc.id).catch(() => null);
    }
    const { data: post } = await supabase.from("social_posts").select("likes, comments, views").eq("account_id", acc.id).eq("shortcode", code).maybeSingle();
    if (!post) continue;
    const { error } = await supabase.from("deliverables").update({ views: post.views, likes: post.likes, comments: post.comments, metrics_at: new Date().toISOString() }).eq("id", d.id);
    if (!error) updated++;
  }
  revalidatePath(`/crm/campaigns/${campaignId}`);
  return { ok: true, updated };
}

/** Share every shortlisted-or-later creator on this campaign with the linked brand account. */
export async function shareShortlist(campaignId: string): Promise<{ ok: boolean; shared: number; error?: string }> {
  const agency = await requireAgency("pipeline.manage");
  if (isDemo()) return { ok: true, shared: 3 };
  const supabase = await createClient();
  const { data: c } = await supabase.from("campaigns").select("brand_org_id").eq("id", campaignId).maybeSingle();
  if (!c?.brand_org_id) return { ok: false, shared: 0, error: "Link a brand account in Plan & billing first" };
  const { data: rows } = await supabase
    .from("intents")
    .select("id, quoted_rate, agreed_rate, brand_fee, briefs!inner(campaign_id), talent_profiles(rate_per_post)")
    .eq("briefs.campaign_id", campaignId)
    .is("shared_with_brand_at", null)
    .in("stage", ["shortlisted", "contacted", "negotiating", "confirmed"]);
  const now = new Date().toISOString();
  let shared = 0;
  for (const r of rows ?? []) {
    const t = r.talent_profiles as unknown as { rate_per_post: number | null } | null;
    const { error } = await supabase.from("intents").update({ shared_with_brand_at: now, brand_fee: r.brand_fee ?? r.agreed_rate ?? r.quoted_rate ?? t?.rate_per_post ?? null }).eq("id", r.id);
    if (!error) shared++;
  }
  await supabase.from("usage_events").insert({ org_id: agency.orgId, kind: "shortlist.shared", ref_id: campaignId }).then(() => null, () => null);
  revalidatePath(`/crm/campaigns/${campaignId}`);
  return shared ? { ok: true, shared } : { ok: false, shared: 0, error: "Nothing new to share. Shortlist creators first." };
}

/** Fee the brand sees for one creator (never the creator's own quote). */
export async function setBrandFee(intentId: string, fee: number | null): Promise<{ ok: boolean; error?: string }> {
  await requireAgency("pipeline.manage");
  if (isDemo()) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.from("intents").update({ brand_fee: fee && fee > 0 ? Math.round(fee) : null }).eq("id", intentId);
  return error ? { ok: false, error: friendly(error.message) } : { ok: true };
}

/** Budget, targets, owner and the brand-portal link. */
export async function updateCampaignPlan(formData: FormData) {
  await requireAgency("campaign.manage");
  const id = String(formData.get("id"));
  const back = `/crm/campaigns/${id}?tab=money`;
  if (isDemo()) redirect(`${back}&saved=1`);
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").update({
    budget: n(formData, "budget"), creators_target: n(formData, "creators_target"), go_live: s(formData, "go_live"),
    reach_target: n(formData, "reach_target"), views_target: n(formData, "views_target"), er_target: n(formData, "er_target"),
    owner_id: s(formData, "owner_id"), brand_org_id: s(formData, "brand_org_id"),
    start_date: s(formData, "start_date"), end_date: s(formData, "end_date"),
  }).eq("id", id);
  revalidatePath(`/crm/campaigns/${id}`);
  redirect(`${back}&${error ? `error=${encodeURIComponent(friendly(error.message))}` : "saved=1"}`);
}

/** Finance: TDS, approve, mark paid (with UTR) or failed. DB enforces delivery-before-payout (FN-6). */
export async function updatePayout(formData: FormData) {
  await requireAgency("finance.manage");
  const back = backOf(formData, "/crm/cockpit");
  if (isDemo()) redirect(back);
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (formData.has("tds")) patch.tds = n(formData, "tds") ?? 0;
  if (formData.has("amount")) patch.amount = n(formData, "amount") ?? 0;
  if (formData.has("utr")) patch.utr = s(formData, "utr");
  const status = s(formData, "status");
  if (status && ["pending", "approved", "paid", "failed"].includes(status)) patch.status = status;
  const { error } = await supabase.from("payments").update(patch).eq("id", String(formData.get("id")));
  revalidatePath(back.split("?")[0]);
  redirect(error ? `${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent(friendly(error.message))}` : back);
}

export async function createInvoice(formData: FormData) {
  const agency = await requireAgency("finance.manage");
  const campaignId = String(formData.get("campaign_id"));
  const back = `/crm/campaigns/${campaignId}?tab=money`;
  const amount = n(formData, "amount");
  if (!amount) redirect(`${back}&error=${encodeURIComponent("Enter the invoice amount before GST")}`);
  if (isDemo()) redirect(`${back}&saved=1`);
  const supabase = await createClient();
  const year = new Date().getFullYear();
  const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true }).eq("org_id", agency.orgId).like("number", `VIG-${year}-%`);
  const user = await getUser();
  const { error } = await supabase.from("invoices").insert({
    campaign_id: campaignId, org_id: agency.orgId, number: `VIG-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`,
    label: s(formData, "label"), amount, gst_pct: n(formData, "gst_pct") ?? 18, due_date: s(formData, "due_date"),
    status: formData.get("send") === "1" ? "sent" : "draft", created_by: user!.id,
  });
  revalidatePath(`/crm/campaigns/${campaignId}`);
  redirect(`${back}&${error ? `error=${encodeURIComponent(friendly(error.message))}` : "saved=1"}`);
}

export async function setInvoiceStatus(formData: FormData) {
  await requireAgency("finance.manage");
  const back = backOf(formData, "/crm/cockpit");
  if (isDemo()) redirect(back);
  const status = String(formData.get("status"));
  if (!["draft", "sent", "paid", "void"].includes(status)) redirect(back);
  const supabase = await createClient();
  await supabase.from("invoices").update({ status }).eq("id", String(formData.get("id")));
  revalidatePath(back.split("?")[0]);
  redirect(back);
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
