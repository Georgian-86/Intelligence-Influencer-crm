import "server-only";
/**
 * CRM data layer. Every loader returns the same view-model in demo mode (fixtures) and live
 * mode (Supabase), so pages and client components never branch on the data source.
 */
import { cache } from "react";
import { isDemo } from "@/lib/demo";
import { BRIEFS, CAMPAIGNS, CREATORS, DELIVERABLES, TEAM, getCreator, type DemoCreator } from "@/lib/demo/fixtures";
import {
  ACTIVITY_FEED, ALL_ENQUIRIES, DEMO_NOW, ENQUIRY_DETAILS, HEALTH_REASON, KPI_SERIES, availabilityOf, cityReach, dailyViews,
  deliverableDue, notesFor, pipelineFor, submissionsFor, todayQueue, type QueueItem, type Submission,
} from "@/lib/demo/crm";
import { createClient } from "@/lib/supabase/server";
import { searchPool, type PoolRow } from "@/lib/pool";
import { imgSrc } from "@/components/ui";
import { matchScore } from "@/components/crm/match-score";
import type { BrandDecision, BriefCriteriaVM, CampaignVM, DeliverableRow, EnquiryVM, Health, PipelineCard, PipelineStage, TalentRow } from "@/components/crm/types";
import { liveDeliverables, liveReport, liveSubmissions } from "./execution";

export const crmNow = () => (isDemo() ? DEMO_NOW : Date.now());

const hashHue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 360;
const BOARD: PipelineStage[] = ["interested", "shortlisted", "contacted", "negotiating", "confirmed", "delivered"];

/* ---------------- talent ---------------- */
export function demoRow(c: DemoCreator): TalentRow {
  return {
    id: c.id, name: c.display_name, handle: c.handle, photo: null, hue: c.hue, city: c.city, college: c.college_name, campus: c.in_college,
    followers: c.followers, er: c.engagement_rate, avgViews: c.avg_views, avgLikes: c.avg_likes, rank: c.rank, rate: c.rate_per_post,
    verified: c.verified_insights, availability: availabilityOf(c.id), categories: c.categories, influencer: c.is_influencer, event: c.is_event_talent,
    growth: c.growth, rating: c.rating,
  };
}

function liveRow(r: PoolRow): TalentRow {
  return {
    id: r.id, name: r.display_name, handle: r.ig?.handle ?? null, photo: r.ig?.profile_pic_url ? imgSrc(r.ig.profile_pic_url) : null, hue: hashHue(r.id),
    city: r.city, college: null, campus: r.categories.includes("Student / Campus"), followers: r.ig?.followers ?? null, er: r.ig?.engagement_rate ?? null,
    avgViews: null, avgLikes: r.ig?.avg_likes ?? null, rank: r.rank, rate: r.rate_per_post, verified: false, availability: "available",
    categories: r.categories, influencer: r.is_influencer, event: r.is_event_talent, growth: [], rating: r.rating,
  };
}

export const listTalent = cache(async (): Promise<TalentRow[]> => {
  if (isDemo()) return CREATORS.filter((c) => c.status === "approved").map(demoRow);
  return (await searchPool({ sort: "followers" }, 1000)).map(liveRow);
});

function demoBriefVM(b: (typeof BRIEFS)[number]): BriefCriteriaVM {
  return { id: b.id, title: b.title, brand: b.brand_display, talent_kind: b.talent_kind, categories: b.categories, cities: b.cities, colleges_only: b.colleges_only, min_followers: b.min_followers, max_followers: b.max_followers, min_engagement: b.min_engagement, ranks: [] };
}

type LiveBrief = { id: string; title: string; brand_display: string | null; talent_kind: string; categories: string[]; cities: string[]; min_followers: number | null; max_followers: number | null; min_engagement: number | null; ranks: string[] };
const liveBriefVM = (b: LiveBrief): BriefCriteriaVM => ({ id: b.id, title: b.title, brand: b.brand_display ?? "Confidential brand", talent_kind: b.talent_kind, categories: b.categories ?? [], cities: b.cities ?? [], colleges_only: false, min_followers: b.min_followers, max_followers: b.max_followers, min_engagement: b.min_engagement != null ? Number(b.min_engagement) : null, ranks: b.ranks ?? [] });

