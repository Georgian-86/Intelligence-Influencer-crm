/**
 * Extra deterministic fixtures for the agency CRM (demo mode only).
 * Builds on lib/demo/fixtures.ts — never mutates it. Everything here is derived from
 * stable seeds so server and client renders always agree.
 */
import { ACTIVITY, BRIEFS, CAMPAIGNS, CREATORS, DELIVERABLES, ENQUIRIES, INTENTS, TEAM, type DemoCreator } from "./fixtures";

/** "Today" for the demo dataset (fixtures are anchored on 19 Nov 2026). */
export const DEMO_NOW = Date.UTC(2026, 10, 19, 4, 30); // 10:00 IST

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/* ---------- creators ---------- */
export type Availability = "available" | "busy" | "away";
export function availabilityOf(id: string): Availability {
  const h = hash(id) % 10;
  return h < 6 ? "available" : h < 9 ? "busy" : "away";
}

export function notesFor(c: DemoCreator) {
  const r = rng(hash(c.id));
  const pool = [
    `Delivered 2 days early on the last brief. Prefers WhatsApp voice notes over calls.`,
    `Rate card shared: ₹${(c.rate_per_post ?? 5000).toLocaleString("en-IN")} per Reel, Stories bundled free with a Reel.`,
    `Strong with ${c.categories[0]?.toLowerCase() ?? "lifestyle"} hooks — first 2 seconds always land. Ask for raw files.`,
    `Exams until the 2nd — keep asks light that week.`,
    `Brand team loved the last draft; minimal edits. Good fit for repeat work.`,
  ];
  const authors = [TEAM[1], TEAM[2], TEAM[4]];
  return [0, 1].map((k) => ({
    id: `${c.id}-n${k}`,
    body: pool[Math.floor(r() * pool.length)],
    author: authors[Math.floor(r() * authors.length)].name,
    at: new Date(DEMO_NOW - (k * 9 + Math.floor(r() * 6) + 1) * 86400000).toISOString(),
  }));
}

/* ---------- campaigns ---------- */
export const HEALTH_REASON: Record<string, string> = {
  k1: "42 of 50 creators confirmed, deliverables pacing ahead of plan",
  k2: "12 creator slots still open with 26 days left — shortlist is thin in Bangalore",
  k3: "Briefs go out Monday; sampling kits confirmed with the brand",
  k4: "Venue permission at MIT-WPU pending — 8 event deliverables can't go live",
  k5: "Wrapped. Final report shared with the brand on 12 Oct",
};

/** 12 weekly points used for KPI sparklines. */
export const KPI_SERIES = {
  reach: [5.1, 5.3, 5.9, 6.1, 6.6, 6.8, 7.4, 7.6, 8.1, 8.3, 8.9, 9.4].map((v) => v * 1_000_000),
  live: [64, 70, 73, 79, 84, 88, 95, 101, 106, 111, 117, 122],
  confirmed: [52, 55, 59, 61, 66, 70, 73, 77, 82, 86, 90, 94],
  spend: [0.6, 0.9, 1.1, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.5, 2.7, 2.9].map((v) => v * 1_000_000),
};

/** 14 daily view points per campaign for the report tab. */
export function dailyViews(campaignId: string) {
  const c = CAMPAIGNS.find((x) => x.id === campaignId);
  const total = c?.views ?? 0;
  const r = rng(hash(campaignId));
  const raw = Array.from({ length: 14 }, (_, i) => (0.4 + i / 10) * (0.7 + r() * 0.6));
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  return raw.map((v) => Math.round((v / sum) * total));
}

export function cityReach(campaignId: string) {
  const c = CAMPAIGNS.find((x) => x.id === campaignId);
  if (!c || !c.reach) return [];
  const r = rng(hash(campaignId) + 3);
  const w = c.cities.map((_, i) => (c.cities.length - i) * (0.8 + r() * 0.4));
  const sum = w.reduce((a, b) => a + b, 0);
  return c.cities.map((city, i) => ({ label: city, value: Math.round((w[i] / sum) * c.reach) }));
}

/** Fixture deliverables can carry an "overdue" status with a future date; pin those into the past. */
export function deliverableDue(d: { id: string; status: string; due: string }) {
  if (d.status !== "overdue") return d.due;
  const back = 1 + (hash(d.id) % 3);
  return new Date(DEMO_NOW - back * 86400000).toISOString().slice(0, 10);
}

