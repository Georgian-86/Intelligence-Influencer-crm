import Link from "next/link";
import { redirect } from "next/navigation";
import { clsx } from "clsx";
import { CircleCheck, Clock, IndianRupee, ListChecks, Wallet } from "lucide-react";
import { EmptyState } from "@/components/kit";
import { BrandTile, StageChip } from "@/components/creator/bits";
import { StageTracker } from "@/components/creator/cards";
import { SubmissionBox } from "@/components/creator/submission-box";
import { getApplications, getCreator, getEarnings } from "../_lib/data";
import { relTime } from "../_lib/score";
import { withdrawInterest } from "../actions";
import type { PaymentStatus } from "../_lib/types";

const PAY: Record<PaymentStatus, { label: string; tone: string; icon: typeof Clock }> = {
  not_started: { label: "Fee agreed after confirmation", tone: "text-mute", icon: Clock },
  awaiting_delivery: { label: "Released after content goes live", tone: "text-ink-2", icon: Clock },
  invoice_due: { label: "Send your invoice to Vigor", tone: "text-warn", icon: Wallet },
  processing: { label: "Payout processing", tone: "text-info", icon: Clock },
  paid: { label: "Paid to your account", tone: "text-ok", icon: CircleCheck },
};

export default async function Applications() {
  const c = await getCreator();
  if (!c) redirect("/onboarding");
  const apps = await getApplications(c);
  const e = getEarnings(apps);
  const live = apps.filter((a) => !["rejected", "dropped"].includes(a.stage) && a.payment !== "paid");
  const done = apps.filter((a) => !live.includes(a));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] leading-tight sm:text-[26px]">Applications</h1>
          <p className="mt-1 text-[15px] text-mute">Every collab you&apos;ve raised your hand for, and exactly what happens next.</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-[12px] border border-line bg-surface px-4 py-2.5 shadow-xs"><div className="text-[12px] text-mute">Paid</div><div className="font-display text-[20px] font-bold tabular-nums">₹{e.paid.toLocaleString("en-IN")}</div></div>
          <div className="rounded-[12px] border border-line bg-surface px-4 py-2.5 shadow-xs"><div className="text-[12px] text-mute">On the way</div><div className="font-display text-[20px] font-bold tabular-nums text-ok">₹{e.pending.toLocaleString("en-IN")}</div></div>
        </div>
      </div>

      {!apps.length ? (
        <EmptyState title="No applications yet" body="Tap “I'm interested” on a brief and track it here — from shortlist to payout." icon={<ListChecks className="h-5 w-5" />} action={<Link href="/dashboard/briefs" className="btn-primary">Browse briefs</Link>} />
      ) : (
        <div className="space-y-8">
          {[{ title: "In progress", list: live }, { title: "Completed & closed", list: done }].filter((g) => g.list.length).map((g) => (
            <section key={g.title} aria-label={g.title}>
              <h2 className="mb-3 text-[13px] font-semibold text-mute">{g.title} <span className="tabular-nums text-faint">{g.list.length}</span></h2>
              <div className="space-y-4">
                {g.list.map((a) => {
                  const pay = PAY[a.payment];
                  const PayIcon = pay.icon;
                  return (
                    <article key={a.id} id={a.id} className="card scroll-mt-24 p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <BrandTile name={a.brand} hue={a.hue} size={48} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/dashboard/briefs/${a.briefId}`} className="font-display text-[18px] font-semibold tracking-[-0.02em] hover:text-cobalt-700">{a.title}</Link>
                            <StageChip stage={a.payment === "paid" ? "delivered" : a.stage} />
                          </div>
                          <div className="mt-0.5 text-[13px] text-mute">{a.brand}{a.source === "invited" ? " · Invited by Vigor" : ""} · updated <span suppressHydrationWarning>{relTime(a.updatedAt)}</span></div>
                        </div>
                        {a.fee != null && (
                          <div className="hidden text-right sm:block">
                            <div className="text-[12px] text-mute">Your fee</div>
                            <div className="font-display text-[20px] font-bold tabular-nums">₹{a.fee.toLocaleString("en-IN")}</div>
                          </div>
                        )}
                      </div>

                      <div className="mt-5"><StageTracker a={a} /></div>

                      <div className={clsx("mt-5 rounded-[14px] px-4 py-3 text-[14px]", a.stage === "confirmed" ? "bg-cobalt-50 text-cobalt-800" : "bg-canvas text-ink-2")}>
                        <span className="font-semibold">Next: </span>{a.next}
                      </div>

                      {a.work && a.work.length > 0
                        ? (a.stage === "confirmed" || a.stage === "delivered") && <div className="mt-4 space-y-3">{a.work.map((w) => <SubmissionBox key={w.id} due={w.due} what={w.title} item={w} />)}</div>
                        : a.stage === "confirmed" && <div className="mt-4"><SubmissionBox due={a.deliverableDue} what={a.deliverables} /></div>}
                      {a.payout && a.payout.status !== "pending" && (
                        <p className="mt-3 text-[12.5px] tabular-nums text-mute">Fee ₹{a.payout.amount.toLocaleString("en-IN")}{a.payout.tds ? ` − TDS ₹${a.payout.tds.toLocaleString("en-IN")}` : ""} = <span className="font-semibold text-ink">₹{a.payout.net.toLocaleString("en-IN")}</span>{a.payout.utr ? ` · UTR ${a.payout.utr}` : ""}</p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[13.5px]">
                        <span className={clsx("inline-flex items-center gap-2 font-medium", pay.tone)}>
                          <PayIcon className="h-4 w-4" />{pay.label}
                          {a.fee != null && <span className="inline-flex items-center font-display font-bold tabular-nums text-ink sm:hidden"><IndianRupee className="h-3.5 w-3.5" />{a.fee.toLocaleString("en-IN")}</span>}
                        </span>
                        {a.stage === "interested" && (
                          <form action={withdrawInterest}>
                            <input type="hidden" name="intent_id" value={a.id} />
                            <button className="btn-quiet btn-sm min-h-11 text-mute hover:text-bad">Withdraw</button>
                          </form>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
