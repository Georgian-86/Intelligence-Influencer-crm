import Link from "next/link";
import { clsx } from "clsx";
import { ChevronRight, Sparkles } from "lucide-react";
import { fmtINR } from "@/components/ui";
import { withdrawInterest } from "@/app/dashboard/actions";
import { BrandTile } from "./brief-card";
import { PipelineTracker } from "./pipeline-tracker";
import { TONE_CHIP, fmtDate, isClosed, stageMeta, timeAgo } from "./model";

export type TalentApplication = {
  id: string;
  stage: string;
  source?: string | null;
  quoted_rate?: number | null;
  agreed_rate?: number | null;
  created_at: string;
  updated_at?: string | null;
  brief_id: string;
  brief: { title: string; brand_display: string | null; event_date?: string | null } | null;
};

export function StageChip({ stage }: { stage: string }) {
  const m = stageMeta(stage);
  return <span className={clsx("chip shrink-0", TONE_CHIP[m.tone])}>{m.label}</span>;
}

/** Full tracker card for /dashboard/applications. */
export function ApplicationCard({ a }: { a: TalentApplication }) {
  const m = stageMeta(a.stage);
  const brand = a.brief?.brand_display || "Confidential brand";
  const closed = isClosed(a.stage);
  const updated = a.updated_at && a.updated_at !== a.created_at ? a.updated_at : null;
  return (
    <article className={clsx("card p-4 sm:p-5", closed && "opacity-80")}>
      <div className="flex items-start gap-3">
        <BrandTile name={brand} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-brand-2">
            {brand}
            {a.source === "invited" && <span className="ml-2 inline-flex items-center gap-1 normal-case tracking-normal text-info"><Sparkles className="h-3 w-3" aria-hidden />Invited by Vigor</span>}
          </div>
          <h3 className="mt-0.5 font-semibold leading-snug text-fog">
            {a.brief ? <Link href={`/dashboard/briefs/${a.brief_id}`} className="hover:text-brand-2">{a.brief.title}</Link> : "Brief closed"}
          </h3>
        </div>
        <StageChip stage={a.stage} />
      </div>

      <PipelineTracker stage={a.stage} className="mt-5" />

      {!closed && (
        <p className="mt-4 rounded-xl border border-line bg-ink/40 px-3 py-2.5 text-sm text-fog/90">
          <span className="font-semibold text-fog">What&apos;s next · </span>{m.next}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-mute">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>Applied {fmtDate(a.created_at)}</span>
          {updated && <span>Updated {timeAgo(updated)}</span>}
          {a.agreed_rate != null ? <span>Agreed fee <span className="font-semibold text-fog/90">{fmtINR(a.agreed_rate)}</span></span>
            : a.quoted_rate != null && <span>Your fee <span className="font-semibold text-fog/90">{fmtINR(a.quoted_rate)}</span></span>}
          {a.brief?.event_date && <span>Event {fmtDate(a.brief.event_date)}</span>}
        </div>
        {a.stage === "interested" && (
          <form action={withdrawInterest}>
            <input type="hidden" name="intent_id" value={a.id} />
            <button className="btn-quiet min-h-11 px-3 text-xs hover:text-bad">Withdraw</button>
          </form>
        )}
      </div>
    </article>
  );
}

/** Compact row for the Home "latest updates" list. */
export function ApplicationUpdateRow({ a }: { a: TalentApplication }) {
  const brand = a.brief?.brand_display || "Confidential brand";
  return (
    <li>
      <Link href="/dashboard/applications" className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-3/50">
        <BrandTile name={brand} className="h-9 w-9 text-sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-fog">{a.brief?.title ?? "Brief closed"}</span>
          <span className="mt-1 flex min-w-0 items-center gap-2">
            <StageChip stage={a.stage} />
            <span className="truncate text-xs text-mute">{brand} · {timeAgo(a.updated_at ?? a.created_at)}</span>
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-mute" aria-hidden />
      </Link>
    </li>
  );
}
