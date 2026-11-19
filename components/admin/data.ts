import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/demo";
import { CREATORS, PLATFORM_STATS, TEAM, getCreator, type Rank } from "@/lib/demo/fixtures";
import { FUNNEL, PENDING_INVITES, PERMISSIONS, ROLE_MATRIX, SCREENING, TEAM_META } from "@/lib/demo/portal";
import { COLLEGES } from "@/lib/colleges";
import { computeFlags, emailMatchesCollege, type Flag } from "./flags";

export const STATUSES = ["pending", "screening", "approved", "rejected"] as const;
export type Status = (typeof STATUSES)[number];

export type QueueRow = {
  id: string; name: string; handle: string | null; city: string | null; college: string | null; followers: number | null;
  er: number | null; rank: Rank; status: string; created_at: string; kinds: string[]; categories: string[]; flags: Flag[]; hue: number;
};

const hueOf = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
const daysAgoLabel = (iso: string) => {
  const d = Math.max(0, Math.round((Date.parse("2026-11-19T12:00:00Z") - Date.parse(iso)) / 86400000));
  return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
};
export { daysAgoLabel };

function demoErFor(id: string, er: number) { return SCREENING[id]?.er_override ?? er; }

/* ---------------------------------------------------------------- queue */
export async function getQueue(status: Status, kind?: string): Promise<{ rows: QueueRow[]; counts: Record<Status, number> }> {
  if (isDemo()) {
    const all = CREATORS.map((c) => {
      const x = SCREENING[c.id];
      const college = COLLEGES.find((k) => k.id === c.college_id);
      const er = demoErFor(c.id, c.engagement_rate);
      return {
        id: c.id, name: c.display_name, handle: c.handle, city: c.city, college: college?.short ?? c.college_name,
        followers: c.followers, er, rank: c.rank, status: c.status, created_at: c.joined_at,
        kinds: [c.is_influencer && "Influencer", c.is_event_talent && "Event"].filter(Boolean) as string[], categories: c.categories,
        hue: c.hue,
        flags: x ? computeFlags({ followers: c.followers, following: c.following, er, isPrivate: x.is_private, inCollege: c.in_college, collegeEmail: x.college_email, collegeDomains: college?.domains, idUploaded: x.id_uploaded }) : [],
      } satisfies QueueRow;
    });
    // the fixture holds 10 unreviewed creators; split them across pending/screening by signup order
    const withStatus = all.map((r, i) => (r.status !== "approved" ? { ...r, status: i % 3 === 0 ? "screening" : "pending" } : r));
    const counts = Object.fromEntries(STATUSES.map((s) => [s, withStatus.filter((r) => r.status === s).length])) as Record<Status, number>;
    counts.rejected = 3;
    let rows = withStatus.filter((r) => r.status === status);
    if (kind === "influencer") rows = rows.filter((r) => r.kinds.includes("Influencer"));
    if (kind === "event") rows = rows.filter((r) => r.kinds.includes("Event"));
    rows.sort((a, b) => b.flags.length - a.flags.length || Date.parse(a.created_at) - Date.parse(b.created_at));
    return { rows, counts };
  }
  const supabase = await createClient();
  const countRes = await Promise.all(STATUSES.map((s) => supabase.from("talent_profiles").select("id", { count: "exact", head: true }).eq("status", s)));
  let q = supabase
    .from("talent_profiles")
    .select("id, display_name, city, is_influencer, is_event_talent, categories, rank, status, created_at, social_accounts(handle, followers, following, engagement_rate, is_private, fetch_status)")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .limit(300);
  if (kind === "influencer") q = q.eq("is_influencer", true);
  if (kind === "event") q = q.eq("is_event_talent", true);
  const { data } = await q;
  const rows: QueueRow[] = (data ?? []).map((t) => {
    const ig = (t.social_accounts as unknown as { handle: string; followers: number | null; following: number | null; engagement_rate: number | null; is_private: boolean | null; fetch_status: string }[] | null)?.[0];
    const er = ig?.engagement_rate != null ? Number(ig.engagement_rate) : null;
    return {
      id: t.id, name: t.display_name, handle: ig?.handle ?? null, city: t.city, college: null, followers: ig?.followers ?? null, er,
      rank: t.rank as Rank, status: t.status, created_at: t.created_at, categories: t.categories ?? [], hue: hueOf(t.id),
      kinds: [t.is_influencer && "Influencer", t.is_event_talent && "Event"].filter(Boolean) as string[],
      flags: computeFlags({ followers: ig?.followers ?? null, following: ig?.following, er, isPrivate: ig?.is_private, fetchStatus: ig?.fetch_status }),
    };
  });
  const counts = Object.fromEntries(STATUSES.map((s, i) => [s, countRes[i].count ?? 0])) as Record<Status, number>;
  return { rows, counts };
}

