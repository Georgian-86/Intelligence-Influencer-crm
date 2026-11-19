/**
 * Deterministic demo dataset. Used when Supabase env vars are absent (or NEXT_PUBLIC_DEMO_MODE=1)
 * so every surface — landing, creator app, agency CRM, brand portal, admin — renders with
 * realistic data for previews, screenshots and sales demos. Shapes mirror the Postgres tables.
 */
import { COLLEGES } from "@/lib/colleges";

/* ---------- tiny seeded RNG so data is stable across renders ---------- */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}
const r = rng(42);
const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
const between = (lo: number, hi: number) => Math.round(lo + r() * (hi - lo));
const daysAgo = (d: number) => new Date(Date.UTC(2026, 10, 19) - d * 86400000).toISOString();
const daysAhead = (d: number) => new Date(Date.UTC(2026, 10, 19) + d * 86400000).toISOString().slice(0, 10);

export type Rank = "bronze" | "silver" | "gold" | "platinum";
export type Stage = "interested" | "shortlisted" | "contacted" | "negotiating" | "confirmed" | "delivered" | "rejected" | "dropped";

export type DemoCreator = {
  id: string;
  display_name: string;
  handle: string;
  city: string;
  gender: "female" | "male" | "non-binary";
  languages: string[];
  bio: string;
  is_influencer: boolean;
  is_event_talent: boolean;
  categories: string[];
  skills: string[];
  status: "pending" | "screening" | "approved" | "rejected";
  rank: Rank;
  rating: number;
  reliability_score: number;
  in_college: boolean;
  college_id: string | null;
  college_name: string | null;
  grad_year: number | null;
  followers: number;
  following: number;
  posts_count: number;
  avg_likes: number;
  avg_comments: number;
  avg_views: number;
  engagement_rate: number;
  verified_insights: boolean;
  audience: { age_18_24: number; female: number; top_cities: { city: string; pct: number }[] };
  rate_per_post: number | null;
  rate_full_day: number | null;
  hue: number; // avatar gradient hue
  joined_at: string;
  last_fetched_at: string;
  growth: number[]; // 12 weekly follower points
  posts: { id: string; type: "reel" | "post" | "carousel"; likes: number; comments: number; views: number; hue: number; caption: string }[];
  phone: string;
  email: string;
};

