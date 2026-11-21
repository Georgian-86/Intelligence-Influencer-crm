import "server-only";
/**
 * Founder cockpit data. Demo mode returns the fixtures; live mode computes every widget from
 * campaigns, payouts, invoices, deliverables, enquiries, talent and briefs for this agency.
 */
import { isDemo } from "@/lib/demo";
import { CAMPAIGNS } from "@/lib/demo/fixtures";
import { DEALS, FINANCE, MONTHLY_TARGET, PAYOUTS, PAYOUTS_DUE_TOTAL, REVENUE_MONTHS, SLA, SUPPLY_DEMAND, TEAM_LOAD, WEEKLY } from "@/lib/demo/portal";
import { createClient } from "@/lib/supabase/server";

export type Cockpit = {
  now: number;
  deals: { id: string; company: string; stage: string; value: number; prob: number }[];
  rows: { id: string; name: string; brand_name: string; status: string; budget: number; creator_cost: number; invoiced: number; collected: number }[];
  revenueMonths: { m: string; won: number; weighted: number }[];
  forecastFrom: number;
  monthlyTarget: number | null;
  payouts: { id: string; creator: string; campaign: string; amount: number; due: string; status: "late" | "due" }[];
  payoutsDueTotal: number;
  sla: { review_hours: number; reviews: { id: string; handle: string; campaign: string; waiting_hours: number; owner: string }[] };
  weekly: { labels: string[]; creators: number[]; brands: number[]; revenue: number[] };
  supplyDemand: { cities: string[]; niches: string[]; supply: number[][]; demand: number[][] };
  teamLoad: { id: string; name: string; hue: number; load: number; campaigns: number; tasks: number }[];
};

const hashHue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 360;