/** Briefs that talent can be added to / matched against. */
export const listOpenBriefs = cache(async (orgId: string): Promise<BriefCriteriaVM[]> => {
  if (isDemo()) return BRIEFS.filter((b) => b.status === "open").map(demoBriefVM);
  const supabase = await createClient();
  const { data } = await supabase.from("briefs").select("id, title, brand_display, talent_kind, categories, cities, min_followers, max_followers, min_engagement, ranks").eq("org_id", orgId).in("status", ["draft", "open"]).order("created_at", { ascending: false });
  return ((data ?? []) as LiveBrief[]).map(liveBriefVM);
});

export type TalentDetail = {
  row: TalentRow; bio: string | null; languages: string[]; skills: string[]; gender: string | null; status: string; reliability: number | null;
  rateDay: number | null; following: number | null; posts: number | null; igId: string | null; igUrl: string | null; lastFetched: string | null;
  audience: { age_18_24: number; female: number; top_cities: { city: string; pct: number }[] } | null;
  content: { id: string; type: string; likes: number | null; comments: number | null; views: number | null; hue: number; thumb: string | null; url: string | null; caption: string | null }[];
  history: { id: string; brief: string; briefId: string; campaign: string; stage: string; agreed: number | null; quoted: number | null; at: string }[];
  notes: { id: string; body: string; author: string; at: string }[];
  contact: { email: string | null; phone: string | null; whatsapp: string | null } | null;
};

export async function getTalentDetail(id: string, orgId: string): Promise<TalentDetail | null> {
  if (isDemo()) {
    const c = getCreator(id);
    if (!c) return null;
    const pipe = pipelineFor(BRIEFS.map((b) => b.id)).filter((i) => i.creator_id === c.id);
    const history = pipe.map((i) => {
      const b = BRIEFS.find((x) => x.id === i.brief_id)!;
      return { id: i.id, brief: b.title, briefId: b.id, campaign: CAMPAIGNS.find((k) => k.id === b.campaign_id)?.name ?? "", stage: i.stage, agreed: i.agreed_rate, quoted: i.quoted_rate, at: i.updated_at };
    });
    return {
      row: demoRow(c), bio: c.bio, languages: c.languages, skills: c.skills, gender: c.gender, status: c.status, reliability: c.reliability_score,
      rateDay: c.rate_full_day, following: c.following, posts: c.posts_count, igId: null, igUrl: `https://instagram.com/${c.handle}`, lastFetched: c.last_fetched_at,
      audience: c.audience,
      content: c.posts.map((p) => ({ id: p.id, type: p.type, likes: p.likes, comments: p.comments, views: p.views, hue: p.hue, thumb: null, url: null, caption: p.caption })),
      history, notes: notesFor(c),
      contact: history.length ? { email: c.email, phone: c.phone, whatsapp: c.phone } : null,
    };
  }
  const supabase = await createClient();
  const { data: t } = await supabase.from("talent_profiles").select("*").eq("id", id).maybeSingle();
  if (!t) return null;
  const [{ data: ig }, { data: contact }, { data: notes }, { data: intents }] = await Promise.all([
    supabase.from("social_accounts").select("*").eq("talent_id", id).eq("platform", "instagram").maybeSingle(),
    supabase.from("talent_contacts").select("*").eq("talent_id", id).maybeSingle(),
    supabase.from("notes").select("id, body, created_at, profiles(full_name, email)").eq("talent_id", id).eq("org_id", orgId).order("created_at", { ascending: false }),
    supabase.from("intents").select("id, stage, quoted_rate, agreed_rate, updated_at, briefs(id, title, campaigns(name))").eq("talent_id", id).eq("org_id", orgId).order("updated_at", { ascending: false }),
  ]);
  const { data: posts } = ig ? await supabase.from("social_posts").select("*").eq("account_id", ig.id).order("posted_at", { ascending: false }).limit(9) : { data: [] };
  const hue = hashHue(t.id);
  return {
    row: {
      id: t.id, name: t.display_name, handle: ig?.handle ?? null, photo: ig?.profile_pic_url ? imgSrc(ig.profile_pic_url) : t.photo_url, hue, city: t.city, college: null,
      campus: (t.categories ?? []).includes("Student / Campus"), followers: ig?.followers ?? null, er: ig?.engagement_rate != null ? Number(ig.engagement_rate) : null,
      avgViews: ig?.avg_views != null ? Number(ig.avg_views) : null, avgLikes: ig?.avg_likes != null ? Number(ig.avg_likes) : null, rank: t.rank, rate: t.rate_per_post,
      verified: !!ig?.is_verified, availability: "available", categories: t.categories ?? [], influencer: t.is_influencer, event: t.is_event_talent, growth: [], rating: t.rating,
    },
    bio: t.bio ?? ig?.biography ?? null, languages: t.languages ?? [], skills: t.skills ?? [], gender: t.gender, status: t.status, reliability: t.reliability_score,
    rateDay: t.rate_full_day, following: ig?.following ?? null, posts: ig?.posts_count ?? null, igId: ig?.id ?? null, igUrl: ig?.url ?? (ig ? `https://instagram.com/${ig.handle}` : null), lastFetched: ig?.last_fetched_at ?? null,
    audience: null,
    content: (posts ?? []).map((p, k) => ({ id: p.id, type: p.post_type ?? "post", likes: p.likes, comments: p.comments, views: p.views, hue: (hue + k * 23) % 360, thumb: p.thumbnail_url ? imgSrc(p.thumbnail_url) : null, url: p.url, caption: p.caption })),
    history: (intents ?? []).map((i) => {
      const b = i.briefs as unknown as { id: string; title: string; campaigns: { name: string } | null } | null;
      return { id: i.id, brief: b?.title ?? "", briefId: b?.id ?? "", campaign: b?.campaigns?.name ?? "", stage: i.stage, agreed: i.agreed_rate, quoted: i.quoted_rate, at: i.updated_at };
    }),
    notes: (notes ?? []).map((n) => {
      const a = n.profiles as unknown as { full_name: string | null; email: string } | null;
      return { id: n.id, body: n.body, author: a?.full_name ?? a?.email ?? "Teammate", at: n.created_at };
    }),
    contact: contact ? { email: contact.email, phone: contact.phone, whatsapp: contact.whatsapp ?? null } : null,
  };
}

