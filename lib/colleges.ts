// College graph helpers — client-safe (no data, no server imports).
// Data lives in lib/colleges-data.ts and in the `colleges` table (migration 0005).
import { CITIES } from "@/lib/constants";

export type College = {
  id: string | null; // null when served from the offline seed list (table not migrated yet)
  name: string;
  city: string;
  state: string | null;
  type: string | null;
};

/** Metro → the city values (as stored on colleges.city) that should match it in autocomplete. */
export const CITY_REGIONS: Record<string, string[]> = {
  Mumbai: ["Mumbai", "Navi Mumbai", "Thane"],
  Delhi: ["Delhi", "New Delhi", "Noida", "Greater Noida", "Gurugram", "Ghaziabad", "Faridabad", "Sonipat"],
  Bangalore: ["Bangalore"],
  Pune: ["Pune", "Pimpri-Chinchwad"],
  Hyderabad: ["Hyderabad", "Secunderabad"],
  Chennai: ["Chennai"],
  Kolkata: ["Kolkata", "Howrah"],
  Ahmedabad: ["Ahmedabad", "Gandhinagar"],
  Jaipur: ["Jaipur"],
  Chandigarh: ["Chandigarh", "Mohali", "Panchkula", "Zirakpur", "Rajpura"],
  Indore: ["Indore"],
  Lucknow: ["Lucknow"],
  Goa: ["Goa", "Panaji", "Margao"],
};

const ALIASES: Record<string, string> = {
  bengaluru: "Bangalore",
  bangaluru: "Bangalore",
  bombay: "Mumbai",
  "new delhi": "Delhi",
  "delhi ncr": "Delhi",
  gurgaon: "Gurugram",
  calcutta: "Kolkata",
  madras: "Chennai",
  poona: "Pune",
  "sahibzada ajit singh nagar": "Mohali",
  "s.a.s. nagar": "Mohali",
  panjim: "Panaji",
};

/** Cities offered as suggestions in city inputs (metros first, then satellites). */
export const CITY_SUGGESTIONS: string[] = Array.from(
  new Set([...CITIES, "Jaipur", "Indore", "Lucknow", ...Object.values(CITY_REGIONS).flat()]),
);

const title = (s: string) => s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());

/** Normalise a free-text / geo city into the spelling we store ("Bengaluru" → "Bangalore"). */
export function canonicalCity(input?: string | null): string | null {
  const raw = (input ?? "").trim().replace(/\s+/g, " ");
  if (!raw || raw.length > 60) return null;
  const lower = raw.toLowerCase();
  if (ALIASES[lower]) return ALIASES[lower];
  const known = CITY_SUGGESTIONS.find((c) => c.toLowerCase() === lower);
  return known ?? title(raw);
}

/** The list of colleges.city values that belong to the same metro as `city`. */
export function cityRegion(city?: string | null): string[] {
  const c = canonicalCity(city);
  if (!c) return [];
  const metro = Object.entries(CITY_REGIONS).find(([m, cities]) => m === c || cities.includes(c));
  return metro ? metro[1] : [c];
}

/** City from edge geo headers (Vercel / Cloudflare). Values may be URL-encoded. */
export function cityFromGeoHeaders(h: { get(name: string): string | null }): string | null {
  const raw = h.get("x-vercel-ip-city") ?? h.get("cf-ipcity");
  if (!raw) return null;
  let v = raw;
  try {
    v = decodeURIComponent(raw);
  } catch {
    // keep raw
  }
  return canonicalCity(v);
}

export const COURSE_SUGGESTIONS = [
  "B.Com", "BMS", "BBA", "BA", "BA (Hons)", "B.Sc", "BMM / BAMMC", "B.Tech / B.E.", "B.Des", "BCA",
  "LLB", "BA LLB", "MBBS", "B.Arch", "B.Pharm", "Hotel Management", "MBA / PGDM", "M.Com", "MA", "M.Sc",
  "M.Tech", "MCA", "Fashion Design", "Mass Communication", "Fine Arts",
];

/** Graduation years offered in pickers: last year through +6. */
export function graduationYears(now = new Date()): number[] {
  const y = now.getFullYear();
  return Array.from({ length: 8 }, (_, i) => y - 1 + i);
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
