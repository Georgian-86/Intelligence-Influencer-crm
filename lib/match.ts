export type BriefCriteria = {
  talent_kind: string;
  categories: string[];
  cities: string[];
  min_followers: number | null;
  max_followers: number | null;
  min_engagement: number | null;
  ranks: string[];
};

export type TalentForMatch = {
  is_influencer: boolean;
  is_event_talent: boolean;
  categories: string[];
  city: string | null;
  rank: string;
  followers?: number | null;
  engagement_rate?: number | null;
};

/** Returns reasons a talent does NOT match a brief (empty array = eligible). */
export function mismatches(b: BriefCriteria, t: TalentForMatch): string[] {
  const out: string[] = [];
  if (b.talent_kind === "influencer" && !t.is_influencer) out.push("Influencers only");
  if (b.talent_kind === "event" && !t.is_event_talent) out.push("Event talent only");
  if (b.cities.length && (!t.city || !b.cities.includes(t.city))) out.push(`City: ${b.cities.join(", ")}`);
  if (b.categories.length && !b.categories.some((c) => t.categories.includes(c))) out.push(`Category: ${b.categories.join(", ")}`);
  if (b.ranks.length && !b.ranks.includes(t.rank)) out.push(`Rank: ${b.ranks.join(", ")}`);
  if (b.talent_kind === "influencer" || b.min_followers || b.max_followers || b.min_engagement) {
    if (b.min_followers && (t.followers ?? 0) < b.min_followers) out.push(`Min ${b.min_followers.toLocaleString("en-IN")} followers`);
    if (b.max_followers && (t.followers ?? 0) > b.max_followers) out.push(`Max ${b.max_followers.toLocaleString("en-IN")} followers`);
    if (b.min_engagement && (t.engagement_rate ?? 0) < Number(b.min_engagement)) out.push(`Min ${b.min_engagement}% engagement`);
  }
  return out;
}
