import Link from "next/link";
import { Check } from "lucide-react";
import { clsx } from "clsx";
import type { BriefVM } from "@/app/dashboard/_lib/types";
import { BrandTile, Deadline, MatchBadge, StageChip, payout } from "./bits";
import { InterestButton } from "./interest-button";

/** "Matched for you" brief card: match %, why, payout, countdown, one-tap interest. */
export function MatchCard({ b, className }: { b: BriefVM; className?: string }) {
  return (
    <article className={clsx("card relative flex flex-col p-5 transition-colors hover:border-line-2", className)}>
      <div className="flex items-start gap-3">
        <BrandTile name={b.brand} hue={b.hue} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] text-mute">{b.brand}</div>
          <h3 className="mt-0.5 text-[15.5px] font-semibold leading-snug">
            <Link href={`/dashboard/briefs/${b.id}`} className="after:absolute after:inset-0 after:content-[''] hover:text-cobalt-700">{b.title}</Link>
          </h3>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <MatchBadge value={b.match} />
        <Deadline date={b.applyBy} />
      </div>

      <ul className="mb-5 mt-3 space-y-1 text-[13px] text-mute">
        {b.reasons.map((r) => (
          <li key={r} className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" strokeWidth={2.4} />{r}</li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
        <div>
          <div className="text-[12px] text-mute">Payout</div>
          <div className="whitespace-nowrap text-[15px] font-semibold tabular-nums">{payout(b.budgetMin, b.budgetMax)}</div>
        </div>
        <div className="relative z-10">
          {b.applied && b.applied !== "interested" ? <StageChip stage={b.applied} /> : <InterestButton briefId={b.id} applied={!!b.applied} />}
        </div>
      </div>
    </article>
  );
}
