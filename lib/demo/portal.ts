/**
 * Extra demo fixtures for the brand portal, platform admin and founder cockpit.
 * Builds on lib/demo/fixtures.ts. Everything here is deterministic (no Math.random)
 * so screenshots and sales demos are stable.
 *
 * Privacy (decision log D4): brand-facing shapes never carry creator phone or email.
 * `toBrandCreator` is the only way creator data reaches the brand portal.
 */
import { COLLEGES } from "@/lib/colleges";
import { BRIEFS, CAMPAIGNS, CREATORS, DELIVERABLES, TEAM, type DemoCampaign, type DemoCreator } from "./fixtures";

const BASE = Date.UTC(2026, 10, 19);
const day = (d: number) => new Date(BASE + d * 86400000).toISOString().slice(0, 10);

/* ============================== BRAND PORTAL ============================== */

export const BRAND_ORG = { name: "Domino's India", contact: "Priya Nair", email: "priya.nair@dominos.co.in", brand_name: "Domino's" };

export const ACCOUNT_MANAGER = { name: "Kunal Shah", role: "Account manager, Vigor Launchpad", hue: 12, whatsapp: "919820000000", replies: "Replies in ~20 min, 10am–8pm" };

export type Phase = "brief" | "shortlist" | "contracts" | "content" | "live" | "report";
export const PHASES: { key: Phase; label: string }[] = [
  { key: "brief", label: "Brief" },
  { key: "shortlist", label: "Shortlist" },
  { key: "contracts", label: "Contracts" },
  { key: "content", label: "Content" },
  { key: "live", label: "Live" },
  { key: "report", label: "Report" },
];

export type PortalCampaign = DemoCampaign & {
  phase: Phase;
  go_live: string;
  targets: { reach: number; views: number; er: number };
  shortlist_pending: number;
  reviews_pending: number;
  brief_id: string;
};

const k1 = CAMPAIGNS.find((c) => c.id === "k1")!;

export const PORTAL_CAMPAIGNS: PortalCampaign[] = [
  {
    ...k1,
    phase: "live", go_live: day(-9), targets: { reach: 6_000_000, views: 9_000_000, er: 5 },
    shortlist_pending: 0, reviews_pending: 4, brief_id: "b1",
  },
  {
    id: "k6", name: "Exam-Week Late-Night Slice", brand_name: "Domino's", status: "active",
    start_date: day(-3), end_date: day(27), budget: 1_100_000, spent: 165_000, owner: "Kunal Shah",
    creators_confirmed: 9, creators_target: 24, deliverables_live: 0, deliverables_total: 48,
    reach: 0, views: 0, er: 0, cities: ["Mumbai", "Pune", "Bangalore"], colleges: 16, hue: 228, health: "on_track",
    phase: "shortlist", go_live: day(6), targets: { reach: 3_500_000, views: 5_200_000, er: 5.5 },
    shortlist_pending: 12, reviews_pending: 0, brief_id: "b6",
  },
];

export const PAST_CAMPAIGNS = [
  { id: "k0", name: "Pizza Pass Freshers' Week", end_date: day(-96), reach: 2_700_000, er: 6.1, creators: 22 },
  { id: "k00", name: "IPL Watch-Party Stories", end_date: day(-188), reach: 5_100_000, er: 4.4, creators: 40 },
];

export const getPortalCampaign = (id: string) => PORTAL_CAMPAIGNS.find((c) => c.id === id);

export type Milestone = { date: string; label: string; campaign: string; state: "done" | "next" | "upcoming"; detail?: string };
export const MILESTONES: Milestone[] = [
  { date: day(-12), label: "Brief signed off", campaign: "Campus Fest Takeover", state: "done" },
  { date: day(-9), label: "First 20 Reels went live", campaign: "Campus Fest Takeover", state: "done", detail: "1.2M views in 48 hours" },
  { date: day(-3), label: "Brief signed off", campaign: "Exam-Week Late-Night Slice", state: "done" },
  { date: day(1), label: "Approve shortlist", campaign: "Exam-Week Late-Night Slice", state: "next", detail: "12 creators waiting for you" },
  { date: day(3), label: "Contracts and product shipped", campaign: "Exam-Week Late-Night Slice", state: "upcoming" },
  { date: day(6), label: "Content goes live", campaign: "Exam-Week Late-Night Slice", state: "upcoming" },
  { date: day(9), label: "Fest-day pizza drop at 6 campuses", campaign: "Campus Fest Takeover", state: "upcoming" },
  { date: day(18), label: "Final report", campaign: "Campus Fest Takeover", state: "upcoming" },
];

