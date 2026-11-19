"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Eye, Heart, RefreshCw, Users } from "lucide-react";
import { clsx } from "clsx";
import { InstagramIcon } from "@/components/brand/icons";
import { Metric, km } from "@/components/kit";
import { refreshMyInstagram } from "@/app/dashboard/actions";
import { relTime } from "@/app/dashboard/_lib/score";

const delta = (s: number[]) => {
  if (s.length < 5) return null;
  const a = s[s.length - 5], b = s[s.length - 1];
  return a ? Math.round(((b - a) / a) * 1000) / 10 : null;
};

/** Followers / ER / avg-views tiles with sparklines, plus "last synced" and a manual refresh. */
export function StatsSync({ followers, er, avgViews, series, lastSyncedAt, accountId, fetchStatus, fetchError, compact = false }: {
  followers: number | null; er: number | null; avgViews: number | null; series: { followers: number[]; er: number[]; views: number[] };
  lastSyncedAt: string | null; accountId: string | null; fetchStatus: string; fetchError: string | null; compact?: boolean;
}) {
  const [synced, setSynced] = useState(lastSyncedAt);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [, tick] = useState(0);
  useEffect(() => { setSynced(lastSyncedAt); }, [lastSyncedAt]);
  useEffect(() => { const t = setInterval(() => tick((v) => v + 1), 60_000); return () => clearInterval(t); }, []);

  const refresh = () => {
    if (!accountId) return;
    setMsg(null);
    start(async () => {
      const r = await refreshMyInstagram(accountId);
      if (r.ok) { setSynced(r.syncedAt ?? new Date().toISOString()); setMsg({ ok: true, text: "Updated just now" }); }
      else setMsg({ ok: false, text: r.error });
    });
  };

  if (!accountId) {
    return (
      <div className="card flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
        <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[radial-gradient(circle_at_30%_110%,#ffd776,#f3a536_25%,#e1306c_55%,#833ab4)] text-white"><InstagramIcon className="h-5 w-5" /></span>
        <div className="flex-1">
          <div className="font-semibold">Connect Instagram to unlock creator briefs</div>
          <p className="text-[13.5px] text-mute">We fetch followers, engagement and views automatically. Public data only.</p>
        </div>
        <Link href="/dashboard/profile#stats" className="btn-primary">Connect Instagram</Link>
      </div>
    );
  }

  return (
    <div>
      <div className={clsx("mb-3 flex flex-wrap items-center justify-between gap-2", compact && "mb-2")}>
        <p className="flex items-center gap-2 text-[13px] text-mute" aria-live="polite">
          <InstagramIcon className="h-4 w-4 text-ink-2" />
          {fetchStatus === "pending" ? "Fetching your Instagram stats…" : fetchStatus === "error" ? <span className="text-bad">Couldn&apos;t sync: {fetchError ?? "account not public"}</span> : <>Last synced from Instagram <span className="font-medium text-ink-2" suppressHydrationWarning>{relTime(synced)}</span></>}
          {msg && <span className={msg.ok ? "text-ok" : "text-bad"}>· {msg.text}</span>}
        </p>
        <button type="button" onClick={refresh} disabled={pending} className="btn-ghost btn-sm min-h-11 sm:min-h-9">
          <RefreshCw className={clsx("h-3.5 w-3.5", pending && "animate-spin")} /> {pending ? "Syncing" : "Refresh"}
        </button>
      </div>
      <div className={clsx("grid gap-3 sm:gap-4", compact ? "grid-cols-3" : "sm:grid-cols-3")}>
        <Metric label="Followers" value={km(followers)} delta={delta(series.followers)} hint="vs 4 weeks ago" spark={series.followers.length > 1 ? series.followers : undefined} icon={<Users className="h-4 w-4 text-ink-2" />} className={clsx(pending && "opacity-60 transition-opacity")} />
        <Metric label="Engagement rate" value={er != null ? `${er}%` : "—"} delta={delta(series.er)} hint="Likes + comments ÷ followers" spark={series.er.length > 1 ? series.er : undefined} icon={<Heart className="h-4 w-4 text-ink-2" />} className={clsx(pending && "opacity-60 transition-opacity")} />
        <Metric label="Avg Reel views" value={km(avgViews)} delta={delta(series.views)} hint="Last 12 Reels" spark={series.views.length > 1 ? series.views : undefined} icon={<Eye className="h-4 w-4 text-ink-2" />} className={clsx(pending && "opacity-60 transition-opacity")} />
      </div>
    </div>
  );
}