/** "₹2–3L", "5 lakh", "₹12,00,000", "1.5 Cr" → rupees (upper bound of a range). */
export function parseBudget(text: string | null): number {
  if (!text) return 0;
  const t = text.toLowerCase().replace(/,/g, "");
  const nums = [...t.matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
  if (!nums.length) return 0;
  const top = Math.max(...nums);
  if (/\d\s*cr\b|crore/.test(t)) return Math.round(top * 1e7);
  if (/\d\s*l\b|lakh|lac/.test(t)) return Math.round(top * 1e5);
  if (/\d\s*k\b/.test(t)) return Math.round(top * 1e3);
  return Math.round(top);
}

const STAGE_OF: Record<string, { stage: string; prob: number }> = {
  new: { stage: "Discovery", prob: 0.15 }, in_progress: { stage: "Proposal sent", prob: 0.4 }, converted: { stage: "Won", prob: 1 },
};

export async function getCockpit(orgId: string): Promise<Cockpit> {
  if (isDemo()) {
    return {
      now: Date.parse("2026-11-19"),
      deals: DEALS, rows: CAMPAIGNS.map((c) => ({ id: c.id, name: c.name, brand_name: c.brand_name, status: c.status, budget: c.budget, ...FINANCE[c.id] })),
      revenueMonths: REVENUE_MONTHS, forecastFrom: 5, monthlyTarget: MONTHLY_TARGET, payouts: PAYOUTS, payoutsDueTotal: PAYOUTS_DUE_TOTAL,
      sla: SLA, weekly: WEEKLY, supplyDemand: SUPPLY_DEMAND, teamLoad: TEAM_LOAD,
    };
  }
  const supabase = await createClient();
  const now = Date.now();
  const since = new Date(now - 8 * 7 * 86400000).toISOString();
  const [camps, pays, invs, dels, enqs, talent, briefs, members, signups] = await Promise.all([
    supabase.from("campaigns").select("id, name, brand_name, status, budget, start_date, owner_id").eq("org_id", orgId).neq("status", "archived"),
    supabase.from("payments").select("id, campaign_id, amount, status, due_date, talent_profiles(display_name), campaigns(name)").eq("org_id", orgId),
    supabase.from("invoices").select("campaign_id, amount, status, issued_on").eq("org_id", orgId).neq("status", "void"),
    supabase.from("deliverables").select("id, campaign_id, status, updated_at, talent_profiles(social_accounts(handle), display_name), campaigns(name, owner_id)").eq("org_id", orgId).neq("status", "live"),
    supabase.from("brand_enquiries").select("id, company, budget, status, created_at"),
    supabase.from("talent_profiles").select("city, categories").eq("status", "approved"),
    supabase.from("briefs").select("cities, categories").eq("org_id", orgId).eq("status", "open"),
    supabase.from("memberships").select("user_id, role, profiles(full_name, email)").eq("org_id", orgId),
    supabase.from("talent_profiles").select("created_at").gte("created_at", since),
  ]);

  type Camp = { id: string; name: string; brand_name: string | null; status: string; budget: number | null; start_date: string | null; owner_id: string | null };
  const campaigns = (camps.data ?? []) as Camp[];
  type Pay = { id: string; campaign_id: string; amount: number; status: string; due_date: string | null; talent_profiles: { display_name: string } | null; campaigns: { name: string } | null };
  const payments = (pays.data ?? []) as unknown as Pay[];
  const invoices = (invs.data ?? []) as { campaign_id: string; amount: number; status: string; issued_on: string }[];

  const rows = campaigns.filter((c) => c.budget).map((c) => ({
    id: c.id, name: c.name, brand_name: c.brand_name ?? "", status: c.status, budget: c.budget ?? 0,
    creator_cost: payments.filter((p) => p.campaign_id === c.id && p.status !== "failed").reduce((a, p) => a + p.amount, 0),
    invoiced: invoices.filter((i) => i.campaign_id === c.id && i.status !== "draft").reduce((a, i) => a + i.amount, 0),
    collected: invoices.filter((i) => i.campaign_id === c.id && i.status === "paid").reduce((a, i) => a + i.amount, 0),
  }));

  const deals = ((enqs.data ?? []) as { id: string; company: string; budget: string | null; status: string }[])
    .filter((e) => STAGE_OF[e.status])
    .map((e) => ({ id: e.id, company: e.company, value: parseBudget(e.budget), ...STAGE_OF[e.status] }));

  // Revenue by month: booked = campaign budgets by start month; weighted = open pipeline spread over the next 2 months.
  const months: { key: string; m: string }[] = [];
  for (let k = -5; k <= 2; k++) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + k);
    months.push({ key: d.toISOString().slice(0, 7), m: d.toLocaleDateString("en-IN", { month: "short" }) });
  }
  const weightedOpen = deals.filter((d) => d.stage !== "Won").reduce((a, d) => a + d.value * d.prob, 0);
  const revenueMonths = months.map((mo, i) => ({
    m: mo.m,
    won: campaigns.filter((c) => (c.start_date ?? "").slice(0, 7) === mo.key).reduce((a, c) => a + (c.budget ?? 0), 0),
    weighted: i >= 6 ? Math.round(weightedOpen / 2) : 0,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(now + 7 * 86400000).toISOString().slice(0, 10);
  const open = payments.filter((p) => p.status === "pending" || p.status === "approved");
  const payouts = open.filter((p) => p.due_date && p.due_date <= in7).sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")).slice(0, 8).map((p) => ({
    id: p.id, creator: p.talent_profiles?.display_name ?? "Creator", campaign: p.campaigns?.name ?? "", amount: p.amount, due: p.due_date!, status: (p.due_date! < today ? "late" : "due") as "late" | "due",
  }));

  type Del = { id: string; status: string; updated_at: string; talent_profiles: { display_name: string; social_accounts: { handle: string }[] } | null; campaigns: { name: string; owner_id: string | null } | null };
  const deliverables = (dels.data ?? []) as unknown as Del[];
  type Mem = { user_id: string; role: string; profiles: { full_name: string | null; email: string | null } | null };
  const team = ((members.data ?? []) as unknown as Mem[]).filter((m) => m.role !== "scout");
  const nameOf = (id: string | null | undefined) => {
    const p = team.find((m) => m.user_id === id)?.profiles;
    return p?.full_name ?? p?.email ?? "Unassigned";
  };
  const reviews = deliverables.filter((d) => d.status === "draft_submitted").map((d) => ({
    id: d.id, handle: d.talent_profiles?.social_accounts?.[0]?.handle ?? d.talent_profiles?.display_name ?? "creator", campaign: d.campaigns?.name ?? "",
    waiting_hours: Math.round((now - Date.parse(d.updated_at)) / 3600000), owner: nameOf(d.campaigns?.owner_id),
  }));

  // Supply vs demand: top cities and niches by approved supply.
  const tal = (talent.data ?? []) as { city: string | null; categories: string[] }[];
  const br = (briefs.data ?? []) as { cities: string[]; categories: string[] }[];
  const top = (xs: string[], n: number) => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
  const cities = top([...tal.map((t) => t.city ?? "").filter(Boolean), ...br.flatMap((b) => b.cities)], 6);
  const niches = top([...tal.flatMap((t) => t.categories ?? []), ...br.flatMap((b) => b.categories)], 6);
  const supply = cities.map((c) => niches.map((n) => tal.filter((t) => t.city === c && (t.categories ?? []).includes(n)).length));
  const demand = cities.map((c) => niches.map((n) => br.filter((b) => (b.cities.length === 0 || b.cities.includes(c)) && (b.categories.length === 0 || b.categories.includes(n))).length));

  const teamLoad = team.map((m) => {
    const mine = campaigns.filter((c) => c.owner_id === m.user_id && c.status === "active");
    const tasks = deliverables.filter((d) => d.campaigns?.owner_id === m.user_id).length;
    return { id: m.user_id, name: m.profiles?.full_name ?? m.profiles?.email ?? "Teammate", hue: hashHue(m.user_id), campaigns: mine.length, tasks, load: Math.min(1, mine.length / 4 + tasks / 40) };
  }).filter((t) => t.campaigns || t.tasks);

  // Weekly growth, last 8 ISO-ish weeks ending today.
  const weekStart = (k: number) => now - (7 - k) * 7 * 86400000;
  const bucket = (dates: string[]) => Array.from({ length: 8 }, (_, k) => dates.filter((d) => { const t = Date.parse(d); return t >= weekStart(k) - 7 * 86400000 && t < weekStart(k); }).length);
  const weekly = {
    labels: Array.from({ length: 8 }, (_, k) => new Date(weekStart(k) - 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" })),
    creators: bucket(((signups.data ?? []) as { created_at: string }[]).map((s) => s.created_at)),
    brands: bucket(((enqs.data ?? []) as { created_at: string }[]).map((e) => e.created_at)),
    revenue: Array.from({ length: 8 }, (_, k) => invoices.filter((i) => { const t = Date.parse(i.issued_on); return t >= weekStart(k) - 7 * 86400000 && t < weekStart(k); }).reduce((a, i) => a + i.amount, 0)),
  };

  const target = Number(process.env.COCKPIT_MONTHLY_TARGET ?? "") || null;
  return {
    now, deals, rows, revenueMonths, forecastFrom: 6, monthlyTarget: target, payouts, payoutsDueTotal: open.reduce((a, p) => a + p.amount, 0),
    sla: { review_hours: 24, reviews }, weekly, supplyDemand: { cities, niches, supply, demand }, teamLoad,
  };
}