const FIRST_F = ["Aanya", "Diya", "Ishita", "Kavya", "Meher", "Myra", "Riya", "Saanvi", "Tara", "Zoya", "Anushka", "Nysa", "Sana", "Pihu", "Kiara"];
const FIRST_M = ["Aarav", "Arjun", "Kabir", "Reyansh", "Vihaan", "Ishaan", "Rohan", "Aditya", "Yash", "Dev", "Neil", "Om", "Krish"];
const LAST = ["Mehta", "Shah", "Iyer", "Kapoor", "Nair", "Desai", "Reddy", "Bose", "Malhotra", "Sethi", "Joshi", "Rao", "Khanna", "Pillai", "Gill", "Kulkarni"];
const NICHES = ["Lifestyle", "Fashion", "Beauty", "Food", "Travel", "Fitness", "Tech", "Comedy", "Music", "Dance", "Student / Campus", "Gaming", "Finance"];
const CITIES = ["Mumbai", "Mumbai", "Mumbai", "Pune", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Ahmedabad", "Kolkata"];
const EVENT_SKILLS = ["Anchor", "Brand Promoter", "Event Host / Emcee", "DJ", "Dancer", "Stand-up Comedian", "Singer"];
const CAPTIONS = [
  "Fest season is HERE ✨ who's coming?", "Trying the viral campus café so you don't have to", "GRWM for our college farewell",
  "3 study hacks that saved my semester", "Mumbai monsoon diaries 🌧️", "This drop sold out in 4 minutes", "POV: your first internship day",
  "Rating every chai stall near campus", "Behind the scenes of our dance crew's routine", "My ₹500 weekend in Pune",
];

const RANKS: Rank[] = ["bronze", "silver", "silver", "gold", "gold", "platinum"];

function makeCreator(i: number): DemoCreator {
  const female = r() > 0.42;
  const first = female ? pick(FIRST_F) : pick(FIRST_M);
  const last = pick(LAST);
  const city = pick(CITIES);
  const inCollege = r() > 0.28;
  const cityColleges = COLLEGES.filter((c) => c.city === city);
  const college = inCollege && cityColleges.length ? pick(cityColleges) : null;
  const tier = r();
  const followers = tier > 0.9 ? between(250_000, 1_200_000) : tier > 0.6 ? between(50_000, 250_000) : tier > 0.25 ? between(10_000, 50_000) : between(2_000, 10_000);
  const er = Math.round((followers > 250_000 ? 1.6 + r() * 2.4 : followers > 50_000 ? 2.4 + r() * 3.6 : 3.5 + r() * 6.5) * 100) / 100;
  const avgLikes = Math.round((followers * er) / 100 * 0.93);
  const avgComments = Math.round((followers * er) / 100 * 0.07);
  const isEvent = r() > 0.6;
  const cats = Array.from(new Set([pick(NICHES), pick(NICHES), ...(inCollege ? ["Student / Campus"] : [])])).slice(0, 3);
  const handle = `${first}.${last}`.toLowerCase() + (r() > 0.5 ? "" : `_${between(1, 99)}`);
  const hue = between(0, 360);
  let f = followers * (0.78 + r() * 0.08);
  const growth = Array.from({ length: 12 }, () => (f = f * (1 + (r() * 0.035 - 0.004))) | 0);
  growth[11] = followers;
  const rank = followers > 250_000 ? "platinum" : pick(RANKS);
  return {
    id: `c${String(i).padStart(3, "0")}`,
    display_name: `${first} ${last}`,
    handle,
    city,
    gender: female ? "female" : "male",
    languages: ["English", "Hindi", ...(city === "Mumbai" || city === "Pune" ? ["Marathi"] : city === "Chennai" ? ["Tamil"] : [])].slice(0, between(2, 3)),
    bio: `${cats[0]} · ${college ? `${college.short ?? college.name} '${String(between(26, 29))}` : city} · collabs via DM`,
    is_influencer: true,
    is_event_talent: isEvent,
    categories: cats,
    skills: isEvent ? [pick(EVENT_SKILLS), pick(EVENT_SKILLS)].filter((v, k, a) => a.indexOf(v) === k) : [],
    status: i < 26 ? "approved" : pick(["pending", "screening", "pending"] as const),
    rank,
    rating: Math.round((3.6 + r() * 1.4) * 10) / 10,
    reliability_score: between(72, 99),
    in_college: !!college,
    college_id: college?.id ?? null,
    college_name: college?.name ?? null,
    grad_year: college ? between(2026, 2029) : null,
    followers,
    following: between(300, 1800),
    posts_count: between(60, 900),
    avg_likes: avgLikes,
    avg_comments: avgComments,
    avg_views: Math.round(followers * (0.6 + r() * 1.8)),
    engagement_rate: er,
    verified_insights: r() > 0.55,
    audience: {
      age_18_24: between(38, 78),
      female: female ? between(52, 74) : between(28, 52),
      top_cities: [{ city, pct: between(28, 46) }, { city: city === "Mumbai" ? "Pune" : "Mumbai", pct: between(8, 16) }, { city: "Delhi", pct: between(5, 10) }],
    },
    rate_per_post: Math.round(Math.max(1500, followers * (0.04 + r() * 0.05)) / 500) * 500,
    rate_full_day: isEvent ? between(6, 30) * 1000 : null,
    hue,
    joined_at: daysAgo(between(3, 280)),
    last_fetched_at: daysAgo(between(0, 3)),
    growth,
    posts: Array.from({ length: 9 }, (_, k) => {
      const views = Math.round(followers * (0.4 + r() * 2.2));
      return { id: `${i}-${k}`, type: pick(["reel", "reel", "post", "carousel"] as const), likes: Math.round(avgLikes * (0.6 + r() * 0.9)), comments: Math.round(avgComments * (0.5 + r())), views, hue: (hue + k * 23) % 360, caption: pick(CAPTIONS) };
    }),
    phone: `+91 98${between(10, 99)}${between(100000, 999999)}`,
    email: `${handle.replace(/[^a-z]/g, "")}@gmail.com`,
  };
}

export const CREATORS: DemoCreator[] = Array.from({ length: 36 }, (_, i) => makeCreator(i + 1));

/** The signed-in demo creator. */
export const ME: DemoCreator = {
  ...CREATORS[0],
  id: "c000",
  display_name: "Aanya Mehta",
  handle: "aanya.mehta",
  city: "Mumbai",
  gender: "female",
  in_college: true,
  college_id: COLLEGES.find((c) => c.short === "NMIMS")!.id,
  college_name: "SVKM's NMIMS",
  grad_year: 2027,
  categories: ["Fashion", "Lifestyle", "Student / Campus"],
  followers: 48_200,
  engagement_rate: 6.4,
  avg_likes: 2_870,
  avg_comments: 214,
  avg_views: 61_000,
  rank: "gold",
  status: "approved",
  bio: "Fashion & campus life · NMIMS '27 · Mumbai",
  verified_insights: false,
  rate_per_post: 6500,
};

/* ---------- agency side ---------- */
export type DemoCampaign = {
  id: string; name: string; brand_name: string; status: "planning" | "active" | "completed";
  start_date: string; end_date: string; budget: number; spent: number; owner: string;
  creators_confirmed: number; creators_target: number; deliverables_live: number; deliverables_total: number;
  reach: number; views: number; er: number; cities: string[]; colleges: number; hue: number;
  health: "on_track" | "at_risk" | "blocked";
};

export const TEAM = [
  { id: "u1", name: "Rhea Kapoor", role: "Founder", email: "rhea@vigorlaunchpad.com", load: 0.55, hue: 228 },
  { id: "u2", name: "Kunal Shah", role: "Account manager", email: "kunal@vigorlaunchpad.com", load: 0.86, hue: 12 },
  { id: "u3", name: "Mira Iyer", role: "Account manager", email: "mira@vigorlaunchpad.com", load: 0.64, hue: 160 },
  { id: "u4", name: "Sahil Desai", role: "Ops lead", email: "sahil@vigorlaunchpad.com", load: 0.92, hue: 280 },
  { id: "u5", name: "Tanvi Rao", role: "Content reviewer", email: "tanvi@vigorlaunchpad.com", load: 0.4, hue: 330 },
  { id: "u6", name: "Arnav Joshi", role: "Finance", email: "arnav@vigorlaunchpad.com", load: 0.3, hue: 45 },
];

export const CAMPAIGNS: DemoCampaign[] = [
  { id: "k1", name: "Campus Fest Takeover '26", brand_name: "Domino's", status: "active", start_date: daysAhead(-12), end_date: daysAhead(18), budget: 1_850_000, spent: 1_120_000, owner: "Kunal Shah", creators_confirmed: 42, creators_target: 50, deliverables_live: 61, deliverables_total: 100, reach: 4_820_000, views: 7_400_000, er: 5.8, cities: ["Mumbai", "Pune", "Delhi"], colleges: 24, hue: 8, health: "on_track" },
  { id: "k2", name: "Back-to-Campus Drop", brand_name: "NUUK", status: "active", start_date: daysAhead(-4), end_date: daysAhead(26), budget: 960_000, spent: 310_000, owner: "Mira Iyer", creators_confirmed: 18, creators_target: 30, deliverables_live: 9, deliverables_total: 60, reach: 1_240_000, views: 2_050_000, er: 6.9, cities: ["Mumbai", "Bangalore"], colleges: 11, hue: 200, health: "at_risk" },
  { id: "k3", name: "Glow Week Sampling", brand_name: "Nua", status: "planning", start_date: daysAhead(9), end_date: daysAhead(30), budget: 640_000, spent: 0, owner: "Kunal Shah", creators_confirmed: 4, creators_target: 25, deliverables_live: 0, deliverables_total: 40, reach: 0, views: 0, er: 0, cities: ["Mumbai", "Delhi", "Hyderabad"], colleges: 8, hue: 320, health: "on_track" },
  { id: "k4", name: "Freshers' Night Live", brand_name: "boAt", status: "active", start_date: daysAhead(-20), end_date: daysAhead(3), budget: 1_200_000, spent: 1_090_000, owner: "Mira Iyer", creators_confirmed: 30, creators_target: 30, deliverables_live: 52, deliverables_total: 60, reach: 3_300_000, views: 5_900_000, er: 4.7, cities: ["Pune", "Ahmedabad"], colleges: 14, hue: 260, health: "blocked" },
  { id: "k5", name: "Monsoon Menu Launch", brand_name: "Chaayos", status: "completed", start_date: daysAhead(-70), end_date: daysAhead(-38), budget: 420_000, spent: 405_000, owner: "Kunal Shah", creators_confirmed: 16, creators_target: 16, deliverables_live: 32, deliverables_total: 32, reach: 1_900_000, views: 3_100_000, er: 7.2, cities: ["Mumbai"], colleges: 6, hue: 30, health: "on_track" },
];

export type DemoBrief = {
  id: string; campaign_id: string; title: string; brand_display: string; talent_kind: "influencer" | "event" | "any";
  categories: string[]; cities: string[]; colleges_only: boolean; min_followers: number | null; max_followers: number | null;
  min_engagement: number | null; deliverables: string; budget_min: number; budget_max: number; apply_by: string;
  event_date: string | null; status: "draft" | "open" | "closed"; applicants: number; slots: number; hue: number; description: string;
};

export const BRIEFS: DemoBrief[] = [
  { id: "b1", campaign_id: "k1", title: "Fest-day pizza reels", brand_display: "Domino's", talent_kind: "influencer", categories: ["Food", "Student / Campus"], cities: ["Mumbai", "Pune"], colleges_only: true, min_followers: 10_000, max_followers: 150_000, min_engagement: 3, deliverables: "1 Reel + 3 Stories (with link sticker)", budget_min: 4000, budget_max: 12000, apply_by: daysAhead(4), event_date: daysAhead(9), status: "open", applicants: 86, slots: 20, hue: 8, description: "Capture the energy of your college fest with a pizza-drop moment. We'll ship the pizzas — you bring the crowd." },
  { id: "b2", campaign_id: "k2", title: "Back-to-campus fit check", brand_display: "NUUK", talent_kind: "influencer", categories: ["Fashion", "Lifestyle"], cities: ["Mumbai", "Bangalore"], colleges_only: true, min_followers: 15_000, max_followers: 300_000, min_engagement: 3.5, deliverables: "1 Reel (GRWM) + 2 Stories", budget_min: 6000, budget_max: 18000, apply_by: daysAhead(6), event_date: null, status: "open", applicants: 54, slots: 12, hue: 200, description: "Style three NUUK pieces for a first-day-back outfit. Natural light, real campus locations, no studio." },
  { id: "b3", campaign_id: "k4", title: "Freshers' Night emcees", brand_display: "Consumer audio brand", talent_kind: "event", categories: ["Event Host / Emcee", "Anchor"], cities: ["Pune", "Ahmedabad"], colleges_only: false, min_followers: null, max_followers: null, min_engagement: null, deliverables: "Host a 4-hour freshers' night + 1 recap Story", budget_min: 8000, budget_max: 15000, apply_by: daysAhead(2), event_date: daysAhead(7), status: "open", applicants: 23, slots: 4, hue: 260, description: "High-energy bilingual hosts for freshers' nights across 6 campuses. Script and run-of-show provided." },
  { id: "b4", campaign_id: "k3", title: "Skincare sampling at campus", brand_display: "Beauty brand (confidential)", talent_kind: "any", categories: ["Beauty", "Brand Promoter"], cities: ["Mumbai", "Delhi", "Hyderabad"], colleges_only: true, min_followers: 5_000, max_followers: 80_000, min_engagement: 4, deliverables: "2-day sampling stall + 1 Reel", budget_min: 5000, budget_max: 9000, apply_by: daysAhead(10), event_date: daysAhead(14), status: "open", applicants: 12, slots: 30, hue: 320, description: "Run a sampling stall at your own campus and share your honest first impressions." },
  { id: "b5", campaign_id: "k5", title: "Monsoon menu taste test", brand_display: "Chaayos", talent_kind: "influencer", categories: ["Food"], cities: ["Mumbai"], colleges_only: false, min_followers: 8_000, max_followers: 120_000, min_engagement: 3, deliverables: "1 Reel", budget_min: 3000, budget_max: 8000, apply_by: daysAhead(-40), event_date: null, status: "closed", applicants: 140, slots: 16, hue: 30, description: "Taste-test the monsoon menu on camera." },
];

export type DemoIntent = { id: string; brief_id: string; creator_id: string; stage: Stage; quoted_rate: number; agreed_rate: number | null; updated_at: string; match: number; source: "applied" | "invited" };

export const INTENTS: DemoIntent[] = CREATORS.slice(0, 30).flatMap((c, i) => {
  const stages: Stage[] = ["interested", "interested", "shortlisted", "shortlisted", "contacted", "negotiating", "confirmed", "confirmed", "delivered", "rejected"];
  const b = BRIEFS[i % 4];
  const stage = stages[i % stages.length];
  return [{ id: `i${i}`, brief_id: b.id, creator_id: c.id, stage, quoted_rate: c.rate_per_post ?? 5000, agreed_rate: ["confirmed", "delivered"].includes(stage) ? Math.round((c.rate_per_post ?? 5000) * 0.9) : null, updated_at: daysAgo(i % 6), match: between(62, 98), source: i % 3 ? "applied" : "invited" }];
});

/** My (the demo creator's) applications. */
export const MY_APPLICATIONS = [
  { brief_id: "b1", stage: "shortlisted" as Stage, updated_at: daysAgo(1), next: "Brand is reviewing shortlists — decision by Fri" },
  { brief_id: "b2", stage: "confirmed" as Stage, updated_at: daysAgo(2), next: "Submit your draft Reel by " + daysAhead(3) },
  { brief_id: "b5", stage: "delivered" as Stage, updated_at: daysAgo(38), next: "Payment of ₹6,500 released" },
];

export type DemoDeliverable = { id: string; campaign_id: string; creator_id: string; kind: "Reel" | "Story" | "Post" | "Event"; status: "brief_sent" | "draft_submitted" | "changes_requested" | "approved" | "live" | "overdue"; due: string; version: number; views: number | null; hue: number };
export const DELIVERABLES: DemoDeliverable[] = CREATORS.slice(0, 18).map((c, i) => ({
  id: `d${i}`, campaign_id: i % 2 ? "k2" : "k1", creator_id: c.id, kind: (["Reel", "Story", "Reel", "Post", "Event"] as const)[i % 5],
  status: (["draft_submitted", "changes_requested", "approved", "live", "live", "overdue", "brief_sent", "draft_submitted"] as const)[i % 8],
  due: daysAhead((i % 7) - 2), version: 1 + (i % 3), views: i % 8 === 3 || i % 8 === 4 ? between(20_000, 400_000) : null, hue: c.hue,
}));

export const ENQUIRIES = [
  { id: "e1", company: "Zepto Café", contact: "Neha Arora", channel: "WhatsApp", budget: "₹10–25L", objective: "Campus sampling in 12 colleges", status: "new" as const, received: daysAgo(0) },
  { id: "e2", company: "Lenskart", contact: "Varun T.", channel: "Website", budget: "₹5–10L", objective: "Back-to-college eyewear reels", status: "in_progress" as const, received: daysAgo(1) },
  { id: "e3", company: "Bisleri Pop", contact: "Ananya G.", channel: "Email", budget: "₹25L+", objective: "Fest title sponsorship + 80 creators", status: "new" as const, received: daysAgo(2) },
  { id: "e4", company: "Minimalist", contact: "Rahul S.", channel: "Referral", budget: "₹2–5L", objective: "Skincare UGC from students", status: "converted" as const, received: daysAgo(9) },
];

export const ACTIVITY = [
  { who: "Tanvi Rao", what: "approved Reel v2 from", target: "@kavya.iyer", when: "4m", kind: "approve" },
  { who: "Domino's (brand)", what: "shortlisted 6 creators in", target: "Fest-day pizza reels", when: "18m", kind: "brand" },
  { who: "WhatsApp bot", what: "delivered brief to 212 creators for", target: "Back-to-campus fit check", when: "1h", kind: "whatsapp" },
  { who: "Kunal Shah", what: "moved 4 creators to Confirmed in", target: "Campus Fest Takeover", when: "2h", kind: "pipeline" },
  { who: "System", what: "refreshed Instagram stats for", target: "1,284 creators", when: "3h", kind: "system" },
  { who: "Arnav Joshi", what: "released payouts worth ₹1.8L for", target: "Monsoon Menu Launch", when: "5h", kind: "money" },
];

export const PLATFORM_STATS = {
  creators: 12_480, campuses: 342, cities: 38, brands: 64, briefs_live: 17, reach_month: 48_200_000,
  pending_review: CREATORS.filter((c) => c.status !== "approved").length + 41,
  signups_week: [182, 204, 236, 198, 260, 312, 344],
};

export const getCreator = (id: string) => (id === ME.id ? ME : CREATORS.find((c) => c.id === id));
export const getBrief = (id: string) => BRIEFS.find((b) => b.id === id);
export const getCampaign = (id: string) => CAMPAIGNS.find((c) => c.id === id);