/* ---------------------------------------------------------------- platform KPIs + funnel */
export async function getPlatformOverview() {
  if (isDemo()) {
    return {
      kpis: { creators: PLATFORM_STATS.creators, campuses: PLATFORM_STATS.campuses as number | null, cities: PLATFORM_STATS.cities, brands: PLATFORM_STATS.brands, briefs_live: PLATFORM_STATS.briefs_live, pending: PLATFORM_STATS.pending_review },
      signups: PLATFORM_STATS.signups_week,
      funnel: FUNNEL,
    };
  }
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 86400000);
  since.setUTCHours(0, 0, 0, 0);
  const [approved, brands, briefs, pending, cities, recent, total, igOk, screened] = await Promise.all([
    supabase.from("talent_profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("type", "brand"),
    supabase.from("briefs").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("talent_profiles").select("id", { count: "exact", head: true }).in("status", ["pending", "screening"]),
    supabase.from("talent_profiles").select("city").eq("status", "approved").limit(5000),
    supabase.from("talent_profiles").select("created_at").gte("created_at", since.toISOString()).limit(5000),
    supabase.from("talent_profiles").select("id", { count: "exact", head: true }),
    supabase.from("social_accounts").select("id", { count: "exact", head: true }).eq("fetch_status", "ok"),
    supabase.from("talent_profiles").select("id", { count: "exact", head: true }).in("status", ["approved", "rejected"]),
  ]);
  const signups = Array.from({ length: 7 }, (_, i) => {
    const start = since.getTime() + (i + 1) * 86400000 - 86400000;
    return (recent.data ?? []).filter((r) => { const t = Date.parse(r.created_at); return t >= start && t < start + 86400000; }).length;
  });
  return {
    kpis: {
      creators: approved.count ?? 0, campuses: null, cities: new Set((cities.data ?? []).map((c) => c.city).filter(Boolean)).size,
      brands: brands.count ?? 0, briefs_live: briefs.count ?? 0, pending: pending.count ?? 0,
    },
    signups,
    funnel: [
      { label: "Registered", value: total.count ?? 0 },
      { label: "Instagram connected", value: igOk.count ?? 0 },
      { label: "Screened", value: screened.count ?? 0 },
      { label: "Approved", value: approved.count ?? 0 },
    ],
  };
}

/* ---------------------------------------------------------------- talent review */
export type TalentReview = {
  id: string; name: string; status: string; rank: Rank; rating: number | null; reliability: number | null; notes: string | null; reviewed_at: string | null;
  city: string | null; bio: string | null; categories: string[]; skills: string[]; languages: string[]; kinds: string[]; hue: number; joined: string;
  rates: { post: number | null; full: number | null }; consent: boolean | null;
  ig: null | { id: string | null; handle: string; followers: number | null; following: number | null; posts: number | null; avg_likes: number | null; avg_comments: number | null; avg_views: number | null; er: number | null; verified: boolean; is_private: boolean; fetch_status: string; last_fetched_at: string | null; biography: string | null };
  growth: number[]; recent: { id: string; type: string; views: number | null; likes: number | null; hue: number; url?: string | null }[];
  contact: { email: string | null; phone: string | null; whatsapp: string | null };
  college: null | { name: string; grad_year: number | null; email: string | null; domains: string[]; matches: boolean; id_uploaded: boolean };
  media: { id: string; url: string; title: string | null }[];
  flags: Flag[]; source: string | null;
};