/* ---------------- campaigns ---------------- */
function demoCampaignVM(c: (typeof CAMPAIGNS)[number]): CampaignVM {
  return {
    id: c.id, name: c.name, brand: c.brand_name, status: c.status, start: c.start_date, end: c.end_date, budget: c.budget, spent: c.spent, owner: c.owner,
    confirmed: c.creators_confirmed, target: c.creators_target, live: c.deliverables_live, deliverables: c.deliverables_total, reach: c.reach, views: c.views, er: c.er,
    cities: c.cities, hue: c.hue, health: c.status === "completed" ? "on_track" : c.health, reason: HEALTH_REASON[c.id] ?? "", briefs: BRIEFS.filter((b) => b.campaign_id === c.id).length,
  };
}

type LiveCampaign = {
  id: string; name: string; brand_name: string | null; status: string; start_date: string | null; end_date: string | null; description?: string | null;
  budget: number | null; creators_target: number | null; go_live: string | null; reach_target: number | null; views_target: number | null; er_target: number | null;
  owner_id: string | null; brand_org_id: string | null;
  owner: { full_name: string | null; email: string | null } | null;
  brand_org: { name: string } | null;
  briefs: { id: string; status: string; budget_max: number | null; cities: string[]; intents: { stage: string; agreed_rate: number | null; deliverable_links: string[] }[] }[];
  deliverables: { status: string; views: number | null; likes: number | null; comments: number | null }[];
};

