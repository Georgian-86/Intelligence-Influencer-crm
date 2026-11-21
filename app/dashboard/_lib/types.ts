/** View models shared by the creator app's server loaders and client components. Mode-agnostic (demo or live). */
export type Stage = "interested" | "shortlisted" | "contacted" | "negotiating" | "confirmed" | "delivered" | "rejected" | "dropped";
export type PaymentStatus = "not_started" | "awaiting_delivery" | "invoice_due" | "processing" | "paid";

export type PostVM = { id: string; type: string; views: number | null; likes: number | null; hue: number; thumb: string | null; url: string | null; caption: string | null };

export type CreatorVM = {
  id: string;
  name: string;
  firstName: string;
  email: string | null;
  handle: string | null;
  photoUrl: string | null;
  hue: number;
  city: string | null;
  bio: string | null;
  status: string;
  rank: string;
  categories: string[];
  languages: string[];
  gender: string | null;
  dob: string | null;
  isInfluencer: boolean;
  isEventTalent: boolean;
  interests: string[];
  inCollege: boolean;
  collegeName: string | null;
  gradYear: number | null;
  followers: number | null;
  er: number | null;
  avgViews: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  postsCount: number | null;
  series: { followers: number[]; er: number[]; views: number[] };
  lastSyncedAt: string | null;
  igAccountId: string | null;
  fetchStatus: "ok" | "pending" | "error" | "none";
  fetchError: string | null;
  verifiedInsights: boolean;
  audience: { age_18_24: number; female: number; top_cities: { city: string; pct: number }[] } | null;
  ratePerPost: number | null;
  rateFullDay: number | null;
  rateNotes: string | null;
  posts: PostVM[];
  phone: string | null;
  whatsapp: string | null;
  portfolio: string[];
};

export type BriefVM = {
  id: string;
  title: string;
  brand: string;
  hue: number;
  description: string | null;
  deliverables: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  applyBy: string | null;
  eventDate: string | null;
  cities: string[];
  categories: string[];
  talentKind: string;
  collegesOnly: boolean;
  minFollowers: number | null;
  maxFollowers: number | null;
  minEngagement: number | null;
  slots: number | null;
  applicants: number | null;
  status: string;
  match: number;
  reasons: string[];
  checks: { label: string; ok: boolean }[];
  eligible: boolean;
  applied: Stage | null;
};

export type ApplicationVM = {
  id: string;
  briefId: string;
  title: string;
  brand: string;
  hue: number;
  stage: Stage;
  updatedAt: string;
  next: string;
  fee: number | null;
  payment: PaymentStatus;
  deliverableDue: string | null;
  deliverables: string | null;
  history: { stage: Stage; at: string }[];
  source: "applied" | "invited";
  /** Live mode: each piece of content owed on this booking. */
  work?: WorkItemVM[];
  payout?: { amount: number; tds: number; net: number; status: "pending" | "approved" | "paid" | "failed"; due: string | null; utr: string | null; paidAt: string | null } | null;
};

export type WorkItemVM = {
  id: string; kind: string; title: string | null; due: string | null;
  status: "brief_sent" | "draft_submitted" | "changes_requested" | "approved" | "live";
  version: number; liveUrl: string | null; feedback: { who: string; body: string; at: string } | null;
};

export type EarningsVM = { paid: number; pending: number; months: number[]; labels: string[] };
export type CampusVM = { collegeName: string | null; gradYear: number | null; ambassador: "none" | "interested" | "shortlisted" | "active"; note: string; campusBriefs: number; peers: number | null };
