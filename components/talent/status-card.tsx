import Link from "next/link";
import { clsx } from "clsx";
import { Ban, Hourglass, Search, ShieldCheck, CircleX, Trophy } from "lucide-react";
import { RANKS, RANK_LABEL, type Rank } from "@/lib/constants";

const STATUS: Record<string, { title: string; copy: string; icon: typeof Hourglass; tone: string; ring: string }> = {
  pending: { title: "Profile under review", copy: "The Vigor team reviews new profiles within a couple of days. Complete your profile to speed it up.", icon: Hourglass, tone: "text-warn", ring: "bg-warn/10 border-warn/30" },
  screening: { title: "You're being screened", copy: "We may contact you for a short virtual interview. Keep WhatsApp handy.", icon: Search, tone: "text-info", ring: "bg-info/10 border-info/30" },
  approved: { title: "You're approved", copy: "Briefs that match your profile are open to you. One tap on “I'm in” and we'll take it from there.", icon: ShieldCheck, tone: "text-ok", ring: "bg-ok/10 border-ok/30" },
  rejected: { title: "Not approved this time", copy: "Update your profile — stronger bio, rates and samples — and our team will take another look.", icon: CircleX, tone: "text-bad", ring: "bg-bad/10 border-bad/30" },
  suspended: { title: "Profile suspended", copy: "Your profile is paused. Contact the Vigor team to sort it out.", icon: Ban, tone: "text-bad", ring: "bg-bad/10 border-bad/30" },
};

const RANK_TEXT: Record<Rank, string> = { bronze: "text-bronze", silver: "text-silver", gold: "text-gold", platinum: "text-platinum" };
const RANK_BG: Record<Rank, string> = { bronze: "bg-bronze", silver: "bg-silver", gold: "bg-gold", platinum: "bg-platinum" };

/** Profile status (screening / approved / …) + rank ladder. */
export function StatusCard({ status, rank }: { status: string; rank: string }) {
  const s = STATUS[status] ?? STATUS.pending;
  const r = (RANKS as readonly string[]).includes(rank) ? (rank as Rank) : "bronze";
  const ri = RANKS.indexOf(r);
  const Icon = s.icon;
  return (
    <section aria-labelledby="status-title" className="card overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className={clsx("grid h-11 w-11 shrink-0 place-items-center rounded-xl border", s.ring)} aria-hidden>
            <Icon className={clsx("h-5 w-5", s.tone)} />
          </span>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">Profile status</div>
            <h2 id="status-title" className={clsx("text-lg font-bold", s.tone)}>{s.title}</h2>
            <p className="mt-0.5 max-w-xl text-sm text-mute">{s.copy}</p>
          </div>
        </div>
        {status === "approved" ? (
          <Link href="/dashboard/briefs" className="btn-primary min-h-11 shrink-0">See open briefs</Link>
        ) : status === "rejected" || status === "pending" ? (
          <Link href="/dashboard/profile" className="btn-ghost min-h-11 shrink-0">Improve profile</Link>
        ) : null}
      </div>

      <div className="border-t border-line bg-ink/40 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className={clsx("h-4 w-4", RANK_TEXT[r])} aria-hidden />
            <span className="text-mute">Rank</span>
            <span className={clsx("font-semibold", RANK_TEXT[r])}>{RANK_LABEL[r]}</span>
          </div>
          {ri < RANKS.length - 1 && <span className="text-xs text-mute">Next: <span className="capitalize text-fog/80">{RANKS[ri + 1]}</span></span>}
        </div>
        <ol className="mt-3 grid grid-cols-4 gap-1.5" aria-label={`Rank ${ri + 1} of ${RANKS.length}`}>
          {RANKS.map((k, i) => (
            <li key={k} className="space-y-1">
              <span aria-hidden className={clsx("block h-1.5 rounded-full", i <= ri ? RANK_BG[k] : "bg-ink-4")} />
              <span className={clsx("block text-[10.5px] capitalize", i === ri ? clsx("font-semibold", RANK_TEXT[k]) : "text-mute")}>{k}</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-mute">Complete campaigns, earn good ratings and show up reliably to move up.</p>
      </div>
    </section>
  );
}