/* ---------- review room ---------- */
export type ReviewComment = { id: string; who: string; role: "Agency" | "Brand" | "Creator"; body: string; at: string; version: number; hue: number; resolved?: boolean };
export type Submission = {
  deliverable_id: string; campaign_id: string; creator_id: string; kind: string; status: string; due: string; hue: number;
  versions: { v: number; at: string; caption: string; duration: string; url?: string | null; media?: "video" | "image" | "link" }[];
  comments: ReviewComment[]; brand_visible: boolean;
  checklist: { label: string; ok: boolean }[];
};

const CAPTIONS = [
  "Fest day just got cheesier 🍕 Dropping pizzas at the quad at 4 — who's in? #DominosCampusFest #ad",
  "First day back fit, thrifted top + @nuuk.in cargos. Rate it 1–10 👇 #BackToCampus #ad",
  "POV: the pizza truck pulls up mid-lecture. Tag your fest crew 🎉 #DominosCampusFest",
  "Styled three ways for campus week — which one's you? @nuuk.in #ad",
];

export function submissionsFor(campaignId: string): Submission[] {
  const camp = CAMPAIGNS.find((c) => c.id === campaignId);
  const brand = camp?.brand_name ?? "Brand";
  return DELIVERABLES.filter((d) => d.campaign_id === campaignId && ["draft_submitted", "changes_requested", "approved", "live"].includes(d.status)).map((d, i) => {
    const creator = CREATORS.find((c) => c.id === d.creator_id)!;
    const r = rng(hash(d.id));
    const versions = Array.from({ length: d.version }, (_, k) => ({
      v: k + 1,
      at: new Date(DEMO_NOW - (d.version - k) * 26 * 3600000 - Math.floor(r() * 5) * 3600000).toISOString(),
      caption: CAPTIONS[(i + k) % CAPTIONS.length],
      duration: `0:${String(18 + Math.floor(r() * 40)).padStart(2, "0")}`,
    }));
    const comments: ReviewComment[] = [];
    versions.forEach((v) => {
      comments.push({ id: `${d.id}-c${v.v}a`, who: creator.display_name, role: "Creator", body: v.v === 1 ? "First cut is up! Shot at the canteen around 5pm for the golden light." : `v${v.v} uploaded — fixed the points from last round.`, at: v.at, version: v.v, hue: creator.hue });
      if (v.v < d.version || d.status === "changes_requested" || d.status === "approved" || d.status === "live") {
        comments.push({ id: `${d.id}-c${v.v}b`, who: "Tanvi Rao", role: "Agency", body: v.v < d.version ? "Hook is great. Please move the #ad disclosure into the first line of the caption and show the logo in the first 3 seconds." : d.status === "changes_requested" ? "Audio is clipping at 0:12 — can you re-export with the music at -6dB?" : "Looks great, approved on our side.", at: new Date(new Date(v.at).getTime() + 3 * 3600000).toISOString(), version: v.v, hue: 330, resolved: v.v < d.version });
      }
      if (v.v === d.version && (d.status === "approved" || d.status === "live")) {
        comments.push({ id: `${d.id}-c${v.v}c`, who: `${brand} team`, role: "Brand", body: "Love this. Cleared for posting 🙌", at: new Date(new Date(v.at).getTime() + 7 * 3600000).toISOString(), version: v.v, hue: camp?.hue ?? 228 });
      }
    });
    const late = d.version > 1;
    return {
      deliverable_id: d.id, campaign_id: campaignId, creator_id: creator.id, kind: d.kind, status: d.status, due: d.due, hue: d.hue,
      versions, comments, brand_visible: d.status !== "draft_submitted" || i % 2 === 0,
      checklist: [
        { label: `Tags @${brand.toLowerCase().replace(/[^a-z]/g, "")}`, ok: true },
        { label: "#ad disclosure in first line", ok: late || d.status !== "draft_submitted" },
        { label: "Logo visible in first 3s", ok: d.status !== "changes_requested" },
        { label: "Link sticker on Story", ok: d.kind !== "Story" || late },
      ],
    };
  });
}