function liveCampaignVM(c: LiveCampaign, now: number): CampaignVM {
  const intents = (c.briefs ?? []).flatMap((b) => b.intents ?? []);
  const booked = intents.filter((i) => i.stage === "confirmed" || i.stage === "delivered");
  const spent = booked.reduce((s, i) => s + (i.agreed_rate ?? 0), 0);
  const dels = c.deliverables ?? [];
  const liveDels = dels.filter((d) => d.status === "live");
  const live = liveDels.length;
  const views = liveDels.reduce((s, d) => s + (d.views ?? 0), 0);
  const eng = liveDels.reduce((s, d) => s + (d.likes ?? 0) + (d.comments ?? 0), 0);
  const overdueEnd = c.status === "active" && c.end_date && new Date(c.end_date).getTime() < now;
  const health: Health = overdueEnd ? "blocked" : c.status === "active" && booked.length === 0 ? "at_risk" : "on_track";
  const overBudget = c.budget != null && spent > c.budget;
  const finalHealth: Health = overBudget ? "at_risk" : health;
  const reason = overdueEnd ? "End date has passed but the campaign is still active"
    : overBudget ? "Creator fees are above the campaign budget"
    : health === "at_risk" ? "No creators confirmed yet"
    : `${booked.length}${c.creators_target ? ` of ${c.creators_target}` : ""} creators confirmed across ${(c.briefs ?? []).length} briefs`;
  return {
    id: c.id, name: c.name, brand: c.brand_name ?? c.brand_org?.name ?? "—", status: c.status, start: c.start_date, end: c.end_date, budget: c.budget, spent,
    owner: c.owner?.full_name ?? c.owner?.email ?? null,
    confirmed: booked.length, target: c.creators_target, live, deliverables: dels.length, reach: null, views: views || null, er: views ? Math.round((eng / views) * 1000) / 10 : null,
    cities: Array.from(new Set((c.briefs ?? []).flatMap((b) => b.cities ?? []))), hue: hashHue(c.id), health: finalHealth, reason, briefs: (c.briefs ?? []).length,
    brandOrgId: c.brand_org_id, brandOrgName: c.brand_org?.name ?? null, goLive: c.go_live, ownerId: c.owner_id,
    targets: { reach: c.reach_target, views: c.views_target, er: c.er_target != null ? Number(c.er_target) : null },
  };
}

const CAMPAIGN_SELECT = "id, name, brand_name, status, start_date, end_date, description, budget, creators_target, go_live, reach_target, views_target, er_target, owner_id, brand_org_id, owner:profiles!campaigns_owner_id_fkey(full_name, email), brand_org:organizations!campaigns_brand_org_id_fkey(name), briefs(id, status, budget_max, cities, intents(stage, agreed_rate, deliverable_links)), deliverables(status, views, likes, comments)";

export const listCampaigns = cache(async (orgId: string): Promise<CampaignVM[]> => {
  if (isDemo()) return CAMPAIGNS.map(demoCampaignVM);
  const supabase = await createClient();
  const { data } = await supabase.from("campaigns").select(CAMPAIGN_SELECT).eq("org_id", orgId).order("created_at", { ascending: false });
  const now = Date.now();
  return ((data ?? []) as unknown as LiveCampaign[]).map((c) => liveCampaignVM(c, now));
});

export type CampaignWorkspace = {
  campaign: CampaignVM; description: string | null; cards: PipelineCard[]; deliverables: DeliverableRow[];
  briefs: { id: string; title: string; status: string }[];
};

