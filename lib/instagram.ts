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

type FetchOpts = {
  /** Abort the Apify call after this many ms (default: Apify's own 120 s run timeout). */
  timeoutMs?: number;
  /** Reuse a profile fetched by this server instance within this window (default 0 = always fetch). */
  maxAgeMs?: number;
};

// Small per-instance cache so the onboarding preview and the post-signup sync don't pay Apify twice.
const profileCache = new Map<string, { at: number; profile: ApifyProfile }>();
const CACHE_LIMIT = 200;

export async function fetchInstagramProfile(handle: string, opts: FetchOpts = {}): Promise<ApifyProfile> {
  const key = handle.toLowerCase();
  if (opts.maxAgeMs) {
    const hit = profileCache.get(key);
    if (hit && Date.now() - hit.at < opts.maxAgeMs) return hit.profile;
  }
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
      signal: opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
    },
  );
  if (!res.ok) throw new Error(`Apify request failed (${res.status})`);
  const items = (await res.json()) as ApifyProfile[];
  const profile = items?.[0];
  if (!profile || profile.error) {
    throw new Error(profile?.errorDescription || profile?.error || "Profile not found or not public");
  }
  if (profileCache.size >= CACHE_LIMIT) profileCache.delete(profileCache.keys().next().value!);
  profileCache.set(key, { at: Date.now(), profile });
  return profile;
}

/** Public, display-safe subset of a fetched profile for the onboarding preview card. */
export type InstagramPreview = {
  handle: string;
  fullName: string | null;
  biography: string | null;
  profilePicUrl: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  verified: boolean;
  isPrivate: boolean;
  category: string | null;
  engagementRate: number | null;
  thumbnails: string[];
};

export function toInstagramPreview(handle: string, p: ApifyProfile): InstagramPreview {
  const metrics = computeMetrics(p.followersCount, p.latestPosts);
  return {
    handle: p.username?.toLowerCase() || handle,
    fullName: p.fullName || null,
    biography: p.biography || null,
    profilePicUrl: p.profilePicUrlHD || p.profilePicUrl || null,
    followers: p.followersCount ?? null,
    following: p.followsCount ?? null,
    posts: p.postsCount ?? null,
    verified: !!p.verified,
    isPrivate: !!p.private,
    category: p.businessCategoryName ?? null,
    engagementRate: metrics.engagement_rate,
    thumbnails: (p.latestPosts ?? []).map((x) => x.displayUrl).filter((u): u is string => !!u).slice(0, 3),
  };
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
export async function syncInstagramAccount(accountId: string, opts: Pick<FetchOpts, "maxAgeMs"> = {}) {
  const db = createAdminClient();
  const { data: account, error } = await db.from("social_accounts").select("id, handle").eq("id", accountId).single();
  if (error || !account) throw new Error("Account not found");

  try {
    const p = await fetchInstagramProfile(account.handle, opts);
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