/* ---------- shortlist: brand-safe creator card (no phone/email ever) ---------- */
export type BrandCreator = {
  id: string; name: string; handle: string; city: string; college: string | null; grad_year: number | null;
  followers: number; er: number; audience_18_24: number | null; female: number | null; avg_views: number | null; categories: string[];
  rank: DemoCreator["rank"]; hue: number; verified_insights: boolean; reliability: number | null;
  posts: { id: string; type: "reel" | "post" | "carousel"; views: number | null; hue: number; thumb?: string | null; url?: string | null }[];
  fee: number | null; match: number; why: string[];
  /** Live mode: a decision the brand already sent, and the brief this creator is for. */
  decision?: "approve" | "pass" | "question"; note?: string | null; deliverable?: string | null;
};

const WHY = [
  "Posts from campus every week",
  "Food content outperforms their average by 1.8×",
  "Audience is 70%+ in Mumbai and Pune",
  "Delivered on time for 3 past brands",
  "Strong Story link-sticker clicks",
  "Fest coverage last season hit 200K views",
];

export function toBrandCreator(c: DemoCreator, i: number): BrandCreator {
  return {
    id: c.id, name: c.display_name, handle: c.handle, city: c.city,
    college: c.college_name ? (COLLEGES.find((k) => k.id === c.college_id)?.short ?? c.college_name) : null,
    grad_year: c.grad_year, followers: c.followers, er: c.engagement_rate, audience_18_24: c.audience.age_18_24,
    female: c.audience.female, avg_views: c.avg_views, categories: c.categories, rank: c.rank, hue: c.hue,
    verified_insights: c.verified_insights, reliability: c.reliability_score,
    posts: c.posts.slice(0, 3).map((p) => ({ id: p.id, type: p.type, views: p.views, hue: p.hue })),
    fee: Math.round(Math.min(c.followers * 0.12 + 2500, 30000) / 500) * 500,
    match: 96 - ((i * 7) % 19),
    why: [WHY[i % WHY.length], WHY[(i + 2) % WHY.length]],
  };
}

export const SHORTLIST_TARGET = 8;
export const SHORTLISTS: Record<string, BrandCreator[]> = {
  k6: CREATORS.filter((c) => c.status === "approved" && c.followers < 300_000).slice(2, 14).map(toBrandCreator),
};

/* ---------- content review ---------- */
export type ReviewItem = {
  id: string; campaign_id: string; creator: { name: string; handle: string; hue: number; college: string | null };
  kind: "Reel" | "Story" | "Post"; version: number; submitted_hours_ago: number; sla_hours: number;
  caption: string; duration: string; hue: number;
  checks: { label: string; ok: boolean }[];
  history: { version: number; when: string; note: string; by: string; outcome: "changes" | "submitted" }[];
  comments: { who: string; role: "brand" | "agency" | "creator"; when: string; text: string; at?: string }[];
  /** Live mode: playable upload or external link for the current version. */
  media?: { url: string; kind: "video" | "image" | "link" } | null;
};

const CAPS = [
  "Fest-day fuel ✅ We ordered 40 pizzas for the dance crew and they were gone in 6 minutes 🍕 @dominos_india #DominosCampusFest #ad",
  "POV: you're on the fest committee and the pizzas arrive before the DJ 😮‍💨 Use code CAMPUS30 for 30% off 🔗 #DominosCampusFest #ad",
  "Ranking every slice we tried at Mood Indigo — the Peppy Paneer is undefeated. @dominos_india #ad",
  "Midnight prep, midnight pizza. Our hostel's group order ritual before finals 📚🍕 #DominosCampusFest #ad",
];

