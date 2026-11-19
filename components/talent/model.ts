// Shared, framework-free helpers for the talent (creator / event talent) dashboard.
import { fmtINR } from "@/components/ui";

/** The happy-path pipeline a creator sees, in order. */
export const TRACK = ["interested", "shortlisted", "contacted", "negotiating", "confirmed", "delivered"] as const;
export type TrackStage = (typeof TRACK)[number];
export type AnyStage = TrackStage | "rejected" | "dropped";

/** Creator-facing wording for every pipeline stage (never agency jargon). */
export const STAGE_META: Record<AnyStage, { label: string; short: string; next: string; tone: "info" | "brand" | "warn" | "ok" | "mute" }> = {
  interested: { label: "Applied", short: "Applied", tone: "info", next: "The Vigor team reviews every application — you'll hear back either way." },
  shortlisted: { label: "Shortlisted", short: "Shortlist", tone: "brand", next: "You're on the brand's shortlist. We'll reach out with details soon." },
  contacted: { label: "In touch", short: "In touch", tone: "brand", next: "We've contacted you — check WhatsApp, email and calls from Vigor." },
  negotiating: { label: "Finalising terms", short: "Terms", tone: "warn", next: "We're agreeing fee and deliverables. Reply to the team to keep it moving." },
  confirmed: { label: "Confirmed", short: "Confirmed", tone: "ok", next: "You're booked! Follow the brief and share your deliverables on time." },
  delivered: { label: "Completed", short: "Done", tone: "ok", next: "Campaign complete — this counts towards your rank. Nice work." },
  rejected: { label: "Not selected", short: "Closed", tone: "mute", next: "The brand went another way this time. Keep applying — new briefs land every week." },
  dropped: { label: "Closed", short: "Closed", tone: "mute", next: "This application was closed. You can apply to other open briefs any time." },
};

export const TONE_CHIP: Record<string, string> = {
  info: "border-info/40 bg-info/10 text-info",
  brand: "border-brand/50 bg-brand/10 text-brand-2",
  warn: "border-warn/40 bg-warn/10 text-warn",
  ok: "border-ok/40 bg-ok/10 text-ok",
  mute: "border-line bg-ink-3 text-mute",
};

export function stageMeta(stage: string) {
  return STAGE_META[(stage in STAGE_META ? stage : "interested") as AnyStage];
}

export function isClosed(stage: string) {
  return stage === "rejected" || stage === "dropped";
}

/** Brief fields the talent dashboard renders (subset of `briefs`). */
export type TalentBrief = {
  id: string;
  title: string;
  description: string | null;
  brand_display: string | null;
  talent_kind: string;
  cities: string[];
  categories: string[];
  deliverables: string | null;
  budget_min: number | null;
  budget_max: number | null;
  event_date: string | null;
  apply_by: string | null;
  created_at?: string;
};

export function payLabel(b: Pick<TalentBrief, "budget_min" | "budget_max">) {
  const { budget_min: lo, budget_max: hi } = b;
  if (lo && hi) return lo === hi ? fmtINR(lo) : `${fmtINR(lo)} – ${fmtINR(hi)}`;
  if (hi) return `Up to ${fmtINR(hi)}`;
  if (lo) return `From ${fmtINR(lo)}`;
  return "Fee on discussion";
}

export function fmtDate(d: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", opts);
}

/** Whole days from today (local) until a yyyy-mm-dd / ISO date. Negative = past. */
export function daysUntil(d: string, now = new Date()) {
  const target = new Date(d);
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b - a) / 86_400_000);
}

export function deadlineLabel(applyBy: string | null) {
  if (!applyBy) return null;
  const n = daysUntil(applyBy);
  if (n < 0) return { text: "Applications closed", urgent: false };
  if (n === 0) return { text: "Closes today", urgent: true };
  if (n === 1) return { text: "Closes tomorrow", urgent: true };
  if (n <= 5) return { text: `${n} days left`, urgent: true };
  return { text: `Apply by ${fmtDate(applyBy)}`, urgent: false };
}

/** First few deliverable lines, e.g. "1 Reel · 2 Stories". */
export function deliverableItems(deliverables: string | null, max = 3) {
  if (!deliverables) return [];
  return deliverables
    .split(/\r?\n|;|•|,(?![^()]*\))/)
    .map((s) => s.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, max);
}

export function timeAgo(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "";
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(iso, { day: "numeric", month: "short", year: "numeric" });
}

/** Locally computed profile completeness (stand-in until the ProfileStrength meter lands). */
export type CompletionInput = {
  photo_url?: string | null;
  city?: string | null;
  bio?: string | null;
  categories?: string[] | null;
  languages?: string[] | null;
  is_influencer?: boolean;
  is_event_talent?: boolean;
  rate_per_post?: number | null;
  rate_half_day?: number | null;
  rate_full_day?: number | null;
  igOk?: boolean;
  mediaCount?: number;
  hasPhone?: boolean;
};

export function profileCompletion(t: CompletionInput) {
  const checks: { label: string; done: boolean }[] = [
    { label: "Add your city", done: !!t.city },
    { label: "Write a short bio", done: !!t.bio && t.bio.trim().length >= 20 },
    { label: "Pick your categories", done: (t.categories?.length ?? 0) > 0 },
    { label: "Add languages you speak", done: (t.languages?.length ?? 0) > 0 },
    { label: "Add a phone / WhatsApp number", done: !!t.hasPhone },
    {
      label: "Set your rates",
      done: !!(t.rate_per_post || t.rate_half_day || t.rate_full_day),
    },
  ];
  if (t.is_influencer) checks.push({ label: "Connect a public Instagram", done: !!t.igOk });
  if (t.is_event_talent) checks.push({ label: "Upload photos or performance videos", done: (t.mediaCount ?? 0) > 0 });
  const done = checks.filter((c) => c.done).length;
  return { pct: Math.round((done / checks.length) * 100), missing: checks.filter((c) => !c.done).map((c) => c.label) };
}
