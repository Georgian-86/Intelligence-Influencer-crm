import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Extract an Instagram handle from a URL, "@handle" or bare handle. */
export function parseInstagramHandle(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  let handle = raw;
  const m = raw.match(/instagram\.com\/([^/?#]+)/i);
  if (m) handle = m[1];
  handle = handle.replace(/^@/, "").toLowerCase();
  if (["p", "reel", "reels", "stories", "explore"].includes(handle)) return null;
  return /^[a-z0-9._]{1,30}$/.test(handle) ? handle : null;
}

type ApifyPost = {
  type?: string;
  shortCode?: string;
  url?: string;
  caption?: string;
  displayUrl?: string;
  likesCount?: number | null;
  commentsCount?: number | null;
  videoViewCount?: number | null;
  videoPlayCount?: number | null;
  timestamp?: string;
  isPinned?: boolean;
};

type ApifyProfile = {
  username?: string;
  fullName?: string;
  biography?: string;
  externalUrl?: string | null;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  verified?: boolean;
  private?: boolean;
  businessCategoryName?: string | null;
  profilePicUrlHD?: string;
  profilePicUrl?: string;
  latestPosts?: ApifyPost[];
  error?: string;
  errorDescription?: string;
};

export async function fetchInstagramProfile(handle: string): Promise<ApifyProfile> {
  const actor = process.env.APIFY_INSTAGRAM_ACTOR || "apify~instagram-profile-scraper";
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?timeout=120`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.APIFY_TOKEN}`,
      },
      body: JSON.stringify({ usernames: [handle] }),
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`Apify request failed (${res.status})`);
  const items = (await res.json()) as ApifyProfile[];
  const profile = items?.[0];
  if (!profile || profile.error) {
    throw new Error(profile?.errorDescription || profile?.error || "Profile not found or not public");
  }
  return profile;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round = (n: number | null, d = 2) => (n == null ? null : Math.round(n * 10 ** d) / 10 ** d);

/** Engagement metrics from the latest (non-pinned) posts, up to 12. */
export function computeMetrics(followers: number | undefined, posts: ApifyPost[] = []) {
  const recent = posts.filter((p) => !p.isPinned).slice(0, 12);
  const likes = recent.map((p) => p.likesCount).filter((n): n is number => typeof n === "number" && n >= 0);
  const comments = recent.map((p) => p.commentsCount).filter((n): n is number => typeof n === "number" && n >= 0);
  const views = recent
    .filter((p) => p.type === "Video")
    .map((p) => p.videoPlayCount ?? p.videoViewCount)
    .filter((n): n is number => typeof n === "number" && n > 0);
  const avgLikes = avg(likes);
  const avgComments = avg(comments);
  const avgViews = avg(views);
  const engagementRate =
    followers && avgLikes != null ? ((avgLikes + (avgComments ?? 0)) / followers) * 100 : null;
  const viewRate = followers && avgViews != null ? (avgViews / followers) * 100 : null;
  return {
    avg_likes: round(avgLikes, 1),
    avg_comments: round(avgComments, 1),
    avg_views: round(avgViews, 1),
    engagement_rate: round(engagementRate),
    view_rate: round(viewRate),
  };
}

function extractContacts(text = "") {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const phone = text.match(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/)?.[0] ?? null;
  return { email, phone };
}

/** Fetch a social account from Apify and store profile, metrics, snapshot and posts. */
export async function syncInstagramAccount(accountId: string) {
  const db = createAdminClient();
  const { data: account, error } = await db.from("social_accounts").select("id, handle").eq("id", accountId).single();
  if (error || !account) throw new Error("Account not found");

  try {
    const p = await fetchInstagramProfile(account.handle);
    const metrics = computeMetrics(p.followersCount, p.latestPosts);
    const contacts = extractContacts(p.biography);
    await db
      .from("social_accounts")
      .update({
        full_name: p.fullName ?? null,
        biography: p.biography ?? null,
        profile_pic_url: p.profilePicUrlHD || p.profilePicUrl || null,
        external_url: p.externalUrl ?? null,
        business_category: p.businessCategoryName ?? null,
        is_verified: p.verified ?? null,
        is_private: p.private ?? null,
        followers: p.followersCount ?? null,
        following: p.followsCount ?? null,
        posts_count: p.postsCount ?? null,
        ...metrics,
        public_email: contacts.email,
        public_phone: contacts.phone,
        fetch_status: "ok",
        fetch_error: null,
        last_fetched_at: new Date().toISOString(),
      })
      .eq("id", account.id);

    await db.from("social_snapshots").insert({
      account_id: account.id,
      followers: p.followersCount ?? null,
      engagement_rate: metrics.engagement_rate,
      view_rate: metrics.view_rate,
    });

    const posts = (p.latestPosts ?? [])
      .filter((x) => x.shortCode)
      .map((x) => ({
        account_id: account.id,
        shortcode: x.shortCode!,
        post_type: x.type ?? null,
        url: x.url ?? null,
        caption: x.caption?.slice(0, 2000) ?? null,
        thumbnail_url: x.displayUrl ?? null,
        likes: typeof x.likesCount === "number" && x.likesCount >= 0 ? x.likesCount : null,
        comments: typeof x.commentsCount === "number" && x.commentsCount >= 0 ? x.commentsCount : null,
        views: x.videoPlayCount ?? x.videoViewCount ?? null,
        posted_at: x.timestamp ?? null,
      }));
    if (posts.length) await db.from("social_posts").upsert(posts, { onConflict: "account_id,shortcode" });
    return { ok: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Fetch failed";
    await db
      .from("social_accounts")
      .update({ fetch_status: "error", fetch_error: message, last_fetched_at: new Date().toISOString() })
      .eq("id", account.id);
    return { ok: false as const, error: message };
  }
}

/* ------------------------------------------------------------------ onboarding preview */

const NICHE_WORDS: [string, RegExp][] = [
  ["Fashion", /\b(fashion|style|stylist|ootd|outfits?|fits?|thrift)\b/i],
  ["Beauty", /\b(beauty|makeup|mua|skincare|skin|grwm)\b/i],
  ["Lifestyle", /\b(lifestyle|vlogs?|daily|life)\b/i],
  ["Food", /\b(food|foodie|eats|recipes?|chef|caf[eé]s?|chai)\b/i],
  ["Travel", /\b(travel|traveller|wanderlust|trips?|backpack)\b/i],
  ["Fitness", /\b(fitness|gym|workout|yoga|athlete|runner)\b/i],
  ["Tech", /\b(tech|gadgets?|coder|developer)\b/i],
  ["Comedy", /\b(comedy|comedian|memes?|funny|sketch)\b/i],
  ["Music", /\b(music|singer|musician|producer|guitar|rapper)\b/i],
  ["Dance", /\b(dance|dancer|choreo\w*)\b/i],
  ["Gaming", /\b(gaming|gamer|esports|bgmi|valorant)\b/i],
  ["Finance", /\b(finance|money|investing|stocks)\b/i],
  ["Photography", /\b(photo\w*|shot on)\b/i],
  ["Student / Campus", /(\b(campus|college|student|uni|university|batch)\b|'\d{2}\b)/i],
];

const CITY_WORDS: [string, RegExp][] = [
  ["Mumbai", /\b(mumbai|bombay|bandra|andheri|thane)\b/i],
  ["Pune", /\bpune\b/i],
  ["Delhi", /\b(delhi|ncr|gurgaon|gurugram|noida)\b/i],
  ["Bangalore", /\b(bangalore|bengaluru|blr)\b/i],
  ["Hyderabad", /\b(hyderabad|hyd)\b/i],
  ["Chennai", /\b(chennai|madras)\b/i],
  ["Kolkata", /\b(kolkata|calcutta)\b/i],
  ["Ahmedabad", /\b(ahmedabad|amdavad)\b/i],
  ["Chandigarh", /\bchandigarh\b/i],
  ["Goa", /\bgoa\b/i],
];

/** Best-effort niche / city / language inference from a public bio (shown as editable chips, never trusted blindly). */
export function inferFromBio(bio = "", category?: string | null) {
  const text = `${bio} ${category ?? ""}`;
  const niches = NICHE_WORDS.filter(([, re]) => re.test(text)).map(([n]) => n).slice(0, 4);
  const city = CITY_WORDS.find(([, re]) => re.test(text))?.[0] ?? null;
  const languages = ["English"];
  if (/[ऀ-ॿ]/.test(bio) || /\b(hindi|desi|yaar|bhai)\b/i.test(bio)) languages.push("Hindi");
  if (/\bmarathi\b/i.test(bio)) languages.push("Marathi");
  if (/[஀-௿]/.test(bio) || /\btamil\b/i.test(bio)) languages.push("Tamil");
  const year = bio.match(/'(2[5-9]|30)\b/)?.[1] ?? bio.match(/\b20(2[5-9]|30)\b/)?.[1];
  return { niches, city, languages, gradYear: year ? 2000 + Number(year) : null };
}

export type InstagramPreview = {
  handle: string;
  fullName: string | null;
  bio: string | null;
  photoUrl: string | null;
  followers: number | null;
  engagementRate: number | null;
  avgViews: number | null;
  isPrivate: boolean;
  isVerified: boolean;
  posts: { id: string; thumb: string | null; views: number | null; likes: number | null; type: string; hue: number }[];
  niches: string[];
  city: string | null;
  languages: string[];
  gradYear: number | null;
};

/** Live preview for onboarding step 1: fetch from Apify and shape it for the preview card. */
export async function previewInstagram(handle: string): Promise<InstagramPreview> {
  const p = await fetchInstagramProfile(handle);
  const m = computeMetrics(p.followersCount, p.latestPosts);
  const inf = inferFromBio(p.biography, p.businessCategoryName);
  const proxy = (u?: string | null) => (u ? `/api/img?u=${encodeURIComponent(u)}` : null);
  const score = (x: ApifyPost) => x.videoPlayCount ?? x.videoViewCount ?? x.likesCount ?? 0;
  const top = (p.latestPosts ?? []).filter((x) => !x.isPinned).sort((a, b) => score(b) - score(a)).slice(0, 3);
  return {
    handle: p.username ?? handle,
    fullName: p.fullName ?? null,
    bio: p.biography ?? null,
    photoUrl: proxy(p.profilePicUrlHD || p.profilePicUrl),
    followers: p.followersCount ?? null,
    engagementRate: m.engagement_rate,
    avgViews: m.avg_views,
    isPrivate: !!p.private,
    isVerified: !!p.verified,
    posts: top.map((x, i) => ({
      id: x.shortCode ?? String(i), thumb: proxy(x.displayUrl), views: x.videoPlayCount ?? x.videoViewCount ?? null,
      likes: x.likesCount ?? null, type: x.type === "Video" ? "reel" : "post", hue: (228 + i * 40) % 360,
    })),
    ...inf,
  };
}
