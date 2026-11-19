/** Pure, deterministic match scoring (client-safe). Hard criteria from lib/match + soft fit signals. */
import { mismatches } from "@/lib/match";
import type { BriefCriteriaVM, TalentRow } from "./types";

export function eligible(b: BriefCriteriaVM, t: TalentRow) {
  const hard = mismatches(
    { talent_kind: b.talent_kind, categories: b.categories, cities: b.cities, min_followers: b.min_followers, max_followers: b.max_followers, min_engagement: b.min_engagement, ranks: b.ranks },
    { is_influencer: t.influencer, is_event_talent: t.event, categories: t.categories, city: t.city, rank: t.rank, followers: t.followers, engagement_rate: t.er },
  );
  if (b.colleges_only && !t.campus) hard.push("College students only");
  return hard;
}

const RANK_W: Record<string, number> = { bronze: 0, silver: 3, gold: 6, platinum: 8 };

/** 0–99. Eligible talent land 70–99; ineligible are capped at 64 so they sort below. */
export function matchScore(b: BriefCriteriaVM | null, t: TalentRow) {
  const er = t.er ?? 0;
  const base = 52 + Math.min(18, er * 2.2) + (RANK_W[t.rank] ?? 0) + (t.verified ? 4 : 0) + (t.availability === "available" ? 4 : t.availability === "busy" ? 1 : -6);
  if (!b) return clamp(Math.round(base + 8));
  const miss = eligible(b, t).length;
  const catHit = b.categories.filter((c) => t.categories.includes(c)).length;
  const cityHit = b.cities.length === 0 || (t.city != null && b.cities.includes(t.city));
  const score = base + catHit * 5 + (cityHit ? 6 : 0) + (b.colleges_only && t.campus ? 4 : 0);
  return miss ? Math.min(64, clamp(Math.round(score * 0.66 - (miss - 1) * 7))) : clamp(Math.round(Math.max(70, score)));
}

const clamp = (n: number) => Math.max(18, Math.min(99, n));
