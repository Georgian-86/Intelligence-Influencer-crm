import Link from "next/link";
import { clsx } from "clsx";
import { ArrowRight, CalendarDays, Clapperboard, Clock, MessageCircle, Plus, Timer, UserRoundCheck } from "lucide-react";
import { Avatar, AvatarStack, EmptyState, Progress, compact, km } from "@/components/kit";
import { CountUp } from "@/components/motion/reveal";
import { Bullet } from "@/components/cockpit/charts";
import { PageTitle, PhaseRail, TODAY, daysBetween, shortDate } from "@/components/brand-portal/parts";
import { requireBrand } from "@/lib/brand-access";
import { ACCOUNT_MANAGER, MILESTONES, PAST_CAMPAIGNS, PORTAL_CAMPAIGNS, REVIEWS, SHORTLISTS, SHORTLIST_TARGET, type PortalCampaign } from "@/lib/demo/portal";

export const metadata = { title: "Brand portal" };

export default async function BrandHome() {
  const brand = await requireBrand();
  if (!brand.demo) {
    return (
      <>
        <PageTitle title={`Welcome, ${brand.userName.split(" ")[0]}`} subtitle="Your campaigns with Vigor Launchpad appear here once your account manager sets them up." />
        <EmptyState title="No campaigns yet" body="Send a brief and we'll come back with a plan, creator shortlist and estimate within 24 hours."
          action={<Link href="/brand/new-brief" className="btn-primary">Send a brief</Link>} />
      </>
    );
  }

  const shortlist = SHORTLISTS.k6 ?? [];
  const oldest = Math.max(...REVIEWS.map((r) => r.submitted_hours_ago));
  const overSla = REVIEWS.filter((r) => r.submitted_hours_ago > r.sla_hours).length;
  const decisions = shortlist.length + REVIEWS.length;

  return (
    <>
      <PageTitle
        eyebrow={new Date(TODAY + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
        title={<>Hello, {brand.userName.split(" ")[0]}.</>}
        subtitle={<>{PORTAL_CAMPAIGNS.length} campaigns running. <span className="font-medium text-ink">{decisions} decisions</span> are waiting on you, and both campaigns move faster once they&apos;re done.</>}
        actions={<>
          <a href={`https://wa.me/${ACCOUNT_MANAGER.whatsapp}`} className="btn-ghost"><MessageCircle className="h-4 w-4" /> WhatsApp Kunal</a>
          <Link href="/brand/new-brief" className="btn-dark"><Plus className="h-4 w-4" /> New brief</Link>
        </>}
      />

      {/* Waiting on you */}
      <section aria-labelledby="waiting" className="mb-10">
        <h2 id="waiting" className="mb-3 text-[18px] font-semibold">Waiting on you</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Link href="/brand/campaigns/k6/shortlist" className="group relative overflow-hidden rounded-[28px] bg-night p-6 text-white shadow-lg sm:p-7">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgb(255_107_74/.35),transparent)]" aria-hidden />
            <div className="relative flex items-center gap-2 text-[13px] text-white/70"><UserRoundCheck className="h-4 w-4" /> Shortlist · Exam-Week Late-Night Slice</div>
            <div className="relative mt-4 flex items-end gap-3">
              <span className="font-display text-[56px] font-bold leading-none tracking-[-0.04em] tabular-nums"><CountUp to={shortlist.length} /></span>
              <span className="mb-1.5 text-[16px] leading-snug text-white/85">creators to approve<br />you need {SHORTLIST_TARGET}</span>
            </div>
            <div className="relative mt-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AvatarStack people={shortlist.map((c) => ({ name: c.name, hue: c.hue }))} max={5} size={30} />
                <span className="flex items-center gap-1.5 text-[13px] text-white/75"><Clock className="h-3.5 w-3.5" /> Due tomorrow, 6 pm</span>
              </div>
              <span className="btn-flame btn-lg group-hover:brightness-105">Review shortlist <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
            </div>
            <p className="relative mt-4 text-[12.5px] text-white/60">Go-live on {shortDate(PORTAL_CAMPAIGNS[1].go_live)} depends on this. Takes about 6 minutes.</p>
          </Link>

          <Link href="/brand/campaigns/k1/review" className="group card relative overflow-hidden p-6 transition-shadow hover:shadow-md sm:p-7">
            <div className="flex items-center gap-2 text-[13px] text-mute"><Clapperboard className="h-4 w-4" /> Content review · Campus Fest Takeover</div>
            <div className="mt-4 flex items-end gap-3">
              <span className="font-display text-[56px] font-bold leading-none tracking-[-0.04em] tabular-nums"><CountUp to={REVIEWS.length} /></span>
              <span className="mb-1.5 text-[16px] leading-snug text-ink-2">drafts to review<br />{REVIEWS.filter((r) => r.kind === "Reel").length} Reels, {REVIEWS.filter((r) => r.kind === "Story").length} Story</span>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium", overSla ? "bg-bad-bg text-bad" : "bg-warn-bg text-warn")}>
                <Timer className="h-3.5 w-3.5" /> {overSla ? `${overSla} past the 24h review window` : `Oldest waiting ${Math.round(oldest)}h`}
              </span>
              <span className="btn-primary btn-lg">Review content <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
            </div>
            <p className="mt-4 text-[12.5px] text-mute">Every draft has passed Vigor&apos;s QA for disclosure, audio rights and brand safety.</p>
          </Link>
        </div>
      </section>

      {/* Campaigns */}
      <section aria-labelledby="campaigns" className="mb-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="campaigns" className="text-[18px] font-semibold">Active campaigns</h2>
          <span className="text-[13px] text-mute">Updated 12 min ago from Instagram</span>
        </div>
        <div className="space-y-4">
          {PORTAL_CAMPAIGNS.map((c) => <CampaignHero key={c.id} c={c} />)}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Timeline */}
        <section aria-labelledby="timeline" className="card p-6">
          <h2 id="timeline" className="mb-5 text-[18px] font-semibold">What happens next</h2>
          <ol className="relative">
            {MILESTONES.map((m, i) => (
              <li key={i} className="relative grid grid-cols-[64px_24px_1fr] gap-x-3 pb-5 last:pb-0">
                <span className={clsx("pt-0.5 text-right text-[13px] tabular-nums", m.state === "next" ? "font-semibold text-ink" : "text-mute")}>{shortDate(m.date)}</span>
                <span className="relative flex justify-center">
                  {i < MILESTONES.length - 1 && <span className={clsx("absolute top-5 bottom-[-20px] w-px", m.state === "done" ? "bg-cobalt" : "bg-line-2")} aria-hidden />}
                  <span className={clsx("relative mt-1 grid h-3.5 w-3.5 place-items-center rounded-full",
                    m.state === "done" ? "bg-cobalt" : m.state === "next" ? "bg-flame ring-4 ring-flame-100" : "border-2 border-line-2 bg-surface")} aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className={clsx("text-[14px]", m.state === "upcoming" ? "text-ink-2" : "font-medium text-ink")}>
                    {m.label}
                    {m.state === "next" && <span className="ml-2 rounded-full bg-flame-50 px-2 py-0.5 text-[11px] font-semibold text-flame-700">Your move</span>}
                  </div>
                  <div className="text-[12.5px] text-mute">{m.campaign}{m.detail && <> · {m.detail}</>}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-6">
          <section className="card p-6" aria-labelledby="team">
            <h2 id="team" className="text-[16px] font-semibold">Your Vigor team</h2>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={ACCOUNT_MANAGER.name} hue={ACCOUNT_MANAGER.hue} size={44} />
              <div className="min-w-0">
                <div className="font-semibold">{ACCOUNT_MANAGER.name}</div>
                <div className="text-[12.5px] text-mute">{ACCOUNT_MANAGER.role}</div>
              </div>
            </div>
            <a href={`https://wa.me/${ACCOUNT_MANAGER.whatsapp}`} className="btn-ghost mt-4 w-full"><MessageCircle className="h-4 w-4" /> Message on WhatsApp</a>
            <p className="mt-2 text-center text-[12px] text-mute">{ACCOUNT_MANAGER.replies}</p>
          </section>
          <section className="card p-6" aria-labelledby="past">
            <h2 id="past" className="text-[16px] font-semibold">Past campaigns</h2>
            <ul className="mt-3 divide-y divide-line">
              {PAST_CAMPAIGNS.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="text-[14px] font-medium">{p.name}</div>
                  <div className="mt-0.5 text-[12.5px] tabular-nums text-mute">{km(p.reach)} reach · {p.er}% ER · {p.creators} creators · ended {shortDate(p.end_date)}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

function CampaignHero({ c }: { c: PortalCampaign }) {
  const isLive = c.phase === "live" || c.phase === "report";
  const daysLeft = daysBetween(TODAY, c.end_date);
  const toLive = daysBetween(TODAY, c.go_live);
  const spendPct = (c.spent / c.budget) * 100;
  return (
    <article className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="border-b border-line p-6 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[12.5px] text-mute">
                {isLive
                  ? <span className="inline-flex items-center gap-1.5 font-semibold text-ok"><span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-ping rounded-full bg-ok/60" /><span className="relative h-2 w-2 rounded-full bg-ok" /></span>Live</span>
                  : <span className="inline-flex items-center gap-1.5 font-semibold text-cobalt-700"><CalendarDays className="h-3.5 w-3.5" />Goes live in {toLive} days</span>}
                <span aria-hidden>·</span><span className="tabular-nums">{shortDate(c.start_date)} – {shortDate(c.end_date)}</span>
              </div>
              <h3 className="mt-2 text-[24px] font-bold leading-tight tracking-[-0.03em]">{c.name}</h3>
              <p className="mt-1 text-[13.5px] text-mute">{c.cities.join(", ")} · {c.colleges} campuses · {daysLeft} days left</p>
            </div>
            <Link href={isLive ? `/brand/reports/${c.id}` : `/brand/campaigns/${c.id}/shortlist`} className="btn-ghost btn-sm shrink-0">{isLive ? "Live report" : "Shortlist"}<ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <PhaseRail phase={c.phase} className="mt-6" />
          <dl className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-[12.5px] text-mute">Creators confirmed</dt>
              <dd className="mt-1 font-display text-[22px] font-bold tabular-nums">{c.creators_confirmed}<span className="text-[15px] font-semibold text-faint"> / {c.creators_target}</span></dd>
              <Progress value={(c.creators_confirmed / c.creators_target) * 100} className="mt-2" label="Creators confirmed" />
            </div>
            <div>
              <dt className="text-[12.5px] text-mute">Content live</dt>
              <dd className="mt-1 font-display text-[22px] font-bold tabular-nums">{c.deliverables_live}<span className="text-[15px] font-semibold text-faint"> / {c.deliverables_total}</span></dd>
              <Progress value={(c.deliverables_live / c.deliverables_total) * 100} className="mt-2" label="Content live" />
            </div>
          </dl>
        </div>

        <div className="p-6">
          {isLive ? (
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <Kpi label="Reach" value={<CountUp to={c.reach / 1_000_000} decimals={2} suffix="M" />}>
                <Bullet label="Reach" value={c.reach} target={c.targets.reach} format="km" />
              </Kpi>
              <Kpi label="Views" value={<CountUp to={c.views / 1_000_000} decimals={1} suffix="M" />}>
                <Bullet label="Views" value={c.views} target={c.targets.views} format="km" />
              </Kpi>
              <Kpi label="Engagement rate" value={<CountUp to={c.er} decimals={1} suffix="%" />}>
                <Bullet label="Engagement rate" value={c.er} target={c.targets.er} max={8} format="pct" targetLabel="Target" />
              </Kpi>
              <Kpi label="Spend" value={<span>₹{compact(c.spent)}</span>}>
                <SpendBar spent={c.spent} budget={c.budget} pct={spendPct} />
              </Kpi>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <Kpi label="Projected reach" value={km(c.targets.reach)} hint="Based on the 24 creators in plan" />
                <Kpi label="Projected views" value={km(c.targets.views)} hint={`Target ER ${c.targets.er}%`} />
              </div>
              <div className="mt-6">
                <Kpi label="Spend" value={`₹${compact(c.spent)}`}><SpendBar spent={c.spent} budget={c.budget} pct={spendPct} /></Kpi>
              </div>
              <div className="mt-auto pt-6">
                <div className="flex items-center gap-3 rounded-[16px] bg-flame-50 px-4 py-3 text-[13.5px] text-ink-2">
                  <UserRoundCheck className="h-4 w-4 shrink-0 text-flame-700" />
                  <span className="min-w-0 flex-1">Approve <b className="text-ink">{c.shortlist_pending} shortlisted creators</b> to lock contracts for go-live.</span>
                  <Link href={`/brand/campaigns/${c.id}/shortlist`} className="font-semibold text-flame-700 hover:underline">Start</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Kpi({ label, value, hint, children }: { label: string; value: React.ReactNode; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[12.5px] text-mute">{label}</div>
      <div className="mt-1 mb-2.5 font-display text-[28px] font-bold leading-none tracking-[-0.035em] tabular-nums">{value}</div>
      {hint && <div className="text-[12.5px] text-mute">{hint}</div>}
      {children}
    </div>
  );
}

function SpendBar({ spent, budget, pct }: { spent: number; budget: number; pct: number }) {
  return (
    <div>
      <Progress value={pct} label="Budget spent" className="h-3" tone={pct > 95 ? "warn" : "cobalt"} />
      <div className="mt-1.5 flex justify-between text-[12px] tabular-nums text-mute">
        <span className="font-medium text-ink-2">{Math.round(pct)}% of budget</span>
        <span>₹{compact(budget - spent)} left of ₹{compact(budget)}</span>
      </div>
    </div>
  );
}
