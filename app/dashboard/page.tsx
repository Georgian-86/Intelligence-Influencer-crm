import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Hourglass, PartyPopper, Sparkles } from "lucide-react";
import { EmptyState, PageIntro, Progress } from "@/components/kit";
import { MatchCard } from "@/components/creator/match-card";
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
    <div className="space-y-8">
      {sp.welcome && (
        <div role="status" className="flex items-center gap-3 rounded-[12px] border border-cobalt-100 bg-cobalt-50 px-4 py-3 text-[14px] text-cobalt-800">
          <PartyPopper className="h-5 w-5 shrink-0" />
          <span><span className="font-semibold">You&apos;re in.</span> {approved ? "Your matches are below — tap “I'm interested” on any that fit." : "The Vigor team reviews new profiles within 24 hours. We'll WhatsApp you when you're approved."}</span>
        </div>
      )}

      <PageIntro
        eyebrow={`${greeting()}, ${c.firstName}`}
        title={approved ? (fresh ? `${fresh} new brief${fresh === 1 ? "" : "s"} match your profile` : "You're all caught up") : "Your profile is in review"}
        sub={approved
          ? fresh ? (apps.some((a) => a.stage === "confirmed") ? "You also have a draft due soon." : "Tap “I'm interested” on any that fit.") : "New briefs drop every week. We'll WhatsApp you when one fits."
          : "Matches unlock once the Vigor team approves you, usually within 24 hours."}
        actions={approved
          ? <Link href="/dashboard/briefs" className="btn-primary">See all briefs <ArrowRight className="h-4 w-4" /></Link>
          : <span className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-warn-bg px-3.5 text-[13.5px] font-medium text-warn"><Hourglass className="h-4 w-4" /> In review</span>}
      />

      {strength.next && (
        <Link href={strength.next.href} className="group flex items-center gap-4 rounded-[14px] border border-line bg-surface px-4 py-3 transition-colors hover:border-line-2">
          <div className="hidden w-28 shrink-0 sm:block">
            <div className="flex items-baseline justify-between text-[12px] text-mute"><span>Profile</span><span className="font-semibold text-ink tabular-nums">{strength.score}%</span></div>
            <Progress value={strength.score} className="mt-1.5" label="Profile strength" />
          </div>
          <span className="min-w-0 flex-1 text-[14px]">
            <span className="font-semibold">{strength.next.label}</span>
            <span className="text-mute"> · {strength.next.why}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[13.5px] font-medium text-cobalt">Finish <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>
      )}

      <section aria-labelledby="matched-h">
        <SectionHead title={<span id="matched-h">Matched for you</span>} href="/dashboard/briefs" cta="All briefs" />
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

      <section className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div aria-labelledby="pipe-h" className="card p-5">
          <SectionHead title={<span id="pipe-h">Your collabs</span>} href="/dashboard/applications" cta="All applications" className="-mt-1.5" />
          <div>
            {active.length ? <PipelineTimeline apps={active} /> : (
              <EmptyState title="Nothing in motion yet" body="Tap “I'm interested” on a brief and it shows up here with every next step." action={<Link href="/dashboard/briefs" className="btn-primary">Browse briefs</Link>} />
            )}
          </div>
        </div>
        <div className="space-y-4">
          <EarningsCard e={getEarnings(apps)} />
          <CampusCard c={getCampus(c, briefs)} />
        </div>
      </section>
    </div>
  );
}
