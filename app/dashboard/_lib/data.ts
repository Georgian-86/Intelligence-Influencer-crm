import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { isDemo, ME, DEMO_USER } from "@/lib/demo";
import { DEMO_BRIEFS, ME_APPLICATIONS, ME_CAMPUS, ME_EARNINGS, ME_PROFILE, ME_SERIES, getDemoBrief } from "@/lib/demo/creator";
import { getMyTalent, getUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { imgSrc } from "@/components/ui";
import { scoreBrief } from "./score";
import type { ApplicationVM, BriefVM, CampusVM, CreatorVM, EarningsVM, PaymentStatus, Stage } from "./types";

export const DEMO_INTEREST_COOKIE = "vtn_demo_interest";
export const DEMO_SYNC_COOKIE = "vtn_demo_synced";
export const DEMO_PROFILE_COOKIE = "vtn_demo_profile";

const NEXT_STEP: Record<string, string> = {
  interested: "Vigor is reviewing applicants — you'll hear back on WhatsApp.",
  shortlisted: "The brand is reviewing shortlists. Keep your DMs open.",
  contacted: "Reply to Vigor on WhatsApp to lock dates and fee.",
  negotiating: "Agree the fee with Vigor to get confirmed.",
  confirmed: "Upload your draft for approval before the due date.",
  delivered: "Content approved — payout is being processed.",
  rejected: "Not this time. New briefs drop every week.",
  dropped: "This collab was closed.",
};

async function demoInterest(): Promise<string[]> {
  const v = (await cookies()).get(DEMO_INTEREST_COOKIE)?.value;
  return v ? v.split(",").filter(Boolean) : [];
}

/* ------------------------------------------------------------------ creator */
export const getCreator = cache(async (): Promise<CreatorVM | null> => {
  if (isDemo()) {
    const jar = await cookies();
    const synced = jar.get(DEMO_SYNC_COOKIE)?.value;
    let edits: Partial<CreatorVM> = {};
    try { edits = JSON.parse(jar.get(DEMO_PROFILE_COOKIE)?.value ?? "{}"); } catch { edits = {}; }
    return {
      id: ME.id, name: ME.display_name, firstName: ME.display_name.split(" ")[0], email: DEMO_USER.email, handle: ME.handle,
      photoUrl: ME_PROFILE.photo_url, hue: 228, city: ME.city, bio: ME.bio, status: ME.status, rank: ME.rank,
      categories: ME.categories, languages: ME_PROFILE.languages, gender: ME_PROFILE.gender, dob: ME_PROFILE.date_of_birth,
      isInfluencer: true, isEventTalent: true, interests: ME_PROFILE.interests,
      inCollege: ME.in_college, collegeName: ME.college_name, gradYear: ME.grad_year,
      followers: ME.followers, er: ME.engagement_rate, avgViews: ME.avg_views, avgLikes: ME.avg_likes, avgComments: ME.avg_comments, postsCount: ME.posts_count,
      series: ME_SERIES,
      lastSyncedAt: synced ? new Date(Number(synced)).toISOString() : new Date(Date.now() - 2 * 3600_000).toISOString(),
      igAccountId: "demo-ig", fetchStatus: "ok", fetchError: null, verifiedInsights: ME.verified_insights, audience: ME.audience,
      ratePerPost: ME_PROFILE.rate_per_post, rateFullDay: ME_PROFILE.rate_full_day, rateNotes: ME_PROFILE.rate_notes,
      posts: ME.posts.map((p) => ({ id: p.id, type: p.type, views: p.views, likes: p.likes, hue: p.hue, thumb: null, url: null, caption: p.caption })),
      phone: ME_PROFILE.phone, whatsapp: ME_PROFILE.whatsapp, portfolio: ME_PROFILE.portfolio,
      ...edits,
    };
  }

  const user = await getUser();
  const talent = await getMyTalent();
  if (!user || !talent) return null;
  const supabase = await createClient();
  const [{ data: ig }, { data: contact }, { data: media }, edu] = await Promise.all([
    supabase.from("social_accounts").select("*").eq("talent_id", talent.id).eq("platform", "instagram").maybeSingle(),
    supabase.from("talent_contacts").select("phone, whatsapp").eq("talent_id", talent.id).maybeSingle(),
    supabase.from("talent_media").select("url").eq("talent_id", talent.id).order("created_at"),
    // talent_education ships with the v2 college graph; tolerate its absence.
    supabase.from("talent_education").select("college_name, graduation_year").eq("talent_id", talent.id).maybeSingle().then((r) => r, () => ({ data: null })),
  ]);
  const [{ data: snaps }, { data: posts }] = ig
    ? await Promise.all([
        supabase.from("social_snapshots").select("followers, engagement_rate, fetched_at").eq("account_id", ig.id).order("fetched_at", { ascending: true }).limit(12),
        supabase.from("social_posts").select("id, shortcode, post_type, url, caption, thumbnail_url, likes, views, posted_at").eq("account_id", ig.id).order("posted_at", { ascending: false }).limit(9),
      ])
    : [{ data: [] as { followers: number | null; engagement_rate: number | null }[] }, { data: [] as never[] }];
  const eduRow = (edu as { data: { college_name?: string | null; graduation_year?: number | null } | null })?.data ?? null;
  const cats: string[] = talent.categories ?? [];
  const postRows = (posts ?? []) as { id: string; post_type: string | null; url: string | null; caption: string | null; thumbnail_url: string | null; likes: number | null; views: number | null }[];
  const snapRows = (snaps ?? []) as { followers: number | null; engagement_rate: number | null }[];
  return {
    id: talent.id, name: talent.display_name, firstName: String(talent.display_name).split(" ")[0], email: user.email ?? null,
    handle: ig?.handle ?? null, photoUrl: ig?.profile_pic_url ? imgSrc(ig.profile_pic_url) : talent.photo_url ?? null, hue: 228,
    city: talent.city, bio: talent.bio ?? ig?.biography ?? null, status: talent.status, rank: talent.rank,
    categories: cats, languages: talent.languages ?? [], gender: talent.gender, dob: talent.date_of_birth,
    isInfluencer: talent.is_influencer, isEventTalent: talent.is_event_talent, interests: talent.skills ?? [],
    inCollege: !!eduRow?.college_name || cats.includes("Student / Campus"), collegeName: eduRow?.college_name ?? null, gradYear: eduRow?.graduation_year ?? null,
    followers: ig?.followers ?? null, er: ig?.engagement_rate != null ? Number(ig.engagement_rate) : null,
    avgViews: ig?.avg_views != null ? Number(ig.avg_views) : null, avgLikes: ig?.avg_likes != null ? Number(ig.avg_likes) : null,
    avgComments: ig?.avg_comments != null ? Number(ig.avg_comments) : null, postsCount: ig?.posts_count ?? null,
    series: {
      followers: snapRows.map((s) => s.followers ?? 0),
      er: snapRows.map((s) => Number(s.engagement_rate ?? 0)),
      views: postRows.map((p) => p.views ?? 0).filter(Boolean).reverse(),
    },
    lastSyncedAt: ig?.last_fetched_at ?? null, igAccountId: ig?.id ?? null,
    fetchStatus: ig ? (ig.fetch_status as CreatorVM["fetchStatus"]) : "none", fetchError: ig?.fetch_error ?? null,
    verifiedInsights: false, audience: null,
    ratePerPost: talent.rate_per_post, rateFullDay: talent.rate_full_day, rateNotes: talent.rate_notes,
    posts: postRows.map((p, i) => ({ id: p.id, type: p.post_type === "Video" ? "reel" : "post", views: p.views, likes: p.likes, hue: (228 + i * 23) % 360, thumb: p.thumbnail_url ? imgSrc(p.thumbnail_url) : null, url: p.url, caption: p.caption })),
    phone: contact?.phone ?? null, whatsapp: contact?.whatsapp ?? null, portfolio: (media ?? []).map((m) => m.url),
  };
});

/* ------------------------------------------------------------------ briefs */
type RawBrief = {
  id: string; title: string; brand_display: string | null; description: string | null; deliverables: string | null;
  budget_min: number | null; budget_max: number | null; apply_by: string | null; event_date: string | null; cities: string[]; categories: string[];
  talent_kind: string; colleges_only?: boolean; min_followers: number | null; max_followers: number | null; min_engagement: number | string | null;
  ranks?: string[]; slots?: number; applicants?: number; status: string; hue?: number;
};

function toBriefVM(b: RawBrief, c: CreatorVM, applied: Stage | null, i = 0): BriefVM {
  const s = scoreBrief(b, c);
  return {
    id: b.id, title: b.title, brand: b.brand_display || "Confidential brand", hue: b.hue ?? (210 + i * 47) % 360,
    description: b.description, deliverables: b.deliverables, budgetMin: b.budget_min, budgetMax: b.budget_max,
    applyBy: b.apply_by, eventDate: b.event_date, cities: b.cities ?? [], categories: b.categories ?? [], talentKind: b.talent_kind,
    collegesOnly: !!b.colleges_only, minFollowers: b.min_followers, maxFollowers: b.max_followers,
    minEngagement: b.min_engagement != null ? Number(b.min_engagement) : null, slots: b.slots ?? null, applicants: b.applicants ?? null,
    status: b.status, ...s, applied,
  };
}

export const getBriefs = cache(async (c: CreatorVM): Promise<BriefVM[]> => {
  if (isDemo()) {
    const mine = new Map<string, Stage>(ME_APPLICATIONS.map((a) => [a.brief_id, a.stage]));
    for (const id of await demoInterest()) if (!mine.has(id)) mine.set(id, "interested");
    return DEMO_BRIEFS.map((b) => toBriefVM(b, c, mine.get(b.id) ?? null));
  }
  const supabase = await createClient();
  const [{ data: briefs }, { data: mine }] = await Promise.all([
    supabase.from("briefs").select("*").eq("status", "open").order("created_at", { ascending: false }),
    supabase.from("intents").select("brief_id, stage").eq("talent_id", c.id),
  ]);
  const applied = new Map((mine ?? []).map((i) => [i.brief_id as string, i.stage as Stage]));
  return (briefs ?? []).map((b, i) => toBriefVM(b as RawBrief, c, applied.get(b.id) ?? null, i));
});

export async function getBrief(id: string, c: CreatorVM): Promise<BriefVM | null> {
  if (isDemo()) {
    const b = getDemoBrief(id);
    if (!b) return null;
    return (await getBriefs(c)).find((x) => x.id === id) ?? null;
  }
  const supabase = await createClient();
  const [{ data: b }, { data: intent }] = await Promise.all([
    supabase.from("briefs").select("*").eq("id", id).maybeSingle(),
    supabase.from("intents").select("stage").eq("talent_id", c.id).eq("brief_id", id).maybeSingle(),
  ]);
  return b ? toBriefVM(b as RawBrief, c, (intent?.stage as Stage) ?? null) : null;
}

/* ------------------------------------------------------------ applications */
export const getApplications = cache(async (c: CreatorVM): Promise<ApplicationVM[]> => {
  if (isDemo()) {
    const fixed: ApplicationVM[] = ME_APPLICATIONS.map((a) => {
      const b = getDemoBrief(a.brief_id)!;
      return {
        id: a.id, briefId: a.brief_id, title: b.title, brand: b.brand_display, hue: b.hue, stage: a.stage, updatedAt: a.updated_at,
        next: a.next, fee: a.fee, payment: a.payment, deliverableDue: a.deliverable_due, deliverables: b.deliverables, history: a.history, source: "applied",
      };
    });
    const fresh: ApplicationVM[] = (await demoInterest())
      .filter((id) => !fixed.some((f) => f.briefId === id))
      .map((id) => getDemoBrief(id))
      .filter((b): b is NonNullable<typeof b> => !!b)
      .map((b) => ({
        id: `new-${b.id}`, briefId: b.id, title: b.title, brand: b.brand_display, hue: b.hue, stage: "interested", updatedAt: new Date().toISOString(),
        next: NEXT_STEP.interested, fee: null, payment: "not_started", deliverableDue: null, deliverables: b.deliverables,
        history: [{ stage: "interested", at: new Date().toISOString() }], source: "applied",
      }));
    return [...fresh, ...fixed];
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("intents")
    .select("id, stage, source, quoted_rate, agreed_rate, created_at, updated_at, brief_id, briefs(title, brand_display, deliverables, event_date)")
    .eq("talent_id", c.id)
    .order("updated_at", { ascending: false });
  return (data ?? []).map((i, n) => {
    const b = i.briefs as unknown as { title: string; brand_display: string | null; deliverables: string | null; event_date: string | null } | null;
    const stage = i.stage as Stage;
    const payment: PaymentStatus = stage === "delivered" ? "processing" : stage === "confirmed" ? "awaiting_delivery" : "not_started";
    const history: { stage: Stage; at: string }[] = [{ stage: "interested", at: i.created_at }];
    if (stage !== "interested") history.push({ stage, at: i.updated_at });
    return {
      id: i.id, briefId: i.brief_id, title: b?.title ?? "Brief closed", brand: b?.brand_display ?? "Confidential brand", hue: (210 + n * 47) % 360,
      stage, updatedAt: i.updated_at, next: NEXT_STEP[stage] ?? "", fee: i.agreed_rate ?? i.quoted_rate ?? null, payment,
      deliverableDue: stage === "confirmed" ? b?.event_date ?? null : null, deliverables: b?.deliverables ?? null, history,
      source: (i.source as "applied" | "invited") ?? "applied",
    };
  });
});

export function getEarnings(apps: ApplicationVM[]): EarningsVM {
  if (isDemo()) return { paid: ME_EARNINGS.paid_total, pending: ME_EARNINGS.pending_total, months: ME_EARNINGS.months, labels: ME_EARNINGS.month_labels };
  const paid = apps.filter((a) => a.payment === "paid").reduce((s, a) => s + (a.fee ?? 0), 0);
  const pending = apps.filter((a) => a.stage === "confirmed" || a.payment === "processing").reduce((s, a) => s + (a.fee ?? 0), 0);
  const labels: string[] = [], months: number[] = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(); d.setMonth(d.getMonth() - m);
    labels.push(d.toLocaleDateString("en-IN", { month: "short" }));
    months.push(apps.filter((a) => a.stage === "delivered" && new Date(a.updatedAt).getMonth() === d.getMonth()).reduce((s, a) => s + (a.fee ?? 0), 0));
  }
  return { paid, pending, months, labels };
}

export function getCampus(c: CreatorVM, briefs: BriefVM[]): CampusVM {
  const campusBriefs = briefs.filter((b) => b.collegesOnly && b.eligible && b.status === "open").length;
  if (isDemo()) return { collegeName: c.collegeName, gradYear: c.gradYear, ambassador: ME_CAMPUS.ambassador, note: ME_CAMPUS.ambassador_note, campusBriefs, peers: ME_CAMPUS.creators_from_college };
  const wants = c.interests.includes("Campus ambassador");
  return {
    collegeName: c.collegeName, gradYear: c.gradYear, ambassador: wants ? "interested" : "none",
    note: wants ? "You're on the list. We'll call when a brand launches on your campus." : "Represent brands at your college and get paid per drop.",
    campusBriefs, peers: null,
  };
}
