import { clsx } from "clsx";
import { Check, X } from "lucide-react";
import { TRACK, STAGE_META, isClosed, type TrackStage } from "./model";

/**
 * Visual status tracker for one application:
 * interested → shortlisted → contacted → negotiating → confirmed → delivered.
 * Rejected / dropped render as a distinct muted "closed" rail so a creator always knows the outcome.
 *
 * `reachedIndex` (optional) is the furthest happy-path stage reached before closing; without it a closed
 * application shows only the first step as done.
 */
export function PipelineTracker({ stage, reachedIndex, className }: { stage: string; reachedIndex?: number; className?: string }) {
  const closed = isClosed(stage);
  const idx = closed ? (reachedIndex ?? 0) : Math.max(0, TRACK.indexOf(stage as TrackStage));
  const done = stage === "delivered";
  const pct = (idx / (TRACK.length - 1)) * 100;

  return (
    <div className={className}>
      <ol
        className="relative grid grid-cols-6"
        aria-label={closed ? `Application ${STAGE_META[stage as "rejected"].label.toLowerCase()}` : `Stage ${idx + 1} of ${TRACK.length}: ${STAGE_META[TRACK[idx]].label}`}
      >
        {/* rail */}
        <span aria-hidden className="absolute left-[calc(100%/12)] right-[calc(100%/12)] top-[13px] h-[2px] rounded-full bg-line" />
        <span
          aria-hidden
          className={clsx("absolute left-[calc(100%/12)] top-[13px] h-[2px] rounded-full transition-[width] duration-500 ease-[var(--ease-out-expo)]",
            closed ? "bg-line-2" : done ? "bg-ok" : "bg-gradient-to-r from-brand to-brand-2")}
          style={{ width: `calc((100% - 100%/6) * ${pct / 100})` }}
        />
        {TRACK.map((s, i) => {
          const isPast = i < idx || (done && i === idx);
          const isCurrent = !closed && !done && i === idx;
          const meta = STAGE_META[s];
          return (
            <li key={s} className="relative flex flex-col items-center gap-1.5 text-center" aria-current={isCurrent ? "step" : undefined}>
              <span
                className={clsx(
                  "relative z-10 grid h-7 w-7 place-items-center rounded-full border-2 text-[11px] font-bold tabular-nums transition-colors",
                  closed
                    ? i <= idx ? "border-line-2 bg-ink-4 text-mute" : "border-line bg-ink-2 text-mute/60"
                    : isPast
                      ? done ? "border-ok bg-ok text-black" : "border-brand bg-brand text-black"
                      : isCurrent
                        ? "border-brand bg-ink text-brand-2 shadow-[0_0_0_4px_rgb(255_106_26/0.18)]"
                        : "border-line-2 bg-ink-2 text-mute",
                )}
              >
                {isPast || (closed && i < idx) ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : i + 1}
                {isCurrent && <span aria-hidden className="absolute inset-0 animate-ping rounded-full border border-brand/50 motion-reduce:hidden" />}
              </span>
              <span className={clsx(
                "text-[10.5px] leading-tight sm:text-xs",
                isCurrent ? "font-semibold text-fog" : isPast && !closed ? "text-fog/80" : "text-mute",
                // keep mobile readable: only current + ends labelled below sm
                !isCurrent && i !== 0 && i !== TRACK.length - 1 && "max-sm:sr-only",
              )}>
                {meta.short}
              </span>
            </li>
          );
        })}
      </ol>
      {closed && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-ink-3/60 px-3 py-2 text-xs text-mute">
          <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span><span className="font-semibold text-fog/90">{STAGE_META[stage as "rejected"].label}</span> · {STAGE_META[stage as "rejected"].next}</span>
        </div>
      )}
    </div>
  );
}