export async function getCampaignWorkspace(id: string, orgId: string): Promise<CampaignWorkspace | null> {
  if (isDemo()) {
    const c = CAMPAIGNS.find((x) => x.id === id);
    if (!c) return null;
    const briefs = BRIEFS.filter((b) => b.campaign_id === id);
    const cards: PipelineCard[] = pipelineFor(briefs.map((b) => b.id)).map((i) => {
      const t = getCreator(i.creator_id)!;
      return { id: i.id, stage: i.stage, talentId: t.id, name: t.display_name, handle: t.handle, hue: t.hue, photo: null, followers: t.followers, match: i.match, quoted: i.quoted_rate, agreed: i.agreed_rate, brief: briefs.find((b) => b.id === i.brief_id)?.title ?? "", source: i.source, updated: i.updated_at };
    });
    const deliverables: DeliverableRow[] = DELIVERABLES.filter((d) => d.campaign_id === id).map((d) => {
      const t = getCreator(d.creator_id)!;
      return { id: d.id, talentId: t.id, name: t.display_name, handle: t.handle, hue: t.hue, kind: d.kind, due: deliverableDue(d), version: d.version, status: d.status, views: d.views };
    });
    return { campaign: demoCampaignVM(c), description: briefs[0]?.description ?? null, cards, deliverables, briefs: briefs.map((b) => ({ id: b.id, title: b.title, status: b.status })) };
  }
  const supabase = await createClient();
  const { data: c } = await supabase.from("campaigns").select(CAMPAIGN_SELECT).eq("id", id).eq("org_id", orgId).maybeSingle();
  if (!c) return null;
  const { data: briefRows } = await supabase
    .from("briefs")
    .select("id, title, status, talent_kind, categories, cities, min_followers, max_followers, min_engagement, ranks, brand_display, intents(id, stage, source, quoted_rate, agreed_rate, brand_fee, shared_with_brand_at, deliverable_links, updated_at, shortlist_decisions(decision, note), talent_profiles(id, display_name, city, rank, is_influencer, is_event_talent, categories, rate_per_post, social_accounts(handle, followers, engagement_rate, profile_pic_url)))")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });
  type BR = LiveBrief & { status: string; intents: { id: string; stage: string; source: string; quoted_rate: number | null; agreed_rate: number | null; brand_fee: number | null; shared_with_brand_at: string | null; shortlist_decisions: { decision: BrandDecision; note: string | null } | { decision: BrandDecision; note: string | null }[] | null; deliverable_links: string[]; updated_at: string; talent_profiles: { id: string; display_name: string; city: string | null; rank: string; is_influencer: boolean; is_event_talent: boolean; categories: string[]; rate_per_post: number | null; social_accounts: { handle: string; followers: number | null; engagement_rate: number | null; profile_pic_url: string | null }[] } | null }[] };
  const briefs = (briefRows ?? []) as unknown as BR[];
  const cards: PipelineCard[] = [];
  const deliverables: DeliverableRow[] = await liveDeliverables(id);
  briefs.forEach((b) => (b.intents ?? []).forEach((i) => {
    const t = i.talent_profiles;
    if (!t || !BOARD.includes(i.stage as PipelineStage)) return;
    const ig = t.social_accounts?.[0];
    const row: TalentRow = { id: t.id, name: t.display_name, handle: ig?.handle ?? null, photo: null, hue: hashHue(t.id), city: t.city, college: null, campus: t.categories.includes("Student / Campus"), followers: ig?.followers ?? null, er: ig?.engagement_rate ?? null, avgViews: null, avgLikes: null, rank: t.rank, rate: t.rate_per_post, verified: false, availability: "available", categories: t.categories, influencer: t.is_influencer, event: t.is_event_talent, growth: [], rating: null };
    const dec = Array.isArray(i.shortlist_decisions) ? i.shortlist_decisions[0] : i.shortlist_decisions;
    cards.push({
      id: i.id, stage: i.stage as PipelineStage, talentId: t.id, name: t.display_name, handle: row.handle, hue: row.hue, photo: ig?.profile_pic_url ? imgSrc(ig.profile_pic_url) : null,
      followers: row.followers, match: matchScore(liveBriefVM(b), row), quoted: i.quoted_rate, agreed: i.agreed_rate, brief: b.title, source: i.source, updated: i.updated_at,
      sharedWithBrand: !!i.shared_with_brand_at, brandDecision: dec?.decision ?? null, brandNote: dec?.note ?? null, brandFee: i.brand_fee,
    });
  }));
  return { campaign: liveCampaignVM(c as unknown as LiveCampaign, Date.now()), description: (c as { description?: string | null }).description ?? null, cards, deliverables, briefs: briefs.map((b) => ({ id: b.id, title: b.title, status: b.status })) };
}

export async function getReport(id: string): Promise<{ daily: number[]; labels: string[] | null; cities: { label: string; value: number }[] }> {
  if (!isDemo()) return liveReport(id);
  return { daily: dailyViews(id), labels: null, cities: cityReach(id) };
}

export async function getSubmissions(id: string, brand = "Brand"): Promise<(Submission & { name?: string; handle?: string })[]> {
  return isDemo() ? submissionsFor(id) : liveSubmissions(id, brand);
}

/* ---------------- briefs ---------------- */
export type BriefDetail = {
  brief: BriefCriteriaVM & { status: string; deliverables: string | null; budget_min: number | null; budget_max: number | null; apply_by: string | null; event_date: string | null; description: string | null; slots: number | null };
  campaign: { id: string; name: string } | null;
  cards: PipelineCard[];
};

