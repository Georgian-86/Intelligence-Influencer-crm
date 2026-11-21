import "server-only";
/**
 * Brand portal data layer. Demo mode returns the fixtures in lib/demo/portal; live mode calls the
 * brand-safe Postgres functions (brand_campaigns / brand_shortlist / brand_content), which never
 * return creator contact details, creator cost or internal notes (decision log D4).
 */
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { imgSrc } from "@/components/ui";
import { matchScore } from "@/components/crm/match-score";
import type { TalentRow } from "@/components/crm/types";
import type { BrandAccess } from "@/lib/brand-access";
import {
  ACCOUNT_MANAGER, MILESTONES, PAST_CAMPAIGNS, PORTAL_CAMPAIGNS, REPORTS, REVIEWS, SHORTLISTS, SHORTLIST_TARGET, getPortalCampaign,
  type BrandCreator, type Milestone, type Phase, type PortalCampaign, type ReviewItem,
} from "@/lib/demo/portal";

const hashHue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 360;
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, d: number) => new Date(Date.parse(iso) + d * 86400000).toISOString().slice(0, 10);

type RawCampaign = {
  id: string; name: string; brand_name: string | null; status: string; start_date: string | null; end_date: string | null; go_live: string | null;
  budget: number | null; creators_target: number | null; reach_target: number | null; views_target: number | null; er_target: number | null;
  agency_name: string; owner_name: string | null; cities: string[]; confirmed: number; committed: number; deliverables_total: number; deliverables_live: number;
  views: number; engagements: number; shortlist_pending: number; shortlist_total: number; reviews_pending: number; oldest_review_at: string | null;
};

function phaseOf(c: RawCampaign): Phase {
  if (c.status === "completed") return "report";
  if (c.deliverables_live > 0) return "live";
  if (c.reviews_pending > 0 || (c.deliverables_total > 0 && c.confirmed > 0 && c.shortlist_pending === 0)) return "content";
  if (c.confirmed > 0) return "contracts";
  if (c.shortlist_total > 0) return "shortlist";
  return "brief";
}

export type LiveCampaign = PortalCampaign & { owner_name: string | null; agency_name: string; oldest_review_at: string | null; engagements: number };

function toPortal(c: RawCampaign): LiveCampaign {
  const start = c.start_date ?? today();
  const end = c.end_date ?? addDays(start, 30);
  return {
    id: c.id, name: c.name, brand_name: c.brand_name ?? "", status: (c.status === "archived" ? "completed" : c.status) as PortalCampaign["status"],
    start_date: start, end_date: end, budget: c.budget ?? 0, spent: Number(c.committed) || 0, owner: c.owner_name ?? c.agency_name,
    creators_confirmed: Number(c.confirmed), creators_target: c.creators_target ?? Math.max(Number(c.confirmed), Number(c.shortlist_total), 1),
    deliverables_live: Number(c.deliverables_live), deliverables_total: Number(c.deliverables_total),
    reach: 0, views: Number(c.views), er: c.views ? Math.round((Number(c.engagements) / Number(c.views)) * 1000) / 10 : 0,
    cities: c.cities ?? [], colleges: 0, hue: hashHue(c.id), health: "on_track",
    phase: phaseOf(c), go_live: c.go_live ?? start,
    targets: { reach: c.reach_target ?? 0, views: c.views_target ?? 0, er: c.er_target != null ? Number(c.er_target) : 0 },
    shortlist_pending: Number(c.shortlist_pending), reviews_pending: Number(c.reviews_pending), brief_id: "",
    owner_name: c.owner_name, agency_name: c.agency_name, oldest_review_at: c.oldest_review_at, engagements: Number(c.engagements),
  };
}

export const getBrandCampaigns = cache(async (brand: BrandAccess): Promise<LiveCampaign[]> => {
  if (brand.demo) return PORTAL_CAMPAIGNS.map((c) => ({ ...c, owner_name: ACCOUNT_MANAGER.name, agency_name: "Vigor Launchpad", oldest_review_at: null, engagements: 0 }));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("brand_campaigns");
  if (error) return [];
  return ((data ?? []) as RawCampaign[]).map(toPortal);
});

