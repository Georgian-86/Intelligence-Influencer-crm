import "server-only";
/**
 * Live (Supabase) loaders for the execution layer: deliverables, review submissions, payouts,
 * invoices and report series. Demo mode keeps using the fixtures in lib/demo.
 */
import { createClient } from "@/lib/supabase/server";
import type { ReviewComment, Submission } from "@/lib/demo/crm";
import type { DeliverableRow, DeliverableStatus } from "@/components/crm/types";

export const hashHue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 360;

type Who = { full_name: string | null; email: string | null } | null;
type RawDeliverable = {
  id: string; intent_id: string; talent_id: string; kind: string; title: string | null; due_date: string | null; status: DeliverableStatus;
  brand_visible: boolean; live_url: string | null; views: number | null; likes: number | null; comments: number | null; updated_at: string;
  talent_profiles: { display_name: string; social_accounts: { handle: string }[] } | null;
  deliverable_versions: { version: number; caption: string | null; media_url: string | null; storage_path: string | null; created_at: string }[];
};

const DELIVERABLE_SELECT = "id, intent_id, talent_id, kind, title, due_date, status, brand_visible, live_url, views, likes, comments, updated_at, talent_profiles(display_name, social_accounts(handle)), deliverable_versions(version, caption, media_url, storage_path, created_at)";

const isOverdue = (d: RawDeliverable) => !!d.due_date && ["brief_sent", "changes_requested"].includes(d.status) && new Date(d.due_date + "T23:59:59+05:30").getTime() < Date.now();

export async function liveDeliverables(campaignId: string): Promise<DeliverableRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("deliverables").select(DELIVERABLE_SELECT).eq("campaign_id", campaignId).order("due_date", { ascending: true });
  return ((data ?? []) as unknown as RawDeliverable[]).map((d) => ({
    id: d.id, intentId: d.intent_id, talentId: d.talent_id, name: d.talent_profiles?.display_name ?? "Creator", handle: d.talent_profiles?.social_accounts?.[0]?.handle ?? null,
    hue: hashHue(d.talent_id), kind: d.kind, title: d.title, due: d.due_date, version: Math.max(1, d.deliverable_versions?.length ?? 0),
    status: isOverdue(d) ? "overdue" : d.status, views: d.views, likes: d.likes, comments: d.comments, brandVisible: d.brand_visible, liveUrl: d.live_url,
  }));
}

/** Pre-sign uploaded drafts so the review room can play them (1 hour). */
async function signPaths(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!paths.length) return out;
  const supabase = await createClient();
  const { data } = await supabase.storage.from("deliverables").createSignedUrls(paths, 3600);
  (data ?? []).forEach((r) => { if (r.path && r.signedUrl) out.set(r.path, r.signedUrl); });
  return out;
}

export const mediaKind = (path: string | null, url: string | null): "video" | "image" | "link" => {
  const p = (path ?? url ?? "").toLowerCase().split("?")[0];
  if (path && /\.(mp4|mov|webm|m4v)$/.test(p)) return "video";
  if (path && /\.(jpe?g|png|webp|heic)$/.test(p)) return "image";
  return "link";
};

/** Compliance hints derived from the caption (RV-5 lite). */
export function captionChecks(caption: string | null, brand: string): { label: string; ok: boolean }[] {
  const c = caption ?? "";
  return [
    { label: "#ad or paid-partnership disclosure", ok: /#ad\b|#sponsored|paid partnership/i.test(c) },
    { label: `Tags the brand (@)`, ok: /@\w/.test(c) },
    { label: "Campaign hashtag", ok: /#(?!ad\b)\w+/i.test(c) },
    { label: "No unproven claims (best / No.1)", ok: !/\b(best|no\.?\s?1|number one)\b/i.test(c) },
  ].map((x) => ({ ...x, label: x.label.replace("the brand", brand) }));
}

const ROLE: Record<string, ReviewComment["role"]> = { agency: "Agency", brand: "Brand", creator: "Creator" };

export async function liveSubmissions(campaignId: string, brand: string): Promise<(Submission & { name: string; handle: string })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("deliverables")
    .select(`${DELIVERABLE_SELECT}, deliverable_comments(id, version, author_role, internal, body, decision, created_at, profiles(full_name, email))`)
    .eq("campaign_id", campaignId)
    .in("status", ["draft_submitted", "changes_requested", "approved", "live"])
    .order("updated_at", { ascending: false });
  type Row = RawDeliverable & { deliverable_comments: { id: string; version: number | null; author_role: string; internal: boolean; body: string; decision: string | null; created_at: string; profiles: Who }[] };
  const rows = (data ?? []) as unknown as Row[];
  const signed = await signPaths(rows.flatMap((r) => (r.deliverable_versions ?? []).map((v) => v.storage_path).filter((p): p is string => !!p)));
  return rows.map((d) => {
    const versions = (d.deliverable_versions ?? []).slice().sort((a, b) => a.version - b.version);
    const latest = versions.at(-1);
    return {
      deliverable_id: d.id, campaign_id: campaignId, creator_id: d.talent_id, kind: d.kind, status: d.status, due: d.due_date ?? "", hue: hashHue(d.talent_id),
      name: d.talent_profiles?.display_name ?? "Creator", handle: d.talent_profiles?.social_accounts?.[0]?.handle ?? "",
      versions: versions.map((v) => ({
        v: v.version, at: v.created_at, caption: v.caption ?? "", duration: "",
        url: v.storage_path ? signed.get(v.storage_path) ?? null : v.media_url, media: mediaKind(v.storage_path, v.media_url),
      })),
      comments: (d.deliverable_comments ?? []).map((c) => ({
        id: c.id, who: c.author_role === "creator" ? d.talent_profiles?.display_name ?? "Creator" : c.profiles?.full_name ?? c.profiles?.email ?? ROLE[c.author_role] ?? "Team", role: ROLE[c.author_role] ?? "Agency",
        body: c.internal ? `Internal · ${c.body}` : c.body, at: c.created_at, version: c.version ?? versions.length, hue: hashHue(c.author_role + (c.profiles?.email ?? "")),
      })),
      brand_visible: d.brand_visible,
      checklist: captionChecks(latest?.caption ?? null, brand),
    };
  });
}

/* ---------------- report ---------------- */
export async function liveReport(campaignId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("deliverables")
    .select("id, views, talent_profiles(city), deliverable_metrics(views, captured_at)")
    .eq("campaign_id", campaignId)
    .eq("status", "live");
  type R = { id: string; views: number | null; talent_profiles: { city: string | null } | null; deliverable_metrics: { views: number | null; captured_at: string }[] };
  const rows = (data ?? []) as unknown as R[];
  // Daily views = growth of cumulative views across all live posts, last 14 days.
  const days: string[] = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10));
  const daily = days.map(() => 0);
  rows.forEach((r) => {
    const pts = (r.deliverable_metrics ?? []).slice().sort((a, b) => a.captured_at.localeCompare(b.captured_at));
    let prev = 0;
    pts.forEach((p) => {
      const k = days.indexOf(p.captured_at.slice(0, 10));
      const v = p.views ?? prev;
      if (k >= 0) daily[k] += Math.max(0, v - prev);
      prev = v;
    });
  });
  const byCity = new Map<string, number>();
  rows.forEach((r) => { const c = r.talent_profiles?.city ?? "Other"; byCity.set(c, (byCity.get(c) ?? 0) + (r.views ?? 0)); });
  return {
    daily: daily.some(Boolean) ? daily : [],
    labels: days,
    cities: [...byCity.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })),
  };
}