export async function getTalentReview(id: string): Promise<TalentReview | null> {
  if (isDemo()) {
    const c = getCreator(id);
    if (!c) return null;
    const x = SCREENING[c.id];
    const college = COLLEGES.find((k) => k.id === c.college_id);
    const er = demoErFor(c.id, c.engagement_rate);
    const status = c.status === "approved" ? "approved" : CREATORS.indexOf(c) % 3 === 0 ? "screening" : "pending";
    return {
      id: c.id, name: c.display_name, status, rank: c.rank, rating: status === "approved" ? c.rating : null, reliability: status === "approved" ? c.reliability_score : null,
      notes: null, reviewed_at: null, city: c.city, bio: c.bio, categories: c.categories, skills: c.skills, languages: c.languages,
      kinds: [c.is_influencer && "Influencer", c.is_event_talent && "Event talent"].filter(Boolean) as string[], hue: c.hue, joined: c.joined_at,
      rates: { post: c.rate_per_post, full: c.rate_full_day }, consent: true,
      ig: {
        id: null, handle: c.handle, followers: c.followers, following: c.following, posts: c.posts_count,
        avg_likes: x?.er_override ? Math.round((c.followers * er) / 100 * 0.93) : c.avg_likes, avg_comments: x?.er_override ? Math.round((c.followers * er) / 100 * 0.07) : c.avg_comments,
        avg_views: c.avg_views, er, verified: c.verified_insights, is_private: !!x?.is_private, fetch_status: "ok", last_fetched_at: c.last_fetched_at, biography: c.bio,
      },
      growth: x?.er_override ? c.growth.map((v, i) => (i < 8 ? Math.round(v * 0.55) : v)) : c.growth,
      recent: c.posts.slice(0, 6).map((p) => ({ id: p.id, type: p.type, views: p.views, likes: x?.er_override ? Math.round(p.likes * 0.22) : p.likes, hue: p.hue })),
      contact: { email: c.email, phone: c.phone, whatsapp: c.phone },
      college: c.college_name ? {
        name: c.college_name, grad_year: c.grad_year, email: x?.college_email ?? c.email, domains: college?.domains ?? [],
        matches: emailMatchesCollege(x?.college_email ?? c.email, college?.domains), id_uploaded: x ? x.id_uploaded : true,
      } : null,
      media: [], source: x?.signup_source ?? null,
      flags: x ? computeFlags({ followers: c.followers, following: c.following, er, isPrivate: x.is_private, inCollege: c.in_college, collegeEmail: x.college_email, collegeDomains: college?.domains, idUploaded: x.id_uploaded }) : [],
    };
  }
  const supabase = await createClient();
  const { data: t } = await supabase.from("talent_profiles").select("*").eq("id", id).maybeSingle();
  if (!t) return null;
  const [{ data: ig }, { data: contact }, { data: media }] = await Promise.all([
    supabase.from("social_accounts").select("*").eq("talent_id", id).maybeSingle(),
    supabase.from("talent_contacts").select("*").eq("talent_id", id).maybeSingle(),
    supabase.from("talent_media").select("*").eq("talent_id", id),
  ]);
  const [{ data: snaps }, { data: posts }] = ig
    ? await Promise.all([
        supabase.from("social_snapshots").select("followers, fetched_at").eq("account_id", ig.id).order("fetched_at", { ascending: true }).limit(12),
        supabase.from("social_posts").select("id, post_type, views, likes, url").eq("account_id", ig.id).order("posted_at", { ascending: false }).limit(6),
      ])
    : [{ data: [] as { followers: number | null }[] }, { data: [] as { id: string; post_type: string | null; views: number | null; likes: number | null; url: string | null }[] }];
  const er = ig?.engagement_rate != null ? Number(ig.engagement_rate) : null;
  const hue = hueOf(t.id);
  return {
    id: t.id, name: t.display_name, status: t.status, rank: t.rank, rating: t.rating != null ? Number(t.rating) : null, reliability: t.reliability_score,
    notes: t.review_notes, reviewed_at: t.reviewed_at, city: t.city, bio: t.bio, categories: t.categories ?? [], skills: t.skills ?? [], languages: t.languages ?? [],
    kinds: [t.is_influencer && "Influencer", t.is_event_talent && "Event talent"].filter(Boolean) as string[], hue, joined: t.created_at,
    rates: { post: t.rate_per_post, full: t.rate_full_day }, consent: t.consent_share,
    ig: ig ? {
      id: ig.id, handle: ig.handle, followers: ig.followers, following: ig.following, posts: ig.posts_count, avg_likes: ig.avg_likes != null ? Number(ig.avg_likes) : null,
      avg_comments: ig.avg_comments != null ? Number(ig.avg_comments) : null, avg_views: ig.avg_views != null ? Number(ig.avg_views) : null, er,
      verified: !!ig.is_verified, is_private: !!ig.is_private, fetch_status: ig.fetch_status, last_fetched_at: ig.last_fetched_at, biography: ig.biography,
    } : null,
    growth: (snaps ?? []).map((s) => s.followers ?? 0).filter((v) => v > 0),
    recent: (posts ?? []).map((p, i) => ({ id: p.id, type: p.post_type ?? "post", views: p.views, likes: p.likes, hue: (hue + i * 23) % 360, url: p.url })),
    contact: { email: contact?.email ?? null, phone: contact?.phone ?? null, whatsapp: contact?.whatsapp ?? null },
    college: null, media: (media ?? []).map((m) => ({ id: m.id, url: m.url, title: m.title })), source: null,
    flags: computeFlags({ followers: ig?.followers ?? null, following: ig?.following, er, isPrivate: ig?.is_private, fetchStatus: ig?.fetch_status }),
  };
}