export const REVIEWS: ReviewItem[] = DELIVERABLES.filter((d) => d.campaign_id === "k1").slice(0, 4).map((d, i) => {
  const c = CREATORS.find((x) => x.id === d.creator_id)!;
  const v = i === 1 ? 2 : i === 3 ? 3 : 1;
  return {
    id: d.id, campaign_id: "k1",
    creator: { name: c.display_name, handle: c.handle, hue: c.hue, college: c.college_name ? (COLLEGES.find((k) => k.id === c.college_id)?.short ?? c.college_name) : null },
    kind: i === 2 ? "Story" : "Reel", version: v, submitted_hours_ago: [21.2, 9.5, 3.1, 26.4][i], sla_hours: 24,
    caption: CAPS[i], duration: ["0:28", "0:19", "0:12", "0:34"][i], hue: c.hue,
    checks: [
      { label: "Tags @dominos_india", ok: i !== 3 },
      { label: "#ad disclosure in first line", ok: i !== 2 },
      { label: "Product visible in first 3 seconds", ok: true },
      { label: "Promo code CAMPUS30 on screen", ok: i % 2 === 1 },
    ],
    history: v === 1
      ? [{ version: 1, when: `${Math.round([21.2, 9.5, 3.1, 26.4][i])}h ago`, note: "First draft", by: c.display_name, outcome: "submitted" }]
      : [
          ...Array.from({ length: v - 1 }, (_, k) => ({ version: k + 1, when: `${3 - k}d ago`, note: k === 0 ? "Logo hidden behind caption; music too loud over voice" : "Promo code missing", by: "Domino's", outcome: "changes" as const })),
          { version: v, when: `${Math.round([21.2, 9.5, 3.1, 26.4][i])}h ago`, note: "Re-cut with product shot up front", by: c.display_name, outcome: "submitted" as const },
        ],
    comments: [
      { who: "Mira Iyer", role: "agency", when: "2h ago", text: "Agency QA passed. Brand-safe, disclosure present, audio is licensed.", },
      ...(v > 1 ? [{ who: "Priya Nair", role: "brand" as const, when: "1d ago", text: "Love the energy. Can we see the box before the slice?", at: "0:04" }] : []),
      { who: c.display_name, role: "creator", when: `${Math.round([21.2, 9.5, 3.1, 26.4][i])}h ago`, text: v > 1 ? "Moved the box reveal to 0:02 and lowered the track." : "Shot at our fest's food court on Saturday. Happy to tweak the hook." },
    ],
  };
});

export const CHANGE_REASONS = ["Product not visible", "Off-brief message", "Caption edit", "Disclosure missing", "Audio / music", "Brand guidelines", "Wrong offer or code"];

/* ---------- report ---------- */
export const REPORTS: Record<string, {
  campaign_id: string; days: { date: string; views: number }[];
  by_city: { label: string; value: number }[]; by_campus: { label: string; value: number }[];
  top: { id: string; handle: string; kind: string; views: number; er: number; hue: number; saves: number }[];
  cpm: number; cpm_bench: number; cpe: number; cpe_bench: number; clicks: number; code_redemptions: number;
}> = {
  k1: {
    campaign_id: "k1",
    days: Array.from({ length: 12 }, (_, i) => ({ date: day(-11 + i), views: [80, 140, 410, 980, 1240, 1080, 760, 650, 590, 720, 510, 240][i] * 1000 })),
    by_city: [{ label: "Mumbai", value: 2_310_000 }, { label: "Pune", value: 1_420_000 }, { label: "Delhi", value: 890_000 }, { label: "Other", value: 200_000 }],
    by_campus: [
      { label: "NMIMS", value: 610_000 }, { label: "Mithibai", value: 540_000 }, { label: "Symbiosis", value: 488_000 },
      { label: "Xavier's", value: 402_000 }, { label: "Fergusson", value: 341_000 }, { label: "SRCC", value: 290_000 }, { label: "Jai Hind", value: 236_000 },
    ],
    top: CREATORS.slice(0, 6).map((c, i) => ({ id: c.id, handle: c.handle, kind: i === 3 ? "Story" : "Reel", views: [612_000, 488_000, 371_000, 290_000, 244_000, 198_000][i], er: [8.9, 7.6, 7.1, 6.4, 6.0, 5.7][i], hue: c.hue, saves: [9_400, 6_100, 5_200, 2_900, 3_300, 2_100][i] })),
    cpm: 151, cpm_bench: 220, cpe: 2.6, cpe_bench: 4.1, clicks: 48_600, code_redemptions: 6_240,
  },
};

/* ============================== ADMIN ============================== */

export type ScreeningExtra = { is_private: boolean; college_email: string | null; id_uploaded: boolean; er_override?: number; signup_source: "Instagram ad" | "Campus ambassador" | "Referral" | "Organic" };

