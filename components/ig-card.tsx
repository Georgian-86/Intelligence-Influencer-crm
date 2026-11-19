import { BadgeCheck } from "lucide-react";
import { fmtNum, imgSrc } from "@/components/ui";
import { followerTier } from "@/lib/constants";

type Acc = {
  handle: string; full_name?: string | null; profile_pic_url?: string | null; biography?: string | null;
  followers?: number | null; following?: number | null; posts_count?: number | null;
  avg_likes?: number | null; avg_comments?: number | null; avg_views?: number | null;
  engagement_rate?: number | null; view_rate?: number | null; is_verified?: boolean | null;
  fetch_status: string; fetch_error?: string | null; last_fetched_at?: string | null;
  public_email?: string | null; business_category?: string | null;
};

export function IgCard({ acc, action }: { acc: Acc; action?: React.ReactNode }) {
  const tier = followerTier(acc.followers);
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {acc.profile_pic_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgSrc(acc.profile_pic_url)} alt="" referrerPolicy="no-referrer" className="h-12 w-12 rounded-full border border-line object-cover" />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-3 text-mute">IG</div>
          )}
          <div>
            <a href={`https://www.instagram.com/${acc.handle}/`} target="_blank" rel="noreferrer" className="font-semibold hover:text-brand">
              @{acc.handle}{acc.is_verified && <BadgeCheck className="ml-1 inline h-4 w-4 text-info" aria-label="Verified" />}
            </a>
            <div className="text-xs text-mute">
              {acc.full_name ?? ""}{acc.business_category ? ` · ${acc.business_category}` : ""}{tier ? ` · ${tier.label}` : ""}
            </div>
          </div>
        </div>
        {action}
      </div>
      {acc.fetch_status === "pending" && <p className="mt-4 text-sm text-warn">Fetching Instagram data… refresh in a minute.</p>}
      {acc.fetch_status === "error" && <p className="mt-4 text-sm text-bad">Couldn&apos;t fetch: {acc.fetch_error}. Make sure the account is public.</p>}
      {acc.fetch_status === "ok" && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[
              ["Followers", fmtNum(acc.followers)],
              ["Following", fmtNum(acc.following)],
              ["Posts", fmtNum(acc.posts_count)],
              ["Avg likes", fmtNum(acc.avg_likes)],
              ["Avg comments", fmtNum(acc.avg_comments)],
              ["Engagement", acc.engagement_rate != null ? `${acc.engagement_rate}%` : "—"],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="text-[11px] uppercase tracking-wide text-mute">{l}</div>
                <div className="text-lg font-bold tabular-nums">{v}</div>
              </div>
            ))}
          </div>
          {acc.view_rate != null && <p className="mt-2 text-xs text-mute">Avg reel views {fmtNum(acc.avg_views)} · view rate {acc.view_rate}%</p>}
          {acc.biography && <p className="mt-3 whitespace-pre-line text-sm text-mute">{acc.biography}</p>}
          <p className="mt-3 text-[11px] text-mute">
            Updated {acc.last_fetched_at ? new Date(acc.last_fetched_at).toLocaleString("en-IN") : "—"} · engagement = (avg likes + avg comments) ÷ followers, last 12 posts
          </p>
        </>
      )}
    </div>
  );
}
