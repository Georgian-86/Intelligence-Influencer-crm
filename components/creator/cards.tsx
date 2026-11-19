import Link from "next/link";
import { clsx } from "clsx";
import { ArrowRight, Check, GraduationCap, Upload, Users, Wallet } from "lucide-react";
import type { ApplicationVM, CampusVM, EarningsVM } from "@/app/dashboard/_lib/types";
import { fmtDate, JOURNEY, journeyIndex, relTime, shortCollege } from "@/app/dashboard/_lib/score";
import { BrandTile, StageChip } from "./bits";

/* ---------------------------------------------------------------- pipeline timeline (home) */
export function PipelineTimeline({ apps }: { apps: ApplicationVM[] }) {
  return (
    <ol className="relative">
      {apps.map((a, i) => {
        const live = a.stage === "confirmed";
        return (
          <li key={a.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < apps.length - 1 && <span aria-hidden className="absolute left-[21px] top-12 bottom-1 w-px bg-line" />}
            <BrandTile name={a.brand} hue={a.hue} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <Link href={`/dashboard/applications#${a.id}`} className="truncate font-semibold hover:text-cobalt-700">{a.title}</Link>
                <StageChip stage={a.payment === "paid" ? "delivered" : a.stage} />
              </div>
              <div className="mt-0.5 text-[12.5px] text-mute">{a.brand} · updated <span suppressHydrationWarning>{relTime(a.updatedAt)}</span></div>
              <div className={clsx("mt-2.5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] px-3.5 py-2.5 text-[13.5px]", live ? "bg-cobalt-50 text-cobalt-800" : "bg-canvas text-ink-2")}>
                <span><span className="font-semibold">Next: </span>{a.next}</span>
                {live && (
                  <Link href={`/dashboard/applications#${a.id}`} className="btn-primary btn-sm min-h-9"><Upload className="h-3.5 w-3.5" /> Upload draft</Link>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------------------------------------------------------- earnings */
export function EarningsCard({ e }: { e: EarningsVM }) {
  const max = Math.max(1, ...e.months);
  return (
    <section className="card p-5" aria-labelledby="earn-h">
      <div className="flex items-center justify-between">
        <h2 id="earn-h" className="flex items-center gap-2 text-[14px] font-semibold text-ink-2"><Wallet className="h-4 w-4 text-mute" /> Earnings</h2>
        <Link href="/dashboard/applications" className="inline-flex min-h-11 items-center text-[13px] font-semibold text-cobalt hover:underline">Payments</Link>
      </div>
      <div className="mt-1 flex items-end justify-between gap-4">
        <div>
          <div className="font-display text-[34px] font-bold leading-none tracking-[-0.04em] tabular-nums">₹{e.paid.toLocaleString("en-IN")}</div>
          <div className="mt-1.5 text-[13px] text-mute">paid out so far</div>
        </div>
        <div className="flex h-16 items-end gap-1.5" aria-label="Earnings by month" role="img">
          {e.months.map((m, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="flex h-12 w-5 items-end overflow-hidden rounded-[5px] bg-canvas-2">
                <div className={clsx("w-full origin-bottom rounded-[5px]", i === e.months.length - 1 ? "bg-cobalt" : "bg-cobalt-200")} style={{ height: "100%", transform: `scaleY(${m ? Math.max(0.08, m / max) : 0})` }} />
              </div>
              <span className="text-[10px] text-faint">{e.labels[i]?.slice(0, 1)}</span>
            </div>
          ))}
        </div>
      </div>
      {e.pending > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-[14px] bg-ok-bg px-3.5 py-2.5 text-[13.5px] text-ok">
          <span className="font-medium">On the way after delivery</span>
          <span className="font-display font-bold tabular-nums">₹{e.pending.toLocaleString("en-IN")}</span>
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- campus */
export function CampusCard({ c }: { c: CampusVM }) {
  if (!c.collegeName) {
    return (
      <section className="card p-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-ink-2"><GraduationCap className="h-4 w-4 text-mute" /> Campus</div>
        <p className="mt-2 text-[14px] text-ink-2">In college? Add it to unlock fest, sampling and ambassador briefs.</p>
        <Link href="/dashboard/profile#about" className="btn-ghost mt-4 w-full">Add your college</Link>
      </section>
    );
  }
  const status = { none: "Not applied", interested: "On the list", shortlisted: "Shortlisted", active: "Active ambassador" }[c.ambassador];
  return (
    <section className="grain relative overflow-hidden rounded-[20px] bg-night p-5 text-white" aria-labelledby="campus-h">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgb(43_75_255/.6),transparent)]" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <h2 id="campus-h" className="flex items-center gap-2 text-[13px] font-semibold text-white/70"><GraduationCap className="h-4 w-4" /> Your campus</h2>
          {c.gradYear && <span className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold tabular-nums">Class of {c.gradYear}</span>}
        </div>
        <div className="mt-2 font-display text-[24px] font-bold leading-tight tracking-[-0.03em]">{shortCollege(c.collegeName)}</div>
        {c.peers != null && <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-white/60"><Users className="h-3.5 w-3.5" /> {c.peers} creators from your college on Vigor</div>}
        <div className="mt-4 rounded-[14px] bg-white/[0.08] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-white/70">Campus ambassador</span>
            <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold", c.ambassador === "shortlisted" || c.ambassador === "active" ? "bg-flame text-night" : "bg-white/12 text-white")}>
              {(c.ambassador === "shortlisted" || c.ambassador === "active") && <Check className="h-3 w-3" strokeWidth={3} />}{status}
            </span>
          </div>
          <p className="mt-2 text-[13.5px] leading-snug text-white/85">{c.note}</p>
        </div>
        <Link href="/dashboard/briefs?f=campus" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-ice hover:underline">
          {c.campusBriefs} campus brief{c.campusBriefs === 1 ? "" : "s"} open <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- stage tracker (applications) */
export function StageTracker({ a }: { a: ApplicationVM }) {
  const at = journeyIndex(a.stage, a.payment);
  const ended = a.stage === "rejected" || a.stage === "dropped";
  const dateFor = (k: string) => {
    const map: Record<string, string[]> = { interested: ["interested"], shortlisted: ["shortlisted", "contacted", "negotiating"], confirmed: ["confirmed"], content: ["delivered"], paid: [] };
    return a.history.find((h) => map[k]?.includes(h.stage))?.at ?? null;
  };
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label="Application progress">
      {JOURNEY.map((s, i) => {
        const done = !ended && i < at, now = !ended && i === at;
        return (
          <li key={s.key} className="min-w-0" aria-current={now ? "step" : undefined}>
            <div className={clsx("h-1.5 rounded-full", done || (now && a.payment === "paid") ? "bg-cobalt" : now ? "bg-cobalt-300" : "bg-canvas-2")} />
            <div className="mt-2 flex items-center gap-1">
              {(done || (now && a.payment === "paid")) && <Check className="h-3 w-3 shrink-0 text-cobalt" strokeWidth={3} />}
              <span className={clsx("truncate text-[11.5px] font-semibold sm:text-[12px]", done ? "text-ink-2" : now ? "text-ink" : "text-faint")}>{s.label}</span>
            </div>
            <div className="truncate text-[11px] text-mute tabular-nums">{done || now ? fmtDate(s.key === "paid" && a.payment === "paid" ? a.updatedAt : dateFor(s.key)) .replace("—", now ? "Now" : "") : ""}</div>
          </li>
        );
      })}
    </ol>
  );
}
