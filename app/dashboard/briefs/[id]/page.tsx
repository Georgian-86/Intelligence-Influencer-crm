import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { clsx } from "clsx";
import { ArrowLeft, CalendarDays, Check, CircleSlash, Clock, MapPin, Wallet } from "lucide-react";
import { fmtNum } from "@/components/ui";
import { Banner } from "@/components/talent/bits";
import { BrandTile } from "@/components/talent/brief-card";
import { InterestButton } from "@/components/talent/interest-button";
import { PipelineTracker } from "@/components/talent/pipeline-tracker";
import { StageChip } from "@/components/talent/application-card";
import { deadlineLabel, deliverableItems, fmtDate, payLabel, stageMeta, isClosed } from "@/components/talent/model";
import { createClient } from "@/lib/supabase/server";
import { getMyTalent } from "@/lib/session";
import { mismatches } from "@/lib/match";

function Fact({ icon: Icon, label, value, tone }: { icon: typeof Wallet; label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/40 px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-mute"><Icon className="h-3.5 w-3.5" aria-hidden />{label}</dt>
      <dd className={clsx("mt-0.5 text-sm font-semibold text-fog", tone)}>{value}</dd>
    </div>
  );
}

export default async function TalentBrief({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const talent = await getMyTalent();
  if (!talent) redirect("/onboarding");
  const supabase = await createClient();
  const { data: b } = await supabase.from("briefs").select("*").eq("id", id).maybeSingle();
  if (!b) notFound();
  const [{ data: ig }, { data: intent }] = await Promise.all([
    supabase.from("social_accounts").select("followers, engagement_rate").eq("talent_id", talent.id).maybeSingle(),
    supabase.from("intents").select("id, stage").eq("talent_id", talent.id).eq("brief_id", id).maybeSingle(),
  ]);
  const miss = mismatches(b, { ...talent, ...(ig ?? {}) });
  const brand = b.brand_display || "Confidential brand";
  const deadline = deadlineLabel(b.apply_by);
  const items = deliverableItems(b.deliverables, 20);
  const closedForApply = deadline?.text === "Applications closed";
  const reqs = [
    b.talent_kind === "influencer" ? "Influencers" : b.talent_kind === "event" ? "Event talent" : null,
    b.categories?.length ? b.categories.join(", ") : null,
    b.min_followers || b.max_followers ? `${fmtNum(b.min_followers)} – ${fmtNum(b.max_followers)} followers` : null,
    b.min_engagement ? `${b.min_engagement}%+ engagement` : null,
    b.ranks?.length ? `Rank: ${b.ranks.join(", ")}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/dashboard/briefs" className="btn-quiet -ml-3 mb-3 min-h-11 px-3 text-sm"><ArrowLeft className="h-4 w-4" aria-hidden />All briefs</Link>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <article className="card p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <BrandTile name={brand} className="h-14 w-14 rounded-2xl text-xl" />
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-2">{brand}</div>
              <h1 className="mt-1 text-balance text-2xl font-extrabold leading-tight tracking-[-0.02em] text-fog sm:text-3xl">{b.title}</h1>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Fact icon={Wallet} label="Pay" value={payLabel(b)} />
            <Fact icon={MapPin} label="City" value={b.cities.length ? b.cities.join(", ") : "Any city"} />
            <Fact icon={CalendarDays} label="Date" value={b.event_date ? fmtDate(b.event_date, { day: "numeric", month: "short", year: "numeric" }) : "Flexible"} />
            <Fact icon={Clock} label="Apply by" value={b.apply_by ? (deadline?.urgent ? deadline.text : fmtDate(b.apply_by, { day: "numeric", month: "short" })) : "Rolling"} tone={deadline?.urgent ? "text-warn" : undefined} />
          </dl>

          {b.description && (
            <section className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-mute">About the campaign</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-fog/90">{b.description}</p>
            </section>
          )}

          {items.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-mute">Deliverables</h2>
              <ul className="mt-2 space-y-2">
                {items.map((d) => (
                  <li key={d} className="flex items-start gap-2.5 text-[15px] text-fog/90">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand/15 text-brand-2"><Check className="h-3 w-3" strokeWidth={3} aria-hidden /></span>
                    {d}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {reqs.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-mute">Looking for</h2>
              <ul className="mt-2 flex flex-wrap gap-1.5">{reqs.map((r) => <li key={r} className="chip bg-ink-3/60">{r}</li>)}</ul>
            </section>
          )}
        </article>

        <aside className="space-y-4 lg:sticky lg:top-10" aria-label="Your application">
          {sp.sent && <Banner kind="ok">Interest sent! The Vigor team will reach out if you&apos;re shortlisted.</Banner>}
          {sp.error && <Banner kind="error">{sp.error}</Banner>}

          {intent ? (
            <div className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-fog">Your application</h2>
                <StageChip stage={intent.stage} />
              </div>
              <PipelineTracker stage={intent.stage} className="mt-5" />
              {!isClosed(intent.stage) && <p className="mt-4 text-sm text-mute">{stageMeta(intent.stage).next}</p>}
              <Link href="/dashboard/applications" className="btn-ghost mt-4 min-h-11 w-full">Track all applications</Link>
            </div>
          ) : miss.length > 0 ? (
            <div className="card p-5">
              <div className="flex items-center gap-2 font-bold text-fog"><CircleSlash className="h-4 w-4 text-mute" aria-hidden />Not a match yet</div>
              <p className="mt-1 text-sm text-mute">This brief needs:</p>
              <ul className="mt-2 space-y-1 text-sm text-fog/90">{miss.map((m) => <li key={m}>· {m}</li>)}</ul>
              <Link href="/dashboard/profile" className="btn-ghost mt-4 min-h-11 w-full">Update profile</Link>
            </div>
          ) : closedForApply ? (
            <div className="card p-5 text-sm text-mute">Applications for this brief have closed. <Link href="/dashboard/briefs" className="text-brand-2 hover:underline">See other open briefs</Link>.</div>
          ) : (
            <div className="card p-5">
              <h2 className="font-bold text-fog">Fits you? Raise your hand.</h2>
              <p className="mt-1 text-sm text-mute">One tap is enough — the Vigor team shortlists and contacts you. You&apos;ll see every status change.</p>
              <InterestButton briefId={b.id} size="lg" withDetails className="mt-4" />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
