/**
 * Deterministic brief extractor: turns a pasted brand email / WhatsApp message into structured
 * brief fields. Used directly in demo mode and as the fallback for the live LLM extractor.
 */
import { CITIES } from "@/lib/constants";

export type ParsedBrief = {
  title: string;
  brand_display: string;
  talent_kind: "influencer" | "event" | "any";
  cities: string[];
  colleges_only: boolean;
  categories: string[];
  min_followers: number | null;
  max_followers: number | null;
  min_engagement: number | null;
  deliverables: string;
  budget_min: number | null;
  budget_max: number | null;
  apply_by: string;
  event_date: string;
  slots: number | null;
  description: string;
};

export const EMPTY_BRIEF: ParsedBrief = {
  title: "", brand_display: "", talent_kind: "influencer", cities: [], colleges_only: false, categories: [],
  min_followers: null, max_followers: null, min_engagement: null, deliverables: "", budget_min: null, budget_max: null,
  apply_by: "", event_date: "", slots: null, description: "",
};

const BRANDS = ["Domino's", "NUUK", "Nua", "boAt", "Chaayos", "Zepto Café", "Zepto", "Lenskart", "Bisleri Pop", "Bisleri", "Minimalist", "Bewakoof", "Swiggy", "Nykaa", "Mamaearth", "Red Bull", "Spotify"];
const ALIASES: Record<string, string> = { bombay: "Mumbai", bengaluru: "Bangalore", gurgaon: "Delhi", gurugram: "Delhi", noida: "Delhi" };
const NICHE_WORDS: [RegExp, string][] = [
  [/\b(food|pizza|caf[eé]|snack|chai|burger|menu|biryani)\b/i, "Food"],
  [/\b(fashion|outfit|fit check|style|apparel|merch|wear)\b/i, "Fashion"],
  [/\b(beauty|skincare|makeup|glow|serum)\b/i, "Beauty"],
  [/\b(campus|student|college|hostel|fest)\b/i, "Student / Campus"],
  [/\b(tech|gadget|audio|earbuds|phone)\b/i, "Tech"],
  [/\b(fitness|gym|workout)\b/i, "Fitness"],
  [/\b(travel|trip)\b/i, "Travel"],
  [/\b(comedy|funny|skit)\b/i, "Comedy"],
  [/\b(music|dj|concert)\b/i, "Music"],
  [/\b(dance|choreo)\b/i, "Dance"],
  [/\b(lifestyle|grwm|vlog)\b/i, "Lifestyle"],
  [/\b(gaming|esports)\b/i, "Gaming"],
  [/\b(finance|upi|investing)\b/i, "Finance"],
];
const MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const num = (v: string, unit?: string) => {
  const x = Number(v.replace(/,/g, ""));
  const u = (unit ?? "").toLowerCase();
  return Math.round(u === "k" ? x * 1000 : u === "l" || u === "lakh" || u === "lac" ? x * 100000 : u === "m" ? x * 1_000_000 : x);
};

function date(day: string, mon: string, now: number) {
  const m = MON.indexOf(mon.slice(0, 3).toLowerCase());
  if (m < 0) return "";
  const n = new Date(now);
  let y = n.getUTCFullYear();
  if (m < n.getUTCMonth() - 1) y += 1;
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
}