export async function getBriefDetail(id: string, orgId: string): Promise<BriefDetail | null> {
  if (isDemo()) {
    const b = BRIEFS.find((x) => x.id === id);
    if (!b) return null;
    const camp = CAMPAIGNS.find((c) => c.id === b.campaign_id);
    const cards = pipelineFor([b.id]).map((i) => {
      const t = getCreator(i.creator_id)!;
      return { id: i.id, stage: i.stage, talentId: t.id, name: t.display_name, handle: t.handle, hue: t.hue, photo: null, followers: t.followers, match: i.match, quoted: i.quoted_rate, agreed: i.agreed_rate, brief: b.title, source: i.source, updated: i.updated_at } satisfies PipelineCard;
    });
    return { brief: { ...demoBriefVM(b), status: b.status, deliverables: b.deliverables, budget_min: b.budget_min, budget_max: b.budget_max, apply_by: b.apply_by, event_date: b.event_date, description: b.description, slots: b.slots }, campaign: camp ? { id: camp.id, name: camp.name } : null, cards };
  }
  const supabase = await createClient();
  const { data: b } = await supabase.from("briefs").select("*, campaigns(id, name)").eq("id", id).eq("org_id", orgId).maybeSingle();
  if (!b) return null;
  const { data } = await supabase
    .from("intents")
    .select("id, stage, source, quoted_rate, agreed_rate, updated_at, talent_profiles(id, display_name, city, rank, is_influencer, is_event_talent, categories, social_accounts(handle, followers, engagement_rate, profile_pic_url))")
    .eq("brief_id", id);
  const vm = liveBriefVM(b as LiveBrief);
  type IR = { id: string; stage: string; source: string; quoted_rate: number | null; agreed_rate: number | null; updated_at: string; talent_profiles: { id: string; display_name: string; city: string | null; rank: string; is_influencer: boolean; is_event_talent: boolean; categories: string[]; social_accounts: { handle: string; followers: number | null; engagement_rate: number | null; profile_pic_url: string | null }[] } | null };
  const cards = ((data ?? []) as unknown as IR[]).filter((i) => i.talent_profiles && BOARD.includes(i.stage as PipelineStage)).map((i) => {
    const t = i.talent_profiles!;
    const ig = t.social_accounts?.[0];
    const row: TalentRow = { id: t.id, name: t.display_name, handle: ig?.handle ?? null, photo: null, hue: hashHue(t.id), city: t.city, college: null, campus: t.categories.includes("Student / Campus"), followers: ig?.followers ?? null, er: ig?.engagement_rate ?? null, avgViews: null, avgLikes: null, rank: t.rank, rate: null, verified: false, availability: "available", categories: t.categories, influencer: t.is_influencer, event: t.is_event_talent, growth: [], rating: null };
    return { id: i.id, stage: i.stage as PipelineStage, talentId: t.id, name: t.display_name, handle: row.handle, hue: row.hue, photo: ig?.profile_pic_url ? imgSrc(ig.profile_pic_url) : null, followers: row.followers, match: matchScore(vm, row), quoted: i.quoted_rate, agreed: i.agreed_rate, brief: b.title, source: i.source, updated: i.updated_at };
  });
  const camp = b.campaigns as unknown as { id: string; name: string } | null;
  return { brief: { ...vm, status: b.status, deliverables: b.deliverables, budget_min: b.budget_min, budget_max: b.budget_max, apply_by: b.apply_by, event_date: b.event_date, description: b.description, slots: null }, campaign: camp, cards };
}

export type BriefListItem = { id: string; title: string; brand: string; status: string; campaign: string; campaignId: string; apply_by: string | null; applicants: number; slots: number | null; hue: number; cities: string[] };

export const listBriefs = cache(async (orgId: string): Promise<BriefListItem[]> => {
  if (isDemo()) {
    return BRIEFS.map((b) => {
      const camp = CAMPAIGNS.find((c) => c.id === b.campaign_id);
      return { id: b.id, title: b.title, brand: b.brand_display, status: b.status, campaign: camp?.name ?? "", campaignId: b.campaign_id, apply_by: b.apply_by, applicants: b.applicants, slots: b.slots, hue: b.hue, cities: b.cities };
    });
  }
  const supabase = await createClient();
  const { data } = await supabase.from("briefs").select("id, title, brand_display, status, apply_by, cities, campaign_id, campaigns(name), intents(count)").eq("org_id", orgId).order("created_at", { ascending: false });
  return (data ?? []).map((b) => ({
    id: b.id, title: b.title, brand: b.brand_display ?? "Confidential brand", status: b.status, campaign: (b.campaigns as unknown as { name: string } | null)?.name ?? "", campaignId: b.campaign_id,
    apply_by: b.apply_by, applicants: (b.intents as unknown as { count: number }[])?.[0]?.count ?? 0, slots: null, hue: hashHue(b.id), cities: b.cities ?? [],
  }));
});

