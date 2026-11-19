import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cityRegion, type College } from "@/lib/colleges";
import { COLLEGE_SEED } from "@/lib/colleges-data";

const LIMIT = 8;

/** Rank: name starts with query > a word starts with query > contains; ties by name. */
function rank(name: string, q: string) {
  const n = name.toLowerCase();
  if (!q) return 2;
  if (n.startsWith(q)) return 0;
  if (n.split(/[\s,.()-]+/).some((w) => w.startsWith(q))) return 1;
  return 2;
}

function sortAndCut(rows: College[], q: string, region: string[]) {
  return rows
    .map((r) => ({ r, k: (region.includes(r.city) ? 0 : 10) + rank(r.name, q) }))
    .sort((a, b) => a.k - b.k || a.r.name.localeCompare(b.r.name))
    .slice(0, LIMIT)
    .map((x) => x.r);
}

function searchSeed(q: string, region: string[]): College[] {
  const pool = COLLEGE_SEED.filter((c) => (q ? c.name.toLowerCase().includes(q) : region.includes(c.city)));
  return sortAndCut(pool.map((c) => ({ id: null, name: c.name, city: c.city, state: c.state, type: c.type })), q, region);
}

/** GET /api/colleges?q=xav&city=Mumbai — autocomplete, colleges in the user's city first. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 60);
  const region = cityRegion(request.nextUrl.searchParams.get("city"));
  if (!q && !region.length) return NextResponse.json({ results: [] });

  // PostgREST pattern: escape LIKE wildcards and the or()-filter separators.
  const pattern = `%${q.replace(/[%_\\]/g, "\\$&").replace(/[,()]/g, " ")}%`;
  const supabase = await createClient();
  const cols = "id, name, city, state, type";

  // Autocomplete must stay snappy: give the DB 2.5 s, then fall back to the bundled list.
  const signal = AbortSignal.timeout(2500);
  const local = region.length
    ? supabase.from("colleges").select(cols).in("city", region).ilike("name", pattern).order("name").limit(LIMIT).abortSignal(signal)
    : null;
  const anywhere = q ? supabase.from("colleges").select(cols).ilike("name", pattern).order("name").limit(LIMIT).abortSignal(signal) : null;
  const [a, b] = await Promise.all([local, anywhere]);

  let results: College[];
  if (a?.error || b?.error) {
    // Table not migrated yet (or DB unreachable): serve the bundled seed list so onboarding never blocks.
    results = searchSeed(q, region);
  } else {
    const seen = new Set<string>();
    const merged = [...(a?.data ?? []), ...(b?.data ?? [])].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
    results = sortAndCut(merged as College[], q, region);
  }
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