/** Per-creator screening evidence for pending/screening creators (keyed by creator id). */
export const SCREENING: Record<string, ScreeningExtra> = Object.fromEntries(
  CREATORS.filter((c) => c.status !== "approved").map((c, i) => {
    const college = COLLEGES.find((k) => k.id === c.college_id);
    const local = c.handle.replace(/[^a-z]/g, "").slice(0, 10);
    const goodDomain = college?.domains?.[0];
    return [c.id, {
      is_private: i % 5 === 3,
      college_email: c.in_college ? (i % 3 === 1 ? `${local}@gmail.com` : goodDomain ? `${local}@${goodDomain}` : `${local}@gmail.com`) : null,
      id_uploaded: c.in_college && i % 4 !== 2,
      er_override: i % 4 === 0 && c.followers > 20_000 ? Math.round(c.engagement_rate * 0.22 * 100) / 100 : undefined,
      signup_source: (["Instagram ad", "Campus ambassador", "Referral", "Organic"] as const)[i % 4],
    }];
  }),
);

export const FUNNEL = [
  { label: "Started signup", value: 2_140 },
  { label: "Instagram connected", value: 1_736 },
  { label: "Profile complete", value: 1_402 },
  { label: "Screened", value: 1_118 },
  { label: "Approved", value: 884 },
];

export const PERMISSIONS = [
  { key: "talent.view", label: "View talent pool" },
  { key: "talent.approve", label: "Approve / reject creators" },
  { key: "talent.rank", label: "Assign ranks" },
  { key: "campaign.manage", label: "Manage campaigns" },
  { key: "brief.manage", label: "Publish briefs" },
  { key: "pipeline.manage", label: "Move pipeline" },
  { key: "finance.view", label: "View finance & payouts" },
  { key: "member.manage", label: "Invite & manage team" },
  { key: "export", label: "Export data" },
];

export const ROLE_MATRIX: { role: string; label: string; perms: string[] }[] = [
  { role: "founder", label: "Founder", perms: ["*"] },
  { role: "account_manager", label: "Account manager", perms: ["talent.view", "campaign.manage", "brief.manage", "pipeline.manage", "export"] },
  { role: "ops_lead", label: "Ops lead", perms: ["talent.view", "talent.approve", "talent.rank", "pipeline.manage", "member.manage"] },
  { role: "content_reviewer", label: "Content reviewer", perms: ["talent.view", "pipeline.manage"] },
  { role: "finance", label: "Finance", perms: ["talent.view", "finance.view", "export"] },
];

export const TEAM_META: Record<string, { last_active: string; status: "active" | "invited" }> = {
  u1: { last_active: "Now", status: "active" }, u2: { last_active: "4 min ago", status: "active" },
  u3: { last_active: "18 min ago", status: "active" }, u4: { last_active: "1 h ago", status: "active" },
  u5: { last_active: "Yesterday", status: "active" }, u6: { last_active: "3 h ago", status: "active" },
};
export const PENDING_INVITES = [{ email: "neel@vigorlaunchpad.com", role: "Content reviewer", sent: "2 days ago" }];

/* ============================== FOUNDER COCKPIT ============================== */

/** Creator cost, invoicing and collection per campaign (₹). */
export const FINANCE: Record<string, { creator_cost: number; invoiced: number; collected: number }> = {
  k1: { creator_cost: 1_180_000, invoiced: 1_295_000, collected: 925_000 },
  k2: { creator_cost: 690_000, invoiced: 480_000, collected: 480_000 },
  k3: { creator_cost: 402_000, invoiced: 192_000, collected: 0 },
  k4: { creator_cost: 948_000, invoiced: 1_200_000, collected: 600_000 },
  k5: { creator_cost: 268_000, invoiced: 420_000, collected: 420_000 },
};

export const DEALS = [
  { id: "p1", company: "Bisleri Pop", stage: "Negotiation", value: 2_800_000, prob: 0.6, close: day(12), owner: "Rhea Kapoor" },
  { id: "p2", company: "Zepto Café", stage: "Proposal sent", value: 1_600_000, prob: 0.4, close: day(20), owner: "Kunal Shah" },
  { id: "p3", company: "Lenskart", stage: "Proposal sent", value: 750_000, prob: 0.4, close: day(16), owner: "Mira Iyer" },
  { id: "p4", company: "Domino's (Exam-Week)", stage: "Won", value: 1_100_000, prob: 1, close: day(-3), owner: "Kunal Shah" },
  { id: "p5", company: "Minimalist", stage: "Won", value: 380_000, prob: 1, close: day(-6), owner: "Mira Iyer" },
  { id: "p6", company: "Sugar Cosmetics", stage: "Discovery", value: 1_200_000, prob: 0.15, close: day(40), owner: "Rhea Kapoor" },
  { id: "p7", company: "Rapido", stage: "Discovery", value: 900_000, prob: 0.15, close: day(45), owner: "Kunal Shah" },
];
export const DEAL_STAGES = ["Discovery", "Proposal sent", "Negotiation", "Won"] as const;

