/**
 * Extra demo fixtures for the creator app (dashboard, briefs, applications, profile).
 * Builds on lib/demo/fixtures.ts (ME, BRIEFS, MY_APPLICATIONS) without changing it.
 */
import { BRIEFS, ME, MY_APPLICATIONS, type DemoBrief, type Stage } from "./fixtures";

const BASE = Date.UTC(2026, 10, 19);
const ahead = (d: number) => new Date(BASE + d * 86400000).toISOString().slice(0, 10);
const ago = (d: number) => new Date(BASE - d * 86400000).toISOString();

/** Briefs that are still open for the demo creator (the shared fixture briefs are mostly applied to already). */
export const EXTRA_BRIEFS: DemoBrief[] = [
  {
    id: "b6", campaign_id: "k2", title: "Thrift haul reel for fest season", brand_display: "Thread & Loom", talent_kind: "influencer",
    categories: ["Fashion", "Lifestyle"], cities: ["Mumbai"], colleges_only: false, min_followers: 20_000, max_followers: 120_000, min_engagement: 4,
    deliverables: "1 Reel (45–60s haul) + 2 Stories with link sticker", budget_min: 7000, budget_max: 14000, apply_by: ahead(5), event_date: null,
    status: "open", applicants: 31, slots: 8, hue: 290,
    description: "Style a full fest-week look from our pre-loved drop. Shoot it your way — mirror, campus corridor, or the walk to the fest. We send a ₹3,000 wardrobe credit before the shoot.",
  },
  {
    id: "b7", campaign_id: "k1", title: "Campus ambassador · fest season", brand_display: "Sip Soda", talent_kind: "any",
    categories: ["Student / Campus", "Brand Promoter"], cities: ["Mumbai", "Pune"], colleges_only: true, min_followers: 2_000, max_followers: null, min_engagement: null,
    deliverables: "Run 2 sampling drops at your college + 3 Stories + 1 recap Reel", budget_min: 9000, budget_max: 16000, apply_by: ahead(8), event_date: ahead(15),
    status: "open", applicants: 18, slots: 12, hue: 170,
    description: "Be the face of Sip Soda on your campus for fest season. We ship the coolers and the cans; you pick the spots and bring the crowd.",
  },
  {
    id: "b8", campaign_id: "k3", title: "UGC: 30-second unboxing", brand_display: "Byte Audio", talent_kind: "influencer",
    categories: ["Tech", "Lifestyle"], cities: [], colleges_only: false, min_followers: null, max_followers: null, min_engagement: null,
    deliverables: "1 vertical unboxing video (raw + edited), usage rights 6 months", budget_min: 2500, budget_max: 5000, apply_by: ahead(3), event_date: null,
    status: "open", applicants: 64, slots: 25, hue: 215,
    description: "Unbox our new earbuds on camera and give your honest first reaction. No posting needed — the brand runs it as an ad.",
  },
];

export const DEMO_BRIEFS: DemoBrief[] = [...EXTRA_BRIEFS, ...BRIEFS];
export const getDemoBrief = (id: string) => DEMO_BRIEFS.find((b) => b.id === id);

/** Things the demo creator hasn't filled in yet (drives the profile-strength meter). */
export const ME_PROFILE = {
  phone: "+91 98201 45567",
  whatsapp: "+91 98201 45567",
  whatsapp_alerts: true,
  date_of_birth: null as string | null,
  gender: "female" as string | null,
  languages: ["English", "Hindi"],
  rate_per_post: ME.rate_per_post,
  rate_full_day: null as number | null,
  rate_notes: null as string | null,
  portfolio: [] as string[],
  interests: ["Instagram collabs", "Campus ambassador", "UGC"],
  photo_url: null as string | null,
};

/** Weekly series for stat tiles (12 points, oldest first). */
export const ME_SERIES = {
  followers: [39_800, 40_600, 41_100, 41_900, 42_700, 43_200, 44_400, 45_100, 45_900, 46_800, 47_600, 48_200],
  er: [5.1, 5.4, 5.2, 5.8, 6.0, 5.7, 6.1, 6.3, 6.0, 6.2, 6.5, 6.4],
  views: [38_000, 42_000, 40_500, 47_000, 51_000, 49_000, 55_000, 53_500, 58_000, 57_000, 63_000, 61_000],
};

export const ME_EARNINGS = {
  paid_total: 6500,
  pending_total: 12_000,
  months: [0, 0, 0, 6500, 0, 12_000], // Jun → Nov
  month_labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
};

export const ME_CAMPUS = {
  ambassador: "shortlisted" as "none" | "interested" | "shortlisted" | "active",
  ambassador_note: "Shortlisted for Sip Soda's fest-season crew at NMIMS — call on Thu, 4 pm.",
  campus_briefs: 2,
  creators_from_college: 46,
};

/** Rich detail for each of my applications (stage history, deliverable, payment). */
export type PaymentStatus = "not_started" | "awaiting_delivery" | "invoice_due" | "processing" | "paid";
export const ME_APPLICATIONS = [
  {
    ...MY_APPLICATIONS[1], // b2 confirmed
    id: "a2", fee: 12_000, payment: "awaiting_delivery" as PaymentStatus, deliverable_due: ahead(3),
    history: [{ stage: "interested" as Stage, at: ago(9) }, { stage: "shortlisted" as Stage, at: ago(6) }, { stage: "confirmed" as Stage, at: ago(2) }],
  },
  {
    ...MY_APPLICATIONS[0], // b1 shortlisted
    id: "a1", fee: 8000, payment: "not_started" as PaymentStatus, deliverable_due: null as string | null,
    history: [{ stage: "interested" as Stage, at: ago(4) }, { stage: "shortlisted" as Stage, at: ago(1) }],
  },
  {
    ...MY_APPLICATIONS[2], // b5 delivered
    id: "a5", fee: 6500, payment: "paid" as PaymentStatus, deliverable_due: null as string | null,
    history: [{ stage: "interested" as Stage, at: ago(62) }, { stage: "shortlisted" as Stage, at: ago(58) }, { stage: "confirmed" as Stage, at: ago(52) }, { stage: "delivered" as Stage, at: ago(38) }],
  },
];

/** Sample creators for the auth brand panel (illustrative). */
export const AUTH_SHOWCASE = [
  { name: "Aanya M.", handle: "aanya.mehta", college: "NMIMS, Mumbai", followers: "48.2K", gig: "Fit-check Reel", fee: "₹12,000", hue: 228 },
  { name: "Kabir S.", handle: "kabir.sethi", college: "Symbiosis, Pune", followers: "21.6K", gig: "Fest emcee", fee: "₹15,000", hue: 18 },
  { name: "Meher I.", handle: "meher.iyer", college: "Christ, Bangalore", followers: "93K", gig: "Campus sampling", fee: "₹9,000", hue: 300 },
  { name: "Rohan K.", handle: "rohan.kapoor", college: "SRCC, Delhi", followers: "12.4K", gig: "UGC unboxing", fee: "₹4,500", hue: 160 },
];