/* ---------------- money ---------------- */
export type PayoutVM = {
  id: string; intentId: string; talentId: string; name: string; campaign: string; campaignId: string; amount: number; tds: number; status: "pending" | "approved" | "paid" | "failed";
  due: string | null; utr: string | null; paidAt: string | null; delivered: boolean;
};

export async function livePayouts(orgId: string, campaignId?: string): Promise<PayoutVM[]> {
  const supabase = await createClient();
  let q = supabase.from("payments").select("id, intent_id, talent_id, campaign_id, amount, tds, status, due_date, utr, paid_at, talent_profiles(display_name), campaigns(name), intents(stage)").eq("org_id", orgId);
  if (campaignId) q = q.eq("campaign_id", campaignId);
  const { data } = await q.order("due_date", { ascending: true });
  type R = { id: string; intent_id: string; talent_id: string; campaign_id: string; amount: number; tds: number; status: PayoutVM["status"]; due_date: string | null; utr: string | null; paid_at: string | null; talent_profiles: { display_name: string } | null; campaigns: { name: string } | null; intents: { stage: string } | null };
  return ((data ?? []) as unknown as R[]).map((p) => ({
    id: p.id, intentId: p.intent_id, talentId: p.talent_id, name: p.talent_profiles?.display_name ?? "Creator", campaign: p.campaigns?.name ?? "", campaignId: p.campaign_id,
    amount: p.amount, tds: p.tds, status: p.status, due: p.due_date, utr: p.utr, paidAt: p.paid_at, delivered: p.intents?.stage === "delivered",
  }));
}

export type InvoiceVM = { id: string; campaignId: string; campaign: string; number: string; label: string | null; amount: number; gst: number; total: number; status: "draft" | "sent" | "paid" | "void"; issued: string; due: string | null; paidAt: string | null };

export async function liveInvoices(orgId: string, campaignId?: string): Promise<InvoiceVM[]> {
  const supabase = await createClient();
  let q = supabase.from("invoices").select("id, campaign_id, number, label, amount, gst_pct, status, issued_on, due_date, paid_at, campaigns(name)").eq("org_id", orgId);
  if (campaignId) q = q.eq("campaign_id", campaignId);
  const { data } = await q.order("issued_on", { ascending: false });
  type R = { id: string; campaign_id: string; number: string; label: string | null; amount: number; gst_pct: number; status: InvoiceVM["status"]; issued_on: string; due_date: string | null; paid_at: string | null; campaigns: { name: string } | null };
  return ((data ?? []) as unknown as R[]).map((i) => {
    const gst = Math.round((i.amount * Number(i.gst_pct)) / 100);
    return { id: i.id, campaignId: i.campaign_id, campaign: i.campaigns?.name ?? "", number: i.number, label: i.label, amount: i.amount, gst, total: i.amount + gst, status: i.status, issued: i.issued_on, due: i.due_date, paidAt: i.paid_at };
  });
}

/** Brand organisations the agency can link a campaign to, plus its own team for the owner picker. */
export async function campaignPlanOptions(orgId: string) {
  const supabase = await createClient();
  const [{ data: brands }, { data: team }] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("type", "brand").order("name"),
    supabase.from("memberships").select("user_id, role, profiles(full_name, email)").eq("org_id", orgId),
  ]);
  return {
    brands: (brands ?? []).map((b) => ({ id: b.id as string, name: b.name as string })),
    team: (team ?? []).map((m) => {
      const p = m.profiles as unknown as Who;
      return { id: m.user_id as string, name: p?.full_name ?? p?.email ?? "Teammate" };
    }),
  };
}