export function parseBrief(text: string, now = Date.now()): ParsedBrief {
  const t = text.replace(/\s+/g, " ");
  const out: ParsedBrief = { ...EMPTY_BRIEF };

  out.brand_display = BRANDS.find((b) => new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\']/g, (c) => (c === "'" ? "['’]?" : `\\${c}`))}`, "i").test(t))
    ?? t.match(/\b([A-Z][\w'’&]+(?: [A-Z][\w'’&]+)?) (?:here|team)\b/)?.[1] ?? "";

  const lower = t.toLowerCase();
  const cities = new Set<string>();
  CITIES.forEach((c) => { if (lower.includes(c.toLowerCase())) cities.add(c); });
  Object.entries(ALIASES).forEach(([a, c]) => { if (lower.includes(a)) cities.add(c); });
  out.cities = [...cities];

  out.colleges_only = /\b(college|campus|student|hostel|fest)/i.test(t);
  const eventy = /\b(emcee|anchor|host(?:s|ing)?|promoter|stall|on-ground|sampling|activation)\b/i.test(t);
  const contenty = /\b(reels?|stor(?:y|ies)|posts?|ugc|content)\b/i.test(t);
  out.talent_kind = eventy && contenty ? "any" : eventy ? "event" : "influencer";

  out.categories = Array.from(new Set(NICHE_WORDS.filter(([re]) => re.test(t)).map(([, n]) => n))).slice(0, 4);

  const fol = t.match(/(\d+(?:\.\d+)?)\s*(k|m)\s*(?:to|-|–|—)\s*(\d+(?:\.\d+)?)\s*(k|m)\s*(?:followers)?/i);
  if (fol) { out.min_followers = num(fol[1], fol[2]); out.max_followers = num(fol[3], fol[4]); }
  else if (/\bnano\b/i.test(t)) { out.min_followers = 1000; out.max_followers = 10000; }
  else if (/\bmicro\b/i.test(t)) { out.min_followers = 10000; out.max_followers = 50000; }
  const minOnly = !fol && t.match(/(\d+(?:\.\d+)?)\s*(k|m)\+?\s*followers/i);
  if (minOnly) out.min_followers = num(minOnly[1], minOnly[2]);

  const er = t.match(/(?:engagement|ER)[^\d%]{0,24}(\d+(?:\.\d+)?)\s*%/i) ?? t.match(/(\d+(?:\.\d+)?)\s*%\s*\+?\s*(?:engagement|ER)\b/i);
  if (er) out.min_engagement = Number(er[1]);

  const unit = "(reels?|stor(?:y|ies)|posts?|carousels?)";
  const del = t.match(new RegExp(`(\\d+\\s*${unit}(?:\\s*(?:\\+|and|&|,)\\s*\\d+\\s*${unit})*)((?:\\s+with)[^.\\n—]*)?`, "i"));
  if (del) {
    out.deliverables = (del[1] + (del[del.length - 1] ?? ""))
      .replace(/\b(reels?|stor(?:y|ies)|posts?|carousels?)\b/gi, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .replace(/\s*(?:and|&)\s*/gi, " + ").trim();
  } else if (eventy) out.deliverables = "On-ground activation (hours and run-of-show to confirm)";

  const bud = t.match(/(?:₹|rs\.?|inr)\s*([\d,.]+)\s*(k|l|lakh|lac)?\s*(?:to|-|–|—)\s*(?:₹|rs\.?|inr)?\s*([\d,.]+)\s*(k|l|lakh|lac)?/i);
  if (bud) { out.budget_min = num(bud[1], bud[2] ?? bud[4]); out.budget_max = num(bud[3], bud[4]); }

  const slots = t.match(/~?\s?(\d{1,3})\s+(?:\w+\s+){0,2}(?:creators|influencers|hosts|emcees|promoters|people)/i);
  if (slots) out.slots = Number(slots[1]);

  const monRe = "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*";
  const by = t.match(new RegExp(`(?:by|before|deadline|till|until)\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s+${monRe}`, "i"));
  if (by) out.apply_by = date(by[1], by[2], now);
  const ev = t.match(new RegExp(`(?:fest(?:\\s+day)?|event|go[- ]live|launch|shoot)\\s+(?:is\\s+|on\\s+)?(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+${monRe}`, "i"));
  if (ev) out.event_date = date(ev[1], ev[2], now);

  const topic = /\bfest\b/i.test(t) ? "Campus fest" : /back[- ]to[- ](?:campus|college)/i.test(t) ? "Back-to-campus" : out.colleges_only ? "Campus" : out.cities[0] ?? "Creator";
  const kind = out.talent_kind === "event" ? "hosts" : /\breel/i.test(t) ? "reels" : "creators";
  const niche = out.categories.find((c) => c !== "Student / Campus");
  out.title = `${topic} ${niche ? niche.toLowerCase() + " " : ""}${kind}`;
  out.description = text.trim().split("\n").filter((l) => !/^[—-]\s/.test(l.trim())).join(" ").slice(0, 400);
  return out;
}
