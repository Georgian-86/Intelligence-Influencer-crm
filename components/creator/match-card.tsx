import Link from "next/link";
import { Check } from "lucide-react";
import { clsx } from "clsx";
import type { BriefVM } from "@/app/dashboard/_lib/types";
import { BrandTile, Deadline, MatchBadge, StageChip, payout } from "./bits";
import { InterestButton } from "./interest-button";

/** "Matched for you" brief card: match %, why, payout, countdown, one-tap interest. */
export function MatchCard({ b, className }: { b: BriefVM; className?: string }) {
  return (
    <article className={clsx("card card-hover relative flex flex-col p-5", className)}>
      <div className="flex items-start gap-3">
        <BrandTile name={b.brand} hue={b.hue} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-mute">{b.brand}</div>
          <h3 className="mt-0.5 font-display text-[18px] font-semibold leading-snug tracking-[-0.02em]">
            <Link href={`/dashboard/briefs/${b.id}`} className="after:absolute after:inset-0 after:content-[''] hover:text-cobalt-700">{b.title}</Link>
          </h3>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <MatchBadge value={b.match} />
        <Deadline date={b.applyBy} />
      </div>

      <ul className="mt-4 space-y-1.5 text-[13.5px] text-ink-2">
        {b.reasons.map((r) => (
          <li key={r} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" strokeWidth={2.4} />{r}</li>
        ))}
      </ul>

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <div>
          <div className="text-[12px] text-mute">Payout</div>
          <div className="whitespace-nowrap font-display text-[17px] font-bold tracking-[-0.02em] tabular-nums sm:text-[19px]">{payout(b.budgetMin, b.budgetMax)}</div>
        </div>
        <div className="relative z-10">
          {b.applied && b.applied !== "interested" ? <StageChip stage={b.applied} className="h-11 px-4 text-[13px]" /> : <InterestButton briefId={b.id} applied={!!b.applied} />}
        </div>
      </div>
    </article>
  );
}
