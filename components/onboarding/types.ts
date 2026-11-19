import type { InstagramPreview } from "@/lib/instagram";

export type Step = 1 | 2 | 3;

export type Draft = {
  handle: string;
  preview: InstagramPreview | null;
  confirmed: boolean;
  manual: boolean; // continuing without Instagram stats
  fullName: string;
  city: string | null;
  bio: string | null;
  niches: string[];
  languages: string[];
  inCollege: boolean | null;
  college: { id: string | null; name: string; city?: string | null } | null;
  gradYear: number | null;
  interests: string[];
  whatsapp: string;
  whatsappAlerts: boolean;
};

export type OnboardingContext = {
  demo: boolean;
  type: "influencer" | "event";
  email: string | null;
  name: string | null;
  phone: string | null;
  emailCollege: { id: string; name: string; city: string } | null;
  ipCity: string | null;
  openBriefs: number;
};

export const INTERESTS = [
  { key: "Instagram collabs", sub: "Paid Reels, Stories and posts", icon: "Clapperboard" },
  { key: "Campus ambassador", sub: "Represent brands at your college", icon: "GraduationCap" },
  { key: "Event hosting & promoting", sub: "Emcee, promote, run fest stalls", icon: "Mic" },
  { key: "UGC", sub: "Videos brands run as ads", icon: "Camera" },
] as const;

export const GRAD_YEARS = [2026, 2027, 2028, 2029, 2030];