export async function getBrandCampaign(brand: BrandAccess, id: string) {
  if (brand.demo) {
    const c = getPortalCampaign(id);
    return c ? { ...c, owner_name: ACCOUNT_MANAGER.name, agency_name: "Vigor Launchpad", oldest_review_at: null, engagements: 0 } : undefined;
  }
  return (await getBrandCampaigns(brand)).find((c) => c.id === id);
}

/** Overview extras: what's next on each campaign, the account manager, past campaigns. */
export async function getBrandOverview(brand: BrandAccess) {
  const campaigns = await getBrandCampaigns(brand);
  if (brand.demo) return { campaigns: campaigns.filter((c) => c.status !== "completed"), past: PAST_CAMPAIGNS, milestones: MILESTONES, am: ACCOUNT_MANAGER };
  const now = today();
  const milestones: Milestone[] = campaigns.filter((c) => c.status !== "completed").flatMap((c) => {
    const m: Milestone[] = [];
    const step = (date: string, label: string, done: boolean, detail?: string) => m.push({ date, label, campaign: c.name, state: done ? "done" : "upcoming", detail });
    step(c.start_date, "Campaign kicks off", c.start_date <= now);
    if (c.shortlist_pending > 0) m.push({ date: now, label: "Approve shortlist", campaign: c.name, state: "next", detail: `${c.shortlist_pending} creator${c.shortlist_pending === 1 ? "" : "s"} waiting for you` });
    if (c.reviews_pending > 0) m.push({ date: now, label: "Review content", campaign: c.name, state: "next", detail: `${c.reviews_pending} draft${c.reviews_pending === 1 ? "" : "s"} waiting for you` });
    step(c.go_live, "Content goes live", c.deliverables_live > 0, c.deliverables_live ? `${c.deliverables_live} of ${c.deliverables_total} posts live` : undefined);
    step(c.end_date, "Final report", c.status === "completed");
    return m;
  }).sort((a, b) => a.date.localeCompare(b.date) || (a.state === "next" ? -1 : 1));
  const owner = campaigns.find((c) => c.owner_name)?.owner_name ?? null;
  return {
    campaigns: campaigns.filter((c) => c.status !== "completed"),
    past: campaigns.filter((c) => c.status === "completed").map((c) => ({ id: c.id, name: c.name, end_date: c.end_date, reach: c.views, er: c.er, creators: c.creators_confirmed })),
    milestones,
    am: { name: owner ?? campaigns[0]?.agency_name ?? "Vigor", role: `Account manager, ${campaigns[0]?.agency_name ?? "Vigor"}`, hue: 12, whatsapp: process.env.NEXT_PUBLIC_VIGOR_WHATSAPP ?? null, replies: "Replies within a working day" },
  };
}

/* ---------------- shortlist ---------------- */
type RawShort = {
  intent_id: string; talent_id: string; name: string; city: string | null; rank: BrandCreator["rank"]; categories: string[]; reliability: number | null;
  is_influencer: boolean; is_event_talent: boolean; fee: number | null; stage: string;
  brief_title: string; brief_deliverables: string | null; brief_cities: string[]; brief_categories: string[]; brief_kind: string;
  min_followers: number | null; max_followers: number | null; min_engagement: number | null;
  college: string | null; grad_year: number | null; handle: string | null; followers: number | null; er: number | null; avg_views: number | null;
  avg_likes: number | null; verified: boolean | null; posts: { id: string; type: string | null; views: number | null; thumb: string | null; url: string | null }[];
  past_bookings: number; decision: "approved" | "passed" | "question" | null; decision_note: string | null;
};
const DEC: Record<string, BrandCreator["decision"]> = { approved: "approve", passed: "pass", question: "question" };

function whyFor(r: RawShort): string[] {
  const out: string[] = [];
  if (r.city && r.brief_cities?.includes(r.city)) out.push(`Based in ${r.city}, one of your target cities`);
  const overlap = (r.categories ?? []).filter((c) => r.brief_categories?.includes(c));
  if (overlap.length) out.push(`Creates ${overlap.slice(0, 2).join(" and ").toLowerCase()} content`);
  if (r.er != null && Number(r.er) >= 4) out.push(`${Number(r.er).toFixed(1)}% engagement, above the 3–4% norm for their size`);
  if (r.past_bookings > 0) out.push(`Delivered ${r.past_bookings} past campaign${r.past_bookings === 1 ? "" : "s"} with Vigor`);
  if (r.college) out.push(`Studies at ${r.college}`);
  if (!out.length) out.push("Hand-picked by your Vigor account manager");
  return out.slice(0, 3);
}

