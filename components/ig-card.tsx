import { AlertTriangle, BadgeCheck, Eye, Heart, Loader2, MessageCircle, Play } from "lucide-react";
import { clsx } from "clsx";
import { fmtNum, imgSrc } from "@/components/ui";
import { InstagramIcon } from "@/components/brand/icons";
import { followerTier } from "@/lib/constants";

type Acc = {
  handle: string; full_name?: string | null; profile_pic_url?: string | null; biography?: string | null;
  followers?: number | null; following?: number | null; posts_count?: number | null;
  avg_likes?: number | null; avg_comments?: number | null; avg_views?: number | null;
  engagement_rate?: number | null; view_rate?: number | null; is_verified?: boolean | null;
  fetch_status: string; fetch_error?: string | null; last_fetched_at?: string | null;
  public_email?: string | null; business_category?: string | null;
};

export type IgPost = {
  id?: string; shortcode: string; post_type?: string | null; url?: string | null; caption?: string | null;
  thumbnail_url?: string | null; likes?: number | null; comments?: number | null; views?: number | null;
};

/** Rough engagement benchmark for Indian creators (used for a friendly qualitative label). */
function erQuality(er?: number | null) {
  if (er == null) return null;
  const n = Number(er);
  if (n >= 6) return { label: "Excellent", cls: "text-ok" };
  if (n >= 3) return { label: "Strong", cls: "text-ok" };
  if (n >= 1) return { label: "Average", cls: "text-warn" };
  return { label: "Low", cls: "text-bad" };
}

function Metric({ label, value, sub, subCls, primary }: { label: string; value: string; sub?: string; subCls?: string; primary?: boolean }) {
  return (
    <div className={clsx("rounded-xl border border-line bg-ink/40 px-3 py-2.5", primary && "bg-ink-3/40")}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-mute">{label}</dt>
      <dd className="mt-0.5 font-display text-xl font-bold tabular-nums text-fog sm:text-2xl">{value}</dd>
      {sub && <dd className={clsx("text-[11px] font-medium", subCls ?? "text-mute")}>{sub}</dd>}
    </div>
  );
}

export function IgCard({ acc, action, posts }: { acc: Acc; action?: React.ReactNode; posts?: IgPost[] | null }) {
  const tier = followerTier(acc.followers);
  const q = erQuality(acc.engagement_rate);
  const grid = (posts ?? []).filter((p) => p.thumbnail_url).slice(0, 6);

  return (
    <section className="card overflow-hidden" aria-label={`Instagram @${acc.handle}`}>
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 rounded-full bg-gradient-to-tr from-[#f9a825] via-brand to-[#d62976] p-[2px]">
            {acc.profile_pic_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgSrc(acc.profile_pic_url)} alt="" referrerPolicy="no-referrer" width={48} height={48} loading="lazy"
                className="h-12 w-12 rounded-full border-2 border-ink-2 bg-ink-3 object-cover" />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-ink-2 bg-ink-3 text-mute">
                <InstagramIcon className="h-5 w-5" />
              </span>
            )}
          </span>
          <div className="min-w-0">
            <a href={`https://www.instagram.com/${acc.handle}/`} target="_blank" rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1 font-semibold text-fog hover:text-brand-2">
              <span className="truncate">@{acc.handle}</span>
              {acc.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-info" aria-label="Verified" />}
            </a>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-mute">
              {acc.full_name && <span className="truncate">{acc.full_name}</span>}
              {acc.business_category && <span>· {acc.business_category}</span>}
              {tier && <span className="chip border-brand/40 bg-brand/10 px-2 py-0 text-[10.5px] text-brand-2">{tier.label}</span>}
            </div>
          </div>
        </div>
        {action}
      </div>

      {acc.fetch_status === "pending" && (
        <p role="status" className="mx-4 mb-4 flex items-center gap-2 rounded-xl border border-warn/30 bg-warn/10 px-3 py-2.5 text-sm text-warn sm:mx-5 sm:mb-5">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Fetching your Instagram data — check back in a minute.
        </p>
      )}
      {acc.fetch_status === "error" && (
        <p role="alert" className="mx-4 mb-4 flex items-start gap-2 rounded-xl border border-bad/30 bg-bad/10 px-3 py-2.5 text-sm text-bad sm:mx-5 sm:mb-5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>Couldn&apos;t fetch{acc.fetch_error ? `: ${acc.fetch_error}` : ""}. Make sure the account is public, then refresh.</span>
        </p>
      )}

      {acc.fetch_status === "ok" && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric primary label="Followers" value={fmtNum(acc.followers)} sub={acc.following != null ? `${fmtNum(acc.following)} following` : undefined} />
            <Metric primary label="Engagement" value={acc.engagement_rate != null ? `${acc.engagement_rate}%` : "—"} sub={q?.label} subCls={q?.cls} />
            <Metric label="Avg likes" value={fmtNum(acc.avg_likes)} />
            <Metric label="Avg comments" value={fmtNum(acc.avg_comments)} />
          </dl>
          {(acc.avg_views != null || acc.posts_count != null) && (
            <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
              {acc.posts_count != null && <span><span className="font-semibold text-fog/90 tabular-nums">{fmtNum(acc.posts_count)}</span> posts</span>}
              {acc.avg_views != null && <span><span className="font-semibold text-fog/90 tabular-nums">{fmtNum(acc.avg_views)}</span> avg reel views</span>}
              {acc.view_rate != null && <span><span className="font-semibold text-fog/90 tabular-nums">{acc.view_rate}%</span> view rate</span>}
            </p>
          )}

          {grid.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">Recent posts</h3>
              <ul className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {grid.map((p) => {
                  const isVideo = /video|reel|clip/i.test(p.post_type ?? "");
                  return (
                    <li key={p.id ?? p.shortcode}>
                      <a href={p.url ?? `https://www.instagram.com/p/${p.shortcode}/`} target="_blank" rel="noreferrer"
                        className="group relative block aspect-square overflow-hidden rounded-lg border border-line bg-ink-3"
                        aria-label={`Open post${p.caption ? `: ${p.caption.slice(0, 60)}` : ""}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgSrc(p.thumbnail_url)} alt="" referrerPolicy="no-referrer" loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        {isVideo && <Play className="absolute right-1.5 top-1.5 h-3.5 w-3.5 fill-white text-white drop-shadow" aria-hidden />}
                        <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-4 text-[10.5px] font-semibold text-white tabular-nums">
                          {p.likes != null && <span className="inline-flex items-center gap-0.5"><Heart className="h-3 w-3" aria-hidden />{fmtNum(p.likes)}</span>}
                          {p.comments != null && <span className="inline-flex items-center gap-0.5 max-sm:hidden"><MessageCircle className="h-3 w-3" aria-hidden />{fmtNum(p.comments)}</span>}
                          {isVideo && p.views != null && <span className="inline-flex items-center gap-0.5 max-sm:hidden"><Eye className="h-3 w-3" aria-hidden />{fmtNum(p.views)}</span>}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {acc.biography && <p className="mt-4 line-clamp-3 whitespace-pre-line text-sm text-mute">{acc.biography}</p>}
          <p className="mt-3 text-[11px] text-mute">
            Updated {acc.last_fetched_at ? new Date(acc.last_fetched_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"} · engagement = (avg likes + avg comments) ÷ followers, last 12 posts
          </p>
        </div>
      )}
    </section>
  );
}