/** Monthly revenue: booked (won) and probability-weighted pipeline (₹). Last 3 are forecast. */
export const REVENUE_MONTHS = [
  { m: "Jun", won: 1_900_000, weighted: 0 }, { m: "Jul", won: 2_300_000, weighted: 0 }, { m: "Aug", won: 2_050_000, weighted: 0 },
  { m: "Sep", won: 2_900_000, weighted: 0 }, { m: "Oct", won: 3_400_000, weighted: 0 }, { m: "Nov", won: 3_150_000, weighted: 640_000 },
  { m: "Dec", won: 1_480_000, weighted: 2_180_000 }, { m: "Jan", won: 600_000, weighted: 1_420_000 },
];
export const MONTHLY_TARGET = 3_500_000;

export const PAYOUTS = [
  { id: "po1", creator: "Kavya Iyer", campaign: "Freshers' Night Live", amount: 14_000, due: day(-3), status: "late" as const },
  { id: "po2", creator: "Arjun Nair", campaign: "Freshers' Night Live", amount: 9_500, due: day(-1), status: "late" as const },
  { id: "po3", creator: "Meher Shah", campaign: "Campus Fest Takeover", amount: 12_000, due: day(2), status: "due" as const },
  { id: "po4", creator: "Rohan Desai", campaign: "Campus Fest Takeover", amount: 7_500, due: day(4), status: "due" as const },
  { id: "po5", creator: "Tara Sethi", campaign: "Back-to-Campus Drop", amount: 16_000, due: day(6), status: "due" as const },
];
export const PAYOUTS_DUE_TOTAL = 486_000;

export const SLA = {
  review_hours: 24,
  reviews: DELIVERABLES.filter((d) => d.status === "draft_submitted" || d.status === "changes_requested").map((d, i) => {
    const c = CREATORS.find((x) => x.id === d.creator_id)!;
    const camp = CAMPAIGNS.find((x) => x.id === d.campaign_id)!;
    return { id: d.id, handle: c.handle, campaign: camp.name, waiting_hours: [31, 27, 18, 6, 41, 12][i % 6], owner: i % 2 ? "Tanvi Rao" : "Mira Iyer" };
  }),
};

/** Weekly growth (last 8 weeks). */
export const WEEKLY = {
  labels: ["W40", "W41", "W42", "W43", "W44", "W45", "W46", "W47"],
  creators: [612, 680, 702, 810, 795, 902, 1_010, 1_096],
  brands: [2, 1, 3, 2, 4, 3, 5, 4],
  revenue: [520_000, 610_000, 580_000, 720_000, 690_000, 810_000, 860_000, 940_000],
};

/** Approved creator supply vs open brief demand (creator slots), by city × niche. */
export const SUPPLY_DEMAND = {
  cities: ["Mumbai", "Pune", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad"],
  niches: ["Food", "Fashion", "Beauty", "Campus life", "Event hosts", "Fitness"],
  supply: [
    [420, 380, 210, 610, 96, 140],
    [180, 120, 64, 260, 58, 44],
    [210, 260, 150, 240, 40, 90],
    [130, 150, 60, 140, 22, 80],
    [70, 55, 18, 90, 12, 30],
    [48, 40, 12, 60, 30, 16],
  ],
  demand: [
    [140, 90, 80, 150, 24, 20],
    [80, 30, 20, 70, 36, 10],
    [60, 40, 70, 60, 20, 20],
    [40, 60, 30, 50, 10, 10],
    [30, 10, 30, 20, 8, 5],
    [12, 8, 6, 15, 24, 4],
  ],
};

export const TEAM_LOAD = TEAM.map((t, i) => ({ ...t, campaigns: [2, 4, 3, 5, 6, 1][i], tasks: [6, 19, 13, 22, 9, 5][i] }));

export const OPEN_BRIEF_SLOTS = BRIEFS.filter((b) => b.status === "open").reduce((a, b) => a + b.slots, 0);