/* ---------- enquiries ---------- */
export const ENQUIRY_DETAILS: Record<string, { message: string; email: string; phone: string; city: string }> = {
  e1: { message: "Hi team! We're opening Zepto Cafés near 12 Mumbai & Pune campuses in Dec. Want sampling stalls + 20 student creators doing reels. Budget 10–25L. Can we talk this week?", email: "neha@zeptocafe.in", phone: "+91 98201 44120", city: "Mumbai" },
  e2: { message: "Looking for 30 college creators for back-to-college eyewear reels, Jan launch. Mostly Delhi + Bangalore.", email: "varun.t@lenskart.in", phone: "+91 99100 23841", city: "Delhi" },
  e3: { message: "We want title sponsorship at 3 big fests (Mood Indigo, Malhar, Umang) plus 80 creators. Please share a deck and rate card.", email: "ananya.g@bisleripop.com", phone: "+91 97690 11273", city: "Mumbai" },
  e4: { message: "Skincare UGC from students, 15 creators, honest reviews. Referred by Chaayos team.", email: "rahul@beminimalist.co", phone: "+91 90040 66218", city: "Bangalore" },
};

export const EXTRA_ENQUIRIES = [
  { id: "e5", company: "Bewakoof", contact: "Ishaan P.", channel: "Instagram", budget: "₹5–10L", objective: "Fest merch drops with 25 campus creators", status: "in_progress" as const, received: new Date(DEMO_NOW - 3 * 86400000).toISOString() },
  { id: "e6", company: "Swiggy Minis", contact: "Pooja K.", channel: "WhatsApp", budget: "₹2–5L", objective: "Hostel-night snack box reels", status: "new" as const, received: new Date(DEMO_NOW - 5 * 3600000).toISOString() },
];
Object.assign(ENQUIRY_DETAILS, {
  e5: { message: "Planning a fest merch drop — need 25 creators across Pune and Mumbai to wear + review. Timeline: mid-Dec.", email: "ishaan@bewakoof.com", phone: "+91 98330 77810", city: "Pune" },
  e6: { message: "Hey! Can Vigor do 10 hostel creators for a late-night snack box reel series? Small test budget first.", email: "pooja.k@swiggy.in", phone: "+91 88790 32019", city: "Bangalore" },
});
export const ALL_ENQUIRIES = [...ENQUIRIES, ...EXTRA_ENQUIRIES];

/* ---------- today queue ---------- */
export type QueueItem = {
  id: string; kind: "review" | "overdue" | "enquiry" | "reply";
  title: string; meta: string; href: string; action: string; secondary?: { label: string; href: string };
  hue: number; who: string; age: string; campaign?: string;
};