export async function getShortlist(brand: BrandAccess, campaignId: string): Promise<{ creators: BrandCreator[]; target: number; deliverable: string }> {
  if (brand.demo) return { creators: SHORTLISTS[campaignId] ?? [], target: SHORTLIST_TARGET, deliverable: "1 Reel + 3 Stories with link sticker" };
  const supabase = await createClient();
  const [{ data }, campaign] = await Promise.all([supabase.rpc("brand_shortlist", { p_campaign: campaignId }), getBrandCampaign(brand, campaignId)]);
  const rows = (data ?? []) as RawShort[];
  const creators: BrandCreator[] = rows.map((r) => {
    const hue = hashHue(r.talent_id);
    const row: TalentRow = {
      id: r.talent_id, name: r.name, handle: r.handle, photo: null, hue, city: r.city, college: r.college, campus: !!r.college, followers: r.followers,
      er: r.er != null ? Number(r.er) : null, avgViews: r.avg_views, avgLikes: r.avg_likes, rank: r.rank, rate: null, verified: !!r.verified, availability: "available",
      categories: r.categories ?? [], influencer: r.is_influencer, event: r.is_event_talent, growth: [], rating: null,
    };
    const match = matchScore({ id: "", title: r.brief_title, brand: "", talent_kind: r.brief_kind, categories: r.brief_categories ?? [], cities: r.brief_cities ?? [], colleges_only: false, min_followers: r.min_followers, max_followers: r.max_followers, min_engagement: r.min_engagement != null ? Number(r.min_engagement) : null, ranks: [] }, row);
    return {
      id: r.intent_id, name: r.name, handle: r.handle ?? "", city: r.city ?? "", college: r.college, grad_year: r.grad_year,
      followers: r.followers ?? 0, er: r.er != null ? Number(r.er) : 0, audience_18_24: null, female: null, avg_views: r.avg_views != null ? Number(r.avg_views) : null,
      categories: r.categories ?? [], rank: r.rank, hue, verified_insights: !!r.verified, reliability: r.reliability,
      posts: (r.posts ?? []).map((p, k) => ({ id: p.id, type: p.type === "Video" ? "reel" : "post", views: p.views, hue: (hue + k * 23) % 360, thumb: p.thumb ? imgSrc(p.thumb) : null, url: p.url })),
      fee: r.fee, match, why: whyFor(r), decision: r.decision ? DEC[r.decision] : undefined, note: r.decision_note, deliverable: r.brief_deliverables,
    };
  });
  const target = campaign?.creators_target ?? creators.length;
  return { creators, target: Math.max(1, target - (campaign?.creators_confirmed ?? 0) + creators.filter((c) => c.decision === "approve").length), deliverable: rows[0]?.brief_deliverables ?? "As agreed in the brief" };
}

/* ---------------- content review ---------------- */
type RawContent = {
  id: string; kind: string; title: string | null; status: string; due_date: string | null; brand_visible: boolean; live_url: string | null; posted_at: string | null;
  views: number | null; likes: number | null; comments: number | null; updated_at: string; name: string; city: string | null; handle: string | null; college: string | null;
  versions: { version: number; caption: string | null; media_url: string | null; storage_path: string | null; at: string }[];
  thread: RawComment[];
  metrics: { views: number | null; at: string }[];
};
type RawComment = { id: string; role: "agency" | "brand" | "creator"; who: string; body: string; decision: string | null; version: number | null; at: string };