export const listCampaignOptions = cache(async (orgId: string) => {
  if (isDemo()) return CAMPAIGNS.filter((c) => c.status !== "completed").map((c) => ({ id: c.id, name: c.name, brand: c.brand_name }));
  const supabase = await createClient();
  const { data } = await supabase.from("campaigns").select("id, name, brand_name").eq("org_id", orgId).neq("status", "completed").order("created_at", { ascending: false });
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, brand: c.brand_name ?? "" }));
});

/* ---------------- enquiries ---------------- */
export const listEnquiries = cache(async (): Promise<EnquiryVM[]> => {
  if (isDemo()) {
    return ALL_ENQUIRIES.map((e) => ({ ...e, message: ENQUIRY_DETAILS[e.id]?.message ?? e.objective, email: ENQUIRY_DETAILS[e.id]?.email ?? null, phone: ENQUIRY_DETAILS[e.id]?.phone ?? null, city: ENQUIRY_DETAILS[e.id]?.city ?? null }));
  }
  const supabase = await createClient();
  const { data } = await supabase.from("brand_enquiries").select("*").order("created_at", { ascending: false });
  return (data ?? []).map((e) => ({
    id: e.id, company: e.company, contact: e.contact_name, channel: "Website", budget: e.budget, objective: (e.requirement as string).split(/[.\n]/)[0].slice(0, 90),
    message: e.requirement, email: e.email, phone: e.phone, city: e.city, status: e.status, received: e.created_at,
  }));
});

/* ---------------- today ---------------- */
export type TodayData = {
  queue: QueueItem[];
  campaigns: CampaignVM[];
  kpis: { reach: number | null; reachSeries: number[]; live: number; liveSeries: number[]; confirmed: number; confirmedSeries: number[]; spent: number; budget: number | null; spendSeries: number[] };
  activity: { who: string; what: string; target: string; when: string; kind: string }[];
  team: { name: string; role: string; load: number; hue: number }[];
};