export function todayQueue(): QueueItem[] {
  const c = (id: string) => CREATORS.find((x) => x.id === id)!;
  const camp = (id: string) => CAMPAIGNS.find((x) => x.id === id)!;
  const drafts = DELIVERABLES.filter((d) => d.status === "draft_submitted").slice(0, 2).map<QueueItem>((d) => ({
    id: `q-${d.id}`, kind: "review", title: `${d.kind} v${d.version} from ${c(d.creator_id).display_name}`, meta: camp(d.campaign_id).name,
    href: `/crm/campaigns/${d.campaign_id}/review?d=${d.id}`, action: "Review draft", hue: c(d.creator_id).hue, who: c(d.creator_id).display_name, age: `${2 + (d.version % 3)}h`, campaign: camp(d.campaign_id).brand_name,
  }));
  const overdue = DELIVERABLES.filter((d) => d.status === "overdue").slice(0, 2).map<QueueItem>((d) => ({
    id: `q-${d.id}`, kind: "overdue", title: `${d.kind} overdue · ${c(d.creator_id).display_name}`, meta: `${camp(d.campaign_id).name} · was due ${Number(deliverableDue(d).slice(8))} Nov`,
    href: `https://wa.me/${c(d.creator_id).phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${c(d.creator_id).display_name.split(" ")[0]}, quick nudge on your ${d.kind} for ${camp(d.campaign_id).brand_name} — can you share the draft today?`)}`,
    action: "Nudge on WhatsApp", secondary: { label: "Open", href: `/crm/campaigns/${d.campaign_id}?tab=deliverables` }, hue: c(d.creator_id).hue, who: c(d.creator_id).display_name, age: "1d", campaign: camp(d.campaign_id).brand_name,
  }));
  const enquiries = ALL_ENQUIRIES.filter((e) => e.status === "new").slice(0, 2).map<QueueItem>((e, i) => ({
    id: `q-${e.id}`, kind: "enquiry", title: `${e.company} · ${e.budget}`, meta: e.objective, href: "/crm/enquiries", action: "Reply",
    hue: (hash(e.company) % 360), who: e.company, age: i ? "2d" : "38m",
  }));
  const replies = INTENTS.filter((x) => x.stage === "negotiating").slice(0, 2).map<QueueItem>((x) => {
    const cr = c(x.creator_id);
    const b = BRIEFS.find((bb) => bb.id === x.brief_id)!;
    return {
      id: `q-${x.id}`, kind: "reply", title: `${cr.display_name} countered at ₹${Math.round(x.quoted_rate * 1.15).toLocaleString("en-IN")}`, meta: b.title,
      href: `/crm/campaigns/${b.campaign_id}`, action: "Reply", secondary: { label: "Profile", href: `/crm/talent/${cr.id}` }, hue: cr.hue, who: cr.display_name, age: "5h", campaign: b.brand_display,
    };
  });
  return [...drafts, ...overdue, ...enquiries, ...replies];
}

export const ACTIVITY_FEED = [
  ...ACTIVITY,
  { who: "Mira Iyer", what: "replied on WhatsApp to", target: "Zepto Café", when: "6h", kind: "whatsapp" },
  { who: "Lenskart (brand)", what: "opened the review room for", target: "Back-to-Campus Drop", when: "8h", kind: "brand" },
];

/* ---------- talent search ---------- */
export const SAVED_VIEWS = [
  { id: "all", name: "All approved", query: "" },
  { id: "mum-campus", name: "Mumbai campus micro", query: "city=Mumbai&campus=1&tier=micro" },
  { id: "food-er", name: "Food · ER 5%+", query: "niche=Food&er=5" },
  { id: "verified", name: "Verified, available", query: "verified=1&avail=available" },
];

/* ---------- pipeline (fixtures INTENTS + deterministic extras so boards feel lived-in) ---------- */
export type DemoPipelineIntent = { id: string; brief_id: string; creator_id: string; stage: "interested" | "shortlisted" | "contacted" | "negotiating" | "confirmed" | "delivered"; quoted_rate: number; agreed_rate: number | null; match: number; source: "applied" | "invited"; updated_at: string };

export function pipelineFor(briefIds: string[]): DemoPipelineIntent[] {
  const base = INTENTS.filter((i) => briefIds.includes(i.brief_id) && i.stage !== "rejected" && i.stage !== "dropped") as DemoPipelineIntent[];
  const used = new Set(base.map((i) => `${i.brief_id}:${i.creator_id}`));
  const extra: DemoPipelineIntent[] = [];
  const stages: DemoPipelineIntent["stage"][] = ["interested", "interested", "interested", "shortlisted", "shortlisted", "contacted", "negotiating", "confirmed", "confirmed", "delivered"];
  briefIds.forEach((bid) => {
    const r = rng(hash(bid));
    CREATORS.filter((c) => c.status === "approved").forEach((c, k) => {
      if (used.has(`${bid}:${c.id}`) || r() > 0.42) return;
      const stage = stages[Math.floor(r() * stages.length)];
      const q = c.rate_per_post ?? 5000;
      extra.push({ id: `x-${bid}-${c.id}`, brief_id: bid, creator_id: c.id, stage, quoted_rate: q, agreed_rate: stage === "confirmed" || stage === "delivered" ? Math.round((q * 0.9) / 100) * 100 : null, match: 64 + Math.floor(r() * 34), source: k % 3 ? "applied" : "invited", updated_at: new Date(DEMO_NOW - Math.floor(r() * 120) * 3600000).toISOString() });
    });
  });
  return [...base, ...extra];
}

/* ---------- WhatsApp ---------- */
export const WA_COST_PER_CONVERSATION = 0.86; // ₹ per marketing conversation (Meta India rate card)

export const SAMPLE_BRAND_MESSAGE = `Hi Kunal! Domino's here 👋
For our Campus Fest push we need ~20 student creators in Mumbai and Pune — food + campus content, 10k to 150k followers, engagement 3%+.
Each does 1 Reel + 3 Stories with the link sticker. Budget ₹4,000–12,000 per creator.
Applications by 24 Nov, fest day is 28 Nov. Only college students please!
— Ritika, Domino's India`;
