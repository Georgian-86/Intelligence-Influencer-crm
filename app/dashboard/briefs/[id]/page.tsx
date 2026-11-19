import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { clsx } from "clsx";
import { ArrowLeft, CalendarDays, Check, CircleCheck, ListChecks, MapPin, Users, X } from "lucide-react";
import { BrandTile, Deadline, MatchBadge, StageChip, payout } from "@/components/creator/bits";
import { InterestButton } from "@/components/creator/interest-button";
import { getBrief, getCreator } from "../../_lib/data";
import { fmtDate } from "../../_lib/score";
import { expressInterest } from "../../actions";

export default async function BriefDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const c = await getCreator();
  if (!c) redirect("/onboarding");
  const b = await getBrief(id, c);
  if (!b) notFound();
  const deliverables = (b.deliverables ?? "").split(/\s\+\s|\n|,\s(?=\d)/).map((s) => s.trim()).filter(Boolean);
  const timeline = [
    { label: "Apply by", date: b.applyBy, note: "Tap “I'm interested” — no pitch needed" },
    { label: "Shortlist", date: null, note: "Brand picks from Vigor's shortlist within 48h" },
    ...(b.eventDate ? [{ label: "Shoot / event day", date: b.eventDate, note: b.talentKind === "influencer" ? "Create and submit your draft" : "Show up, check in on WhatsApp" }] : [{ label: "Draft due", date: null, note: "Usually 5 days after confirmation" }]),
    { label: "Payout", date: null, note: "Within 30 days of content going live" },
  ];
  const open = b.status === "open";
  const canApply = open && b.eligible && !b.applied;

  return (
    <div className="pb-28 lg:pb-0">
      <Link href="/dashboard/briefs" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[14px] font-medium text-mute hover:text-ink"><ArrowLeft className="h-4 w-4" /> All briefs</Link>

      <header className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-start">
        <BrandTile name={b.brand} hue={b.hue} size={64} className="rounded-[20px]" />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-medium text-mute">{b.brand}</div>
          <h1 className="mt-1 font-display text-[32px] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[42px]">{b.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {b.eligible ? <MatchBadge value={b.match} /> : <span className="inline-flex h-7 items-center rounded-full bg-canvas-2 px-2.5 text-[12.5px] font-semibold text-mute">Not a fit yet</span>}
            {open ? <Deadline date={b.applyBy} label="to apply" /> : <span className="chip h-7">Closed</span>}
            {b.applied && <StageChip stage={b.applied} />}
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-canvas-2 px-2.5 text-[12px] font-semibold text-ink-2"><MapPin className="h-3.5 w-3.5" />{b.cities.length ? b.cities.join(", ") : "Any city"}</span>
            {b.slots && <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-canvas-2 px-2.5 text-[12px] font-semibold text-ink-2"><Users className="h-3.5 w-3.5" />{b.slots} spots</span>}
          </div>
        </div>
      </header>

      {sp.sent && <p role="status" className="mt-6 rounded-[14px] bg-ok-bg px-4 py-3 text-[14px] font-medium text-ok">Interest sent. Vigor will WhatsApp you if you&apos;re shortlisted.</p>}
      {sp.error && <p role="alert" className="mt-6 rounded-[14px] bg-bad-bg px-4 py-3 text-[14px] font-medium text-bad">{sp.error}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em]">The brief</h2>
            <p className="mt-2 max-w-[68ch] whitespace-pre-line text-[15.5px] leading-relaxed text-ink-2">{b.description}</p>
            {b.reasons.length > 0 && b.eligible && (
              <div className="mt-5 rounded-[16px] bg-cobalt-50 p-4">
                <div className="text-[13px] font-semibold text-cobalt-700">Why you&apos;re a match</div>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {b.reasons.map((r) => <li key={r} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[13px] font-medium text-ink"><Check className="h-3.5 w-3.5 text-cobalt" strokeWidth={2.6} />{r}</li>)}
                </ul>
              </div>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-[18px] font-semibold tracking-[-0.02em]"><ListChecks className="h-5 w-5 text-mute" /> Deliverables</h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {deliverables.map((d) => (
                <li key={d} className="flex items-start gap-3 rounded-[14px] border border-line bg-canvas/50 p-3.5 text-[14.5px] font-medium">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface text-cobalt shadow-xs"><CircleCheck className="h-4 w-4" /></span>{d}
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-[18px] font-semibold tracking-[-0.02em]"><CalendarDays className="h-5 w-5 text-mute" /> Timeline</h2>
            <ol className="mt-4">
              {timeline.map((t, i) => (
                <li key={t.label} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < timeline.length - 1 && <span aria-hidden className="absolute left-[11px] top-7 bottom-0 w-px bg-line" />}
                  <span className={clsx("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 font-display text-[11px] font-bold", i === 0 ? "border-cobalt bg-cobalt text-white" : "border-line-2 bg-surface text-mute")}>{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold">{t.label}</span>
                      {t.date && <span className="text-[13px] font-semibold tabular-nums text-ink-2">{fmtDate(t.date)}</span>}
                    </div>
                    <p className="text-[13.5px] text-mute">{t.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em]">Eligibility</h2>
            <p className="mt-0.5 text-[13.5px] text-mute">Checked against your profile.</p>
            <ul className="mt-4 space-y-2">
              {b.checks.map((x) => (
                <li key={x.label} className="flex items-center gap-3 text-[14.5px]">
                  <span className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full", x.ok ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad")}>
                    {x.ok ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className={x.ok ? "" : "text-ink-2"}>{x.label}</span>
                  <span className="sr-only">{x.ok ? "met" : "not met"}</span>
                </li>
              ))}
              {!b.checks.length && <li className="text-[14.5px] text-ink-2">Open to everyone on Vigor.</li>}
            </ul>
            {!b.eligible && <Link href="/dashboard/profile" className="btn-ghost mt-5">Update my profile</Link>}
          </section>
        </div>

        {/* apply: sticky card on desktop, bar above the tab bar on mobile */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="fixed inset-x-3 bottom-[84px] z-30 rounded-[22px] border border-line bg-surface/95 p-3 shadow-lg backdrop-blur-xl lg:static lg:rounded-[20px] lg:p-5 lg:shadow-sm">
            <div className="flex items-center justify-between gap-3 lg:block">
              <div>
                <div className="text-[12px] text-mute lg:text-[13px]">Payout</div>
                <div className="font-display text-[20px] font-bold tracking-[-0.03em] tabular-nums lg:text-[30px]">{payout(b.budgetMin, b.budgetMax)}</div>
                <div className="hidden text-[13px] text-mute lg:block">Final fee agreed with Vigor after shortlisting.</div>
              </div>
              <div className="shrink-0 lg:mt-5">
                {canApply ? <InterestButton briefId={b.id} applied={false} size="lg" block /> :
                  b.applied ? <Link href="/dashboard/applications" className="btn-ghost btn-lg w-full">Track application</Link> :
                  <span className="inline-flex h-13 items-center rounded-full bg-canvas-2 px-5 text-[14px] font-semibold text-mute">{open ? "Not eligible" : "Closed"}</span>}
              </div>
            </div>
            {canApply && (
              <details className="group mt-4 hidden border-t border-line pt-3 lg:block">
                <summary className="flex min-h-11 cursor-pointer list-none items-center text-[13.5px] font-semibold text-ink-2 hover:text-ink">Add a note or quote a fee (optional)</summary>
                <form action={expressInterest} className="mt-2 space-y-3">
                  <input type="hidden" name="brief_id" value={b.id} />
                  <textarea name="message" rows={3} className="textarea text-[14px]" placeholder="Relevant past work, your idea, availability…" aria-label="Note to the Vigor team" />
                  <input name="quoted_rate" inputMode="numeric" className="input" placeholder={c.ratePerPost ? `Your usual rate: ₹${c.ratePerPost.toLocaleString("en-IN")}` : "Your fee in ₹"} aria-label="Your fee in rupees" />
                  <button className="btn-dark w-full">Send with note</button>
                </form>
              </details>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