export async function getToday(orgId: string): Promise<TodayData> {
  const campaigns = await listCampaigns(orgId);
  const activeCamps = campaigns.filter((c) => c.status !== "completed");
  if (isDemo()) {
    return {
      queue: todayQueue(),
      campaigns: activeCamps,
      kpis: {
        reach: KPI_SERIES.reach.at(-1)!, reachSeries: KPI_SERIES.reach, live: KPI_SERIES.live.at(-1)!, liveSeries: KPI_SERIES.live,
        confirmed: KPI_SERIES.confirmed.at(-1)!, confirmedSeries: KPI_SERIES.confirmed,
        spent: activeCamps.reduce((s, c) => s + c.spent, 0), budget: activeCamps.reduce((s, c) => s + (c.budget ?? 0), 0), spendSeries: KPI_SERIES.spend,
      },
      activity: ACTIVITY_FEED,
      team: TEAM.map((t) => ({ name: t.name, role: t.role, load: t.load, hue: t.hue })),
    };
  }
  const supabase = await createClient();
  const [enq, waiting, reviews, events, decisions, members] = await Promise.all([
    supabase.from("brand_enquiries").select("id, company, budget, requirement, created_at").eq("status", "new").order("created_at", { ascending: false }).limit(3),
    supabase.from("intents").select("id, updated_at, talent_profiles(id, display_name), briefs(id, title, campaign_id)").eq("org_id", orgId).eq("stage", "interested").order("updated_at", { ascending: false }).limit(4),
    supabase.from("deliverables").select("id, kind, campaign_id, updated_at, talent_profiles(display_name), campaigns(name)").eq("org_id", orgId).eq("status", "draft_submitted").order("updated_at", { ascending: true }).limit(4),
    supabase.from("pipeline_events").select("id, to_stage, created_at, profiles(full_name, email), intents(talent_profiles(display_name), briefs(title))").eq("org_id", orgId).order("created_at", { ascending: false }).limit(8),
    supabase.from("shortlist_decisions").select("decision, decided_at, intents(talent_profiles(display_name), briefs(campaigns(name, brand_name)))").eq("org_id", orgId).order("decided_at", { ascending: false }).limit(4),
    supabase.from("memberships").select("user_id, role, profiles(full_name, email)").eq("org_id", orgId),
  ]);
  const now = Date.now();
  const age = (d: string) => { const h = Math.max(1, Math.round((now - new Date(d).getTime()) / 3600000)); return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`; };
  type P = { full_name: string | null; email: string | null } | null;
  const queue: QueueItem[] = [
    ...(reviews.data ?? []).map((d) => {
      const t = d.talent_profiles as unknown as { display_name: string } | null;
      const k = d.campaigns as unknown as { name: string } | null;
      return { id: `q-${d.id}`, kind: "review" as const, title: `${d.kind} draft from ${t?.display_name ?? "a creator"}`, meta: k?.name ?? "", href: `/crm/campaigns/${d.campaign_id}/review?d=${d.id}`, action: "Review", hue: hashHue(d.id), who: t?.display_name ?? "", age: age(d.updated_at) };
    }),
    ...(enq.data ?? []).map((e) => ({ id: `q-${e.id}`, kind: "enquiry" as const, title: `${e.company}${e.budget ? ` · ${e.budget}` : ""}`, meta: String(e.requirement).slice(0, 80), href: "/crm/enquiries", action: "Reply", hue: hashHue(e.company), who: e.company, age: age(e.created_at) })),
    ...(waiting.data ?? []).map((i) => {
      const t = i.talent_profiles as unknown as { id: string; display_name: string } | null;
      const b = i.briefs as unknown as { id: string; title: string; campaign_id: string } | null;
      return { id: `q-${i.id}`, kind: "reply" as const, title: `${t?.display_name ?? "Creator"} is interested`, meta: b?.title ?? "", href: `/crm/campaigns/${b?.campaign_id}`, action: "Review", secondary: { label: "Profile", href: `/crm/talent/${t?.id}` }, hue: hashHue(t?.id ?? ""), who: t?.display_name ?? "", age: age(i.updated_at) };
    }),
  ];
  type Ev = { id: number; to_stage: string; created_at: string; profiles: P; intents: { talent_profiles: { display_name: string } | null; briefs: { title: string } | null } | null };
  type Dec = { decision: string; decided_at: string; intents: { talent_profiles: { display_name: string } | null; briefs: { campaigns: { name: string; brand_name: string | null } | null } | null } | null };
  const activity = [
    ...((events.data ?? []) as unknown as Ev[]).map((e) => ({
      at: e.created_at, who: e.profiles?.full_name ?? e.profiles?.email ?? e.intents?.talent_profiles?.display_name ?? "Someone",
      what: e.to_stage === "interested" ? "applied to" : `moved ${e.intents?.talent_profiles?.display_name ?? "a creator"} to ${e.to_stage} on`,
      target: e.intents?.briefs?.title ?? "", when: age(e.created_at), kind: e.to_stage === "confirmed" ? "approve" : "pipeline",
    })),
    ...((decisions.data ?? []) as unknown as Dec[]).map((d) => ({
      at: d.decided_at, who: `${d.intents?.briefs?.campaigns?.brand_name ?? "Brand"} (brand)`,
      what: `${d.decision === "approved" ? "approved" : d.decision === "passed" ? "passed on" : "asked about"} ${d.intents?.talent_profiles?.display_name ?? "a creator"} for`,
      target: d.intents?.briefs?.campaigns?.name ?? "", when: age(d.decided_at), kind: "brand",
    })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8).map(({ at: _at, ...a }) => (void _at, a));
  // Team load: active campaigns owned, against a soft capacity of 4 per person.
  const owned = new Map<string, number>();
  campaigns.forEach((c) => { if (c.ownerId && c.status === "active") owned.set(c.ownerId, (owned.get(c.ownerId) ?? 0) + 1); });
  const team = (members.data ?? []).filter((m) => m.role !== "scout").map((m) => {
    const p = m.profiles as unknown as P;
    return { name: p?.full_name ?? p?.email ?? "Teammate", role: m.role.replace(/_/g, " "), load: Math.min(1, (owned.get(m.user_id) ?? 0) / 4), hue: hashHue(m.user_id) };
  }).filter((t) => t.load > 0);
  const budget = activeCamps.reduce((s, c) => s + (c.budget ?? 0), 0);
  return {
    queue,
    campaigns: activeCamps,
    kpis: { reach: campaigns.reduce((s, c) => s + (c.views ?? 0), 0) || null, reachSeries: [], live: campaigns.reduce((s, c) => s + c.live, 0), liveSeries: [], confirmed: campaigns.reduce((s, c) => s + c.confirmed, 0), confirmedSeries: [], spent: activeCamps.reduce((s, c) => s + c.spent, 0), budget: budget || null, spendSeries: [] },
    activity,
    team,
  };
}
