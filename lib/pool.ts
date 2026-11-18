import "server-only";
import { createClient } from "@/lib/supabase/server";

export type PoolFilters = {
  q?: string; kind?: string; city?: string; category?: string; rank?: string;
  min_followers?: string; max_followers?: string; min_er?: string; sort?: string;
};

export type PoolRow = {
  id: string; display_name: string; city: string | null; gender: string | null;
  is_influencer: boolean; is_event_talent: boolean; categories: string[]; skills: string[];
  rank: string; rating: number | null; rate_per_post: number | null; rate_full_day: number | null;
  created_at: string;
  ig: { id: string; handle: string; followers: number | null; engagement_rate: number | null; avg_likes: number | null; profile_pic_url: string | null } | null;
};

export async function searchPool(f: PoolFilters, limit = 500): Promise<PoolRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("talent_profiles")
    .select("id, display_name, city, gender, is_influencer, is_event_talent, categories, skills, rank, rating, rate_per_post, rate_full_day, created_at, social_accounts(id, handle, followers, engagement_rate, avg_likes, profile_pic_url, platform)")
    .eq("status", "approved")
    .limit(2000);
  if (f.kind === "influencer") q = q.eq("is_influencer", true);
  if (f.kind === "event") q = q.eq("is_event_talent", true);
  if (f.city) q = q.eq("city", f.city);
  if (f.rank) q = q.eq("rank", f.rank);
  if (f.category) q = q.contains("categories", [f.category]);
  if (f.q) q = q.ilike("display_name", `%${f.q.replace(/[%_]/g, "")}%`);
  const { data } = await q;

  const minF = f.min_followers ? Number(f.min_followers) : null;
  const maxF = f.max_followers ? Number(f.max_followers) : null;
  const minEr = f.min_er ? Number(f.min_er) : null;
  const handleQ = f.q?.replace(/^@/, "").toLowerCase();

  let rows: PoolRow[] = (data ?? []).map((t) => {
    const accs = (t.social_accounts ?? []) as Array<PoolRow["ig"] & { platform: string }>;
    const ig = accs.find((a) => a?.platform === "instagram") ?? null;
    return { ...t, ig } as PoolRow;
  });

  // also match by Instagram handle
  if (handleQ) {
    const { data: byHandle } = await supabase.from("social_accounts").select("talent_id").ilike("handle", `%${handleQ}%`);
    const extra = new Set((byHandle ?? []).map((r) => r.talent_id));
    if (extra.size) {
      const missing = [...extra].filter((id) => !rows.some((r) => r.id === id));
      if (missing.length) {
        const more = await searchPool({ ...f, q: undefined }, 2000);
        rows = rows.concat(more.filter((r) => missing.includes(r.id)));
      }
    }
  }

  rows = rows.filter((r) => {
    const fol = r.ig?.followers ?? null;
    if (minF != null && (fol ?? 0) < minF) return false;
    if (maxF != null && (fol == null || fol > maxF)) return false;
    if (minEr != null && (r.ig?.engagement_rate ?? 0) < minEr) return false;
    return true;
  });

  const sorters: Record<string, (a: PoolRow, b: PoolRow) => number> = {
    followers: (a, b) => (b.ig?.followers ?? -1) - (a.ig?.followers ?? -1),
    engagement: (a, b) => (b.ig?.engagement_rate ?? -1) - (a.ig?.engagement_rate ?? -1),
    newest: (a, b) => b.created_at.localeCompare(a.created_at),
    rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
  };
  rows.sort(sorters[f.sort ?? "newest"] ?? sorters.newest);
  return rows.slice(0, limit);
}