const rel = (iso: string) => {
  const h = (Date.now() - Date.parse(iso)) / 3600000;
  return h < 1 ? "just now" : h < 24 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)}d ago`;
};

async function brandContent(campaignId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("brand_content", { p_campaign: campaignId });
  return (data ?? []) as RawContent[];
}

export async function getReviews(brand: BrandAccess, campaignId: string, brandLabel: string): Promise<ReviewItem[]> {
  if (brand.demo) return REVIEWS.filter((r) => r.campaign_id === campaignId);
  const rows = (await brandContent(campaignId)).filter((d) => d.brand_visible && d.status === "draft_submitted");
  const paths = rows.flatMap((d) => d.versions.map((v) => v.storage_path).filter((p): p is string => !!p));
  const signed = new Map<string, string>();
  if (paths.length) {
    const supabase = await createClient();
    const { data } = await supabase.storage.from("deliverables").createSignedUrls(paths, 3600);
    (data ?? []).forEach((r) => { if (r.path && r.signedUrl) signed.set(r.path, r.signedUrl); });
  }
  return rows.map((d) => {
    const hue = hashHue(d.id);
    const v = d.versions.at(-1);
    const caption = v?.caption ?? "";
    const url = v?.storage_path ? signed.get(v.storage_path) ?? null : v?.media_url ?? null;
    const ext = (v?.storage_path ?? "").toLowerCase();
    const kind: "video" | "image" | "link" = v?.storage_path && /\.(mp4|mov|webm|m4v)$/.test(ext) ? "video" : v?.storage_path && /\.(jpe?g|png|webp|heic)$/.test(ext) ? "image" : "link";
    const changes = (d.thread ?? []).filter((c) => c.decision === "changes");
    return {
      id: d.id, campaign_id: campaignId,
      creator: { name: d.name, handle: d.handle ?? d.name, hue, college: d.college },
      kind: (["Reel", "Story", "Post"].includes(d.kind) ? d.kind : "Reel") as ReviewItem["kind"], version: v?.version ?? 1,
      submitted_hours_ago: v ? (Date.now() - Date.parse(v.at)) / 3600000 : 0, sla_hours: 24,
      caption, duration: "", hue,
      checks: [
        { label: "#ad disclosure", ok: /#ad\b|#sponsored|paid partnership/i.test(caption) },
        { label: `Tags ${brandLabel}`, ok: /@\w/.test(caption) },
        { label: "Campaign hashtag", ok: /#(?!ad\b)\w+/i.test(caption) },
      ],
      history: d.versions.map((x) => {
        const ch = changes.find((c) => c.version === x.version);
        return { version: x.version, when: rel(x.at), note: ch ? ch.body : x.version === 1 ? "First draft" : "New version", by: ch ? ch.who : d.name, outcome: ch ? ("changes" as const) : ("submitted" as const) };
      }),
      comments: (d.thread ?? []).map((c) => ({ who: c.who, role: c.role, when: rel(c.at), text: c.body })),
      media: url ? { url, kind } : null,
    };
  });
}

/* ---------------- report ---------------- */
export type BrandReport = {
  days: { label: string; value: number }[];
  byCity: { label: string; value: number }[];
  top: { id: string; handle: string; kind: string; views: number; er: number; hue: number; url: string | null }[];
  cpm: number | null;
  liveCount: number;
};

export async function getBrandReport(brand: BrandAccess, campaignId: string, committed: number): Promise<BrandReport | null> {
  if (brand.demo) {
    const r = REPORTS[campaignId];
    if (!r) return null;
    return { days: r.days.map((d) => ({ label: d.date, value: d.views })), byCity: r.by_city, top: r.top.map((t) => ({ ...t, url: null })), cpm: r.cpm, liveCount: r.top.length };
  }
  const live = (await brandContent(campaignId)).filter((d) => d.status === "live");
  if (!live.length) return null;
  const keys = Array.from({ length: 14 }, (_, i) => addDays(today(), i - 13));
  const daily = keys.map(() => 0);
  live.forEach((d) => {
    let prev = 0;
    d.metrics.forEach((m) => { const k = keys.indexOf(m.at.slice(0, 10)); const v = m.views ?? prev; if (k >= 0) daily[k] += Math.max(0, v - prev); prev = v; });
  });
  const city = new Map<string, number>();
  live.forEach((d) => city.set(d.city ?? "Other", (city.get(d.city ?? "Other") ?? 0) + (d.views ?? 0)));
  const views = live.reduce((a, d) => a + (d.views ?? 0), 0);
  return {
    days: daily.some(Boolean) ? keys.map((k, i) => ({ label: k, value: daily[i] })) : [],
    byCity: [...city.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })),
    top: live.filter((d) => d.views).sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 6).map((d) => ({
      id: d.id, handle: d.handle ?? d.name, kind: d.kind, views: d.views ?? 0, er: d.views ? Math.round((((d.likes ?? 0) + (d.comments ?? 0)) / d.views) * 1000) / 10 : 0, hue: hashHue(d.id), url: d.live_url,
    })),
    cpm: views && committed ? Math.round((committed / views) * 1000) : null,
    liveCount: live.length,
  };
}
