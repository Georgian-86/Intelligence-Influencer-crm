import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Hourglass, PartyPopper, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/kit";
import { StrengthRing } from "@/components/creator/strength-ring";
import { MatchCard } from "@/components/creator/match-card";
import { StatsSync } from "@/components/creator/stats-sync";
import { CampusCard, EarningsCard, PipelineTimeline } from "@/components/creator/cards";
import { SectionHead } from "@/components/creator/bits";
import { getApplications, getBriefs, getCampus, getCreator, getEarnings } from "./_lib/data";
import { profileStrength } from "./_lib/score";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function CreatorHome({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const sp = await searchParams;
  const c = await getCreator();
  if (!c) redirect("/onboarding");
  const [briefs, apps] = await Promise.all([getBriefs(c), getApplications(c)]);
  const strength = profileStrength(c);
  const approved = c.status === "approved";
  const matched = briefs.filter((b) => b.eligible && b.status === "open").sort((a, b) => Number(!!a.applied) - Number(!!b.applied) || b.match - a.match).slice(0, 3);
  const fresh = briefs.filter((b) => b.eligible && b.status === "open" && !b.applied).length;
  const active = apps.filter((a) => !["rejected", "dropped"].includes(a.stage)).slice(0, 4);

  return (
    <div className="space-y-10">
      {sp.welcome && (
        <div role="status" className="flex items-center gap-3 rounded-[20px] border border-cobalt-100 bg-cobalt-50 px-4 py-3.5 text-[14px] text-cobalt-800">
          <PartyPopper className="h-5 w-5 shrink-0" />
          <span><span className="font-semibold">You&apos;re in.</span> {approved ? "Your matches are below — tap “I'm interested” on any that fit." : "The Vigor team reviews new profiles within 24 hours. We'll WhatsApp you when you're approved."}</span>
        </div>
      )}

      {/* hero */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="card relative overflow-hidden p-6 sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgb(43_75_255/.12),transparent)]" />
          <p className="text-[14px] font-medium text-mute">{greeting()},</p>
          <h1 className="mt-1 font-display text-[40px] font-bold leading-[1.02] tracking-[-0.045em] sm:text-[52px]">{c.firstName}.</h1>
          <p className="mt-3 max-w-[46ch] text-[16px] leading-relaxed text-ink-2">
            {approved
              ? fresh ? <>You have <span className="font-semibold text-ink">{fresh} new brief{fresh === 1 ? "" : "s"}</span> that match your profile{apps.some((a) => a.stage === "confirmed") ? ", and a draft due soon" : ""}.</> : "You're all caught up. New briefs drop every week."
              : "Your profile is being reviewed by the Vigor team. Matches unlock once you're approved — usually within 24 hours."}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {approved ? (
              <Link href="/dashboard/briefs" className="btn-primary btn-lg">See my matches <ArrowRight className="h-4 w-4" /></Link>
            ) : (
              <span className="inline-flex h-13 items-center gap-2 rounded-full bg-warn-bg px-5 text-[14px] font-semibold text-warn"><Hourglass className="h-4 w-4" /> In review</span>
            )}
            <Link href="/dashboard/profile" className="btn-ghost btn-lg">View my profile</Link>
          </div>
        </div>

        <div className="card flex flex-col p-6">
          <div className="flex items-center gap-5">
            <StrengthRing value={strength.score} />
            <div className="min-w-0">
              <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em]">Profile strength</h2>
              <p className="mt-1 text-[13.5px] leading-snug text-mute">Stronger profiles get shortlisted first.</p>
            </div>
          </div>
          {strength.next ? (
            <Link href={strength.next.href} className="group mt-auto flex items-center gap-3 rounded-[16px] border border-line bg-canvas/70 p-3.5 pt-3.5 transition-colors hover:border-cobalt/40 hover:bg-cobalt-50/60 max-lg:mt-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cobalt text-white"><Sparkles className="h-4.5 w-4.5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11.5px] font-semibold text-cobalt-700">Next best step</span>
                <span className="block text-[14.5px] font-semibold">{strength.next.label}</span>
                <span className="block text-[12.5px] text-mute">{strength.next.why}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-mute transition-transform group-hover:translate-x-0.5 group-hover:text-cobalt" />
            </Link>
          ) : <p className="mt-auto rounded-[14px] bg-ok-bg px-3.5 py-3 text-[13.5px] font-medium text-ok">Your profile is complete.</p>}
        </div>
      </section>

      {/* matched */}
      <section aria-labelledby="matched-h">
        <SectionHead title={<span id="matched-h">Matched for you</span>} sub="Picked on your niche, city, numbers and campus." href="/dashboard/briefs" cta="All briefs" />
        {!approved ? (
          <EmptyState title="Matches unlock after approval" body="We check every new profile by hand so brands trust the network. Meanwhile, add your rates — it speeds up approval." action={<Link href="/dashboard/profile#rates" className="btn-ghost">Add my rates</Link>} icon={<Hourglass className="h-5 w-5" />} />
        ) : matched.length ? (
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-3">
            {matched.map((b) => <MatchCard key={b.id} b={b} className="w-[85%] shrink-0 snap-start sm:w-auto" />)}
          </div>
        ) : (
          <EmptyState title="No matches right now" body="New campus and city briefs drop every week. We'll WhatsApp you the moment one fits." icon={<Sparkles className="h-5 w-5" />} />
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="card p-5 sm:p-6" aria-labelledby="pipe-h">
          <SectionHead title={<span id="pipe-h">Your pipeline</span>} sub="Where every collab stands, and what to do next." href="/dashboard/applications" cta="Details" />
          {active.length ? <PipelineTimeline apps={active} /> : (
            <EmptyState title="Nothing in motion yet" body="Tap “I'm interested” on a brief and it shows up here with every next step." action={<Link href="/dashboard/briefs" className="btn-primary">Browse briefs</Link>} />
          )}
        </div>
        <div className="space-y-6">
          <EarningsCard e={getEarnings(apps)} />
          <CampusCard c={getCampus(c, briefs)} />
        </div>
      </section>

      <section aria-labelledby="stats-h">
        <SectionHead title={<span id="stats-h">Your numbers</span>} sub="What brands see when Vigor shortlists you." />
        <StatsSync followers={c.followers} er={c.er} avgViews={c.avgViews} series={c.series} lastSyncedAt={c.lastSyncedAt} accountId={c.igAccountId} fetchStatus={c.fetchStatus} fetchError={c.fetchError} />
      </section>
    </div>
  );
}
