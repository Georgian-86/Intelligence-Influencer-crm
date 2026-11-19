/** View-model types shared by CRM server pages and client components (demo + live map into these). */

export type Health = "on_track" | "at_risk" | "blocked";
export type PipelineStage = "interested" | "shortlisted" | "contacted" | "negotiating" | "confirmed" | "delivered";
export type DeliverableStatus = "brief_sent" | "draft_submitted" | "changes_requested" | "approved" | "live" | "overdue";

export type TalentRow = {
  id: string;
  name: string;
  handle: string | null;
  photo: string | null;
  hue: number;
  city: string | null;
  college: string | null;
  campus: boolean;
  followers: number | null;
  er: number | null;
  avgViews: number | null;
  avgLikes: number | null;
  rank: string;
  rate: number | null;
  verified: boolean;
  availability: "available" | "busy" | "away";
  categories: string[];
  influencer: boolean;
  event: boolean;
  growth: number[];
  rating: number | null;
};

export type BriefCriteriaVM = {
  id: string;
  title: string;
  brand: string;
  talent_kind: string;
  categories: string[];
  cities: string[];
  colleges_only: boolean;
  min_followers: number | null;
  max_followers: number | null;
  min_engagement: number | null;
  ranks: string[];
};

export type CampaignVM = {
  id: string;
  name: string;
  brand: string;
  status: string;
  start: string | null;
  end: string | null;
  budget: number | null;
  spent: number;
  owner: string | null;
  confirmed: number;
  target: number | null;
  live: number;
  deliverables: number;
  reach: number | null;
  views: number | null;
  er: number | null;
  cities: string[];
  hue: number;
  health: Health;
  reason: string;
  briefs: number;
};

export type PipelineCard = {
  id: string;
  stage: PipelineStage;
  talentId: string;
  name: string;
  handle: string | null;
  hue: number;
  photo: string | null;
  followers: number | null;
  match: number;
  quoted: number | null;
  agreed: number | null;
  brief: string;
  source: string;
  updated: string;
};

export type DeliverableRow = {
  id: string;
  talentId: string;
  name: string;
  handle: string | null;
  hue: number;
  kind: string;
  due: string | null;
  version: number;
  status: DeliverableStatus;
  views: number | null;
};

export type EnquiryVM = {
  id: string;
  company: string;
  contact: string;
  channel: string;
  budget: string | null;
  objective: string;
  message: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: "new" | "in_progress" | "converted" | "closed";
  received: string;
};
