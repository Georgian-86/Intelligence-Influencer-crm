import Link from "next/link";
import { clsx } from "clsx";
import { CalendarDays, Clock, MapPin, Wallet } from "lucide-react";
import { InterestButton } from "./interest-button";
import { deadlineLabel, deliverableItems, fmtDate, payLabel, stageMeta, type TalentBrief } from "./model";

/** Initial-letter monogram so confidential brands still get a recognisable tile. */
export function BrandTile({ name, className = "h-11 w-11 text-base" }: { name: string; className?: string }) {
  const letter = (name.replace(/^confidential\s*/i, "").trim()[0] ?? "V").toUpperCase();
  return (
    <span aria-hidden className={clsx("grid shrink-0 place-items-center rounded-xl border border-line-2 bg-ink-3 font-display font-bold text-brand-2", className)}>
      {letter}
    </span>
  );
}

export function BriefCard({ b, stage, compact = false }: { b: TalentBrief; stage?: string; compact?: boolean }) {
  const brand = b.brand_display || "Confidential brand";
  const deadline = deadlineLabel(b.apply_by);
  const items = deliverableItems(b.deliverables, compact ? 2 : 3);
  const city = b.cities.length === 0 ? "Any city" : b.cities.length > 2 ? `${b.cities.slice(0, 2).join(", ")} +${b.cities.length - 2}` : b.cities.join(", ");

  return (
    <article className="card card-hover group relative flex h-full flex-col p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <BrandTile name={brand} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-brand-2">{brand}</div>
          <h3 className="mt-0.5 text-[17px] font-semibold leading-snug text-fog">
            <Link href={`/dashboard/briefs/${b.id}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-brand">
              {b.title}
            </Link>
          </h3>
        </div>
      </div>

      {!compact && b.description && <p className="mt-3 line-clamp-2 text-sm text-mute">{b.description}</p>}

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div className="col-span-2 flex items-center gap-2">
          <dt className="sr-only">Pay</dt>
          <Wallet className="h-4 w-4 shrink-0 text-mute" aria-hidden />
          <dd className="truncate font-semibold tabular-nums text-fog">{payLabel(b)}</dd>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <dt className="sr-only">City</dt>
          <MapPin className="h-4 w-4 shrink-0 text-mute" aria-hidden />
          <dd className="truncate text-fog/90">{city}</dd>
        </div>
        {b.event_date && (
          <div className="flex min-w-0 items-center gap-2">
            <dt className="sr-only">Date</dt>
            <CalendarDays className="h-4 w-4 shrink-0 text-mute" aria-hidden />
            <dd className="truncate text-fog/90">{fmtDate(b.event_date)}</dd>
          </div>
        )}
        {deadline && (
          <div className="flex min-w-0 items-center gap-2">
            <dt className="sr-only">Deadline</dt>
            <Clock className={clsx("h-4 w-4 shrink-0", deadline.urgent ? "text-warn" : "text-mute")} aria-hidden />
            <dd className={clsx("truncate", deadline.urgent ? "font-medium text-warn" : "text-fog/90")}>{deadline.text}</dd>
          </div>
        )}
      </dl>

      {items.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Deliverables">
          {items.map((d) => <li key={d} className="chip max-w-full truncate bg-ink-3/60 text-fog/90">{d}</li>)}
        </ul>
      )}

      <div className="relative z-10 mt-auto flex items-center justify-between gap-3 pt-4">
        <InterestButton briefId={b.id} alreadyLabel={stage ? stageMeta(stage).label : undefined} />
        <Link href={`/dashboard/briefs/${b.id}`} className="btn-quiet min-h-11 px-3 text-xs" tabIndex={-1} aria-hidden>
          Details →
        </Link>
      </div>
    </article>
  );
}
