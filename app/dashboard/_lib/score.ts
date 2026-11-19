import type { CreatorVM } from "./types";

type BriefLike = {
  talent_kind: string; categories: string[]; cities: string[]; colleges_only?: boolean | null;
  min_followers: number | null; max_followers: number | null; min_engagement: number | string | null; ranks?: string[] | null;
};

const k = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}K`.replace(".0K", "K") : String(n));

/**
 * Match score (0–99) with human reasons and an eligibility checklist.
 * Hard requirements (kind, city, niche, follower range, ER, college) gate eligibility;
 * soft signals (overlap depth, ER headroom, campus) lift the score.
 */
export function scoreBrief(b: BriefLike, c: Pick<CreatorVM, "categories" | "city" | "followers" | "er" | "inCollege" | "collegeName" | "isInfluencer" | "isEventTalent" | "rank" | "interests">) {
  const reasons: string[] = [];
  const checks: { label: string; ok: boolean }[] = [];
  let score = 52;

  // kind
  if (b.talent_kind === "influencer") checks.push({ label: "Instagram creator", ok: c.isInfluencer });
  if (b.talent_kind === "event") checks.push({ label: "Event talent (host, promoter, artist)", ok: c.isEventTalent });

  // city
  if (b.cities.length) {
    const ok = !!c.city && b.cities.includes(c.city);
    checks.push({ label: `Based in ${b.cities.join(" / ")}`, ok });
    if (ok) { score += 12; reasons.push(`${c.city}-based`); }
  } else {
    score += 8; reasons.push("Open to any city");
  }

  // niche
  if (b.categories.length) {
    const overlap = b.categories.filter((x) => c.categories.includes(x));
    checks.push({ label: `Creates ${b.categories.join(" or ")} content`, ok: overlap.length > 0 });
    if (overlap.length) { score += 10 + overlap.length * 5; reasons.push(`${overlap[0].replace(" / Campus", "")} niche`); }
  }

  // followers
  if (b.min_followers || b.max_followers) {
    const f = c.followers ?? 0;
    const ok = (!b.min_followers || f >= b.min_followers) && (!b.max_followers || f <= b.max_followers);
    const range = b.min_followers && b.max_followers ? `${k(b.min_followers)}–${k(b.max_followers)}` : b.min_followers ? `${k(b.min_followers)}+` : `up to ${k(b.max_followers!)}`;
    checks.push({ label: `${range} followers`, ok });
    if (ok) { score += 8; reasons.push(`${k(f)} followers fits ${range}`); }
  }

  // engagement
  const minEr = b.min_engagement != null ? Number(b.min_engagement) : null;
  if (minEr) {
    const ok = (c.er ?? 0) >= minEr;
    checks.push({ label: `Engagement ${minEr}%+`, ok });
    if (ok) { score += (c.er ?? 0) >= minEr * 1.5 ? 9 : 5; reasons.push(`${c.er}% ER beats ${minEr}%`); }
  }

  // campus
  if (b.colleges_only) {
    checks.push({ label: "Currently in college", ok: c.inCollege });
    if (c.inCollege) { score += 6; reasons.push(c.collegeName ? `${shortCollege(c.collegeName)} student` : "College student"); }
  }

  if (b.ranks?.length) checks.push({ label: `Rank: ${b.ranks.join(", ")}`, ok: b.ranks.includes(c.rank) });

  const eligible = checks.every((x) => x.ok);
  return { match: eligible ? Math.min(98, score) : Math.min(48, score - 20), reasons: reasons.slice(0, 3), checks, eligible };
}

export function shortCollege(name: string) {
  return name.replace(/^SVKM's\s+/, "").replace(/,.*$/, "");
}

/** Progressive-profiling meter: what is filled, and the single next best action. */
export function profileStrength(c: CreatorVM) {
  const items = [
    { key: "instagram", label: "Connect Instagram", done: !!c.handle && c.fetchStatus !== "error", weight: 25, href: "/dashboard/profile#stats", why: "Brands shortlist on real numbers" },
    { key: "college", label: "Add your college", done: !c.inCollege || !!c.collegeName, weight: 10, href: "/dashboard/profile#about", why: "Unlocks campus briefs" },
    { key: "niches", label: "Pick your niches", done: c.categories.length > 0, weight: 10, href: "/dashboard/profile#about", why: "Sharper matches" },
    { key: "whatsapp", label: "Add WhatsApp", done: !!c.whatsapp, weight: 10, href: "/dashboard/profile#contact", why: "Get briefs the minute they drop" },
    { key: "rates", label: "Set your rates", done: !!c.ratePerPost || !!c.rateFullDay, weight: 15, href: "/dashboard/profile#rates", why: "Brands see a fee they can approve fast" },
    { key: "languages", label: "Languages you create in", done: c.languages.length > 0, weight: 5, href: "/dashboard/profile#about", why: "Regional briefs" },
    { key: "dob", label: "Add date of birth", done: !!c.dob, weight: 5, href: "/dashboard/profile#about", why: "Some brands need 18+" },
    { key: "portfolio", label: "Add a portfolio link", done: c.portfolio.length > 0, weight: 10, href: "/dashboard/profile#portfolio", why: "Show work beyond Instagram" },
    { key: "verified", label: "Verify Instagram insights", done: c.verifiedInsights, weight: 10, href: "/dashboard/profile#audience", why: "Verified creators rank higher" },
  ];
  const total = items.reduce((a, b) => a + b.weight, 0);
  const score = Math.round((items.filter((i) => i.done).reduce((a, b) => a + b.weight, 0) / total) * 100);
  const next = items.find((i) => !i.done) ?? null;
  return { score, items, next };
}

export function daysUntil(date: string | null) {
  if (!date) return null;
  const d = new Date(date + (date.length === 10 ? "T23:59:59+05:30" : ""));
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export function relTime(iso: string | null) {
  if (!iso) return "never";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export const fmtDate = (d: string | null, withYear = false) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) }) : "—";

export const STAGE_COPY: Record<string, { label: string; tone: string }> = {
  interested: { label: "Applied", tone: "bg-info-bg text-info" },
  shortlisted: { label: "Shortlisted", tone: "bg-cobalt-50 text-cobalt-700" },
  contacted: { label: "In discussion", tone: "bg-cobalt-50 text-cobalt-700" },
  negotiating: { label: "In discussion", tone: "bg-warn-bg text-warn" },
  confirmed: { label: "Confirmed", tone: "bg-ok-bg text-ok" },
  delivered: { label: "Completed", tone: "bg-ok-bg text-ok" },
  rejected: { label: "Not selected", tone: "bg-canvas-2 text-mute" },
  dropped: { label: "Closed", tone: "bg-canvas-2 text-mute" },
};

/** Creator-facing journey used by stage trackers. */
export const JOURNEY = [
  { key: "interested", label: "Applied" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "confirmed", label: "Confirmed" },
  { key: "content", label: "Content live" },
  { key: "paid", label: "Paid" },
] as const;

export function journeyIndex(stage: string, payment: string) {
  if (payment === "paid") return 4;
  if (stage === "delivered") return 3;
  if (stage === "confirmed") return 2;
  if (["shortlisted", "contacted", "negotiating"].includes(stage)) return 1;
  return 0;
}
