export const CITIES = [
  "Mumbai", "Pune", "Delhi", "Bangalore", "Hyderabad",
  "Chennai", "Kolkata", "Ahmedabad", "Chandigarh", "Goa",
] as const;

export const INFLUENCER_NICHES = [
  "Lifestyle", "Fashion", "Beauty", "Food", "Travel", "Fitness", "Tech", "Gaming",
  "Comedy", "Music", "Dance", "Education", "Finance", "Parenting", "Automotive",
  "Sports", "Art & Design", "Photography", "Student / Campus", "Regional / Vernacular",
] as const;

export const EVENT_CATEGORY_GROUPS: Record<string, string[]> = {
  "Event Manpower": [
    "Brand Promoter", "Event Host / Emcee", "Anchor", "Supervisor", "Event Coordinator",
    "Registration Desk Executive", "Hospitality Staff", "Brand Activation Staff",
    "Crowd Management Staff", "Merchandise Sales Promoter",
  ],
  "Technical Crew": [
    "Sound Engineer", "Light Engineer", "Stage Manager", "Production Assistant",
    "AV Technician", "Video Crew", "Camera Operator", "Live Streaming Technician",
  ],
  "Performing Artists": [
    "Musician", "Singer", "Band", "DJ", "Stand-up Comedian", "Magician", "Beatboxer",
    "Dancer", "Dance Crew", "Rapper", "Spoken Word Artist", "Instrumentalist",
    "Street Performer", "Theatre Artist", "Mimicry Artist",
  ],
  "Specialty Engagement": [
    "Caricature Artist", "Tattoo Artist", "Illusionist", "Juggler", "Fire Performer",
    "LED Performer", "Event Content Creator",
  ],
};

export const EVENT_CATEGORIES = Object.values(EVENT_CATEGORY_GROUPS).flat();

export const SKILLS = [
  "Brand Activations", "College Festivals", "Corporate Events", "Stage Hosting",
  "Product Launches", "Mall Activations", "Weddings", "Concerts", "Exhibitions",
];

export const LANGUAGES = [
  "English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu", "Kannada",
  "Malayalam", "Bengali", "Punjabi",
];

export const RANKS = ["bronze", "silver", "gold", "platinum"] as const;
export type Rank = (typeof RANKS)[number];
export const RANK_LABEL: Record<Rank, string> = {
  bronze: "Bronze · Beginner",
  silver: "Silver · Intermediate",
  gold: "Gold · Experienced",
  platinum: "Platinum · Premium",
};

export const TALENT_STATUSES = ["pending", "screening", "approved", "rejected", "suspended"] as const;

export const STAGES = [
  "interested", "shortlisted", "contacted", "negotiating", "confirmed", "delivered", "rejected", "dropped",
] as const;
export type Stage = (typeof STAGES)[number];

export const FOLLOWER_TIERS = [
  { key: "nano", label: "Nano (1K–10K)", min: 1_000, max: 10_000 },
  { key: "micro", label: "Micro (10K–50K)", min: 10_000, max: 50_000 },
  { key: "mid", label: "Mid (50K–250K)", min: 50_000, max: 250_000 },
  { key: "macro", label: "Macro (250K–1M)", min: 250_000, max: 1_000_000 },
  { key: "mega", label: "Mega (1M+)", min: 1_000_000, max: null },
] as const;

export function followerTier(followers?: number | null) {
  if (followers == null) return null;
  return FOLLOWER_TIERS.find((t) => followers >= t.min && (t.max == null || followers < t.max)) ?? null;
}

export const PLATFORM_ORG_ID = "00000000-0000-0000-0000-000000000001";
export const VIGOR_AGENCY_ID = "00000000-0000-0000-0000-000000000002";