/* ---------------------------------------------------------------- team */
export type TeamView = {
  members: { key: string; user_id: string; org_id: string; name: string; email: string; role: string; org: string; load: number | null; hue: number; last_active: string | null; status: "active" | "invited" }[];
  invites: { email: string; role: string; sent: string }[];
  roles: { key: string; label: string; scope: string }[];
  orgs: { id: string; name: string; type: string }[];
  matrix: { role: string; label: string; perms: string[] }[];
  permissions: { key: string; label: string }[];
};

export async function getTeam(): Promise<TeamView> {
  if (isDemo()) {
    return {
      members: TEAM.map((m) => ({ key: m.id, user_id: m.id, org_id: "demo-agency", name: m.name, email: m.email, role: m.role, org: "Vigor Launchpad", load: m.load, hue: m.hue, last_active: TEAM_META[m.id]?.last_active ?? null, status: "active" as const })),
      invites: PENDING_INVITES,
      roles: ROLE_MATRIX.map((r) => ({ key: r.role, label: r.label, scope: "agency" })),
      orgs: [{ id: "demo-agency", name: "Vigor Launchpad", type: "agency" }, { id: "demo-platform", name: "Vigor Talent Network", type: "platform" }],
      matrix: ROLE_MATRIX,
      permissions: PERMISSIONS,
    };
  }
  const supabase = await createClient();
  const [{ data: orgs }, { data: roles }, { data: members }, { data: rp }] = await Promise.all([
    supabase.from("organizations").select("id, name, type").order("type"),
    supabase.from("roles").select("key, label, scope"),
    supabase.from("memberships").select("user_id, org_id, role, profiles(full_name, email), organizations(name, type)"),
    supabase.from("role_permissions").select("role, permission"),
  ]);
  const permKeys = Array.from(new Set((rp ?? []).map((r) => r.permission).filter((p) => p !== "*"))).sort();
  return {
    members: (members ?? []).map((m) => {
      const p = m.profiles as unknown as { full_name: string | null; email: string } | null;
      const o = m.organizations as unknown as { name: string; type: string } | null;
      return {
        key: `${m.user_id}-${m.org_id}`, user_id: m.user_id, org_id: m.org_id, name: p?.full_name ?? p?.email?.split("@")[0] ?? "—", email: p?.email ?? "",
        role: roles?.find((r) => r.key === m.role)?.label ?? m.role, org: o ? `${o.name}` : "", load: null, hue: hueOf(m.user_id), last_active: null, status: "active" as const,
      };
    }),
    invites: [],
    roles: roles ?? [],
    orgs: orgs ?? [],
    matrix: (roles ?? []).map((r) => ({ role: r.key, label: r.label, perms: (rp ?? []).filter((x) => x.role === r.key).map((x) => x.permission) })),
    permissions: permKeys.map((k) => ({ key: k, label: PERMISSIONS.find((p) => p.key === k)?.label ?? k })),
  };
}
