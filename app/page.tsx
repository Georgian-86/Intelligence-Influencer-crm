import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight, ChevronDown, Check, GraduationCap, Gauge, Link2, ShieldCheck, TrendingUp, Users, Workflow, X,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { WhatsAppIcon } from "@/components/brand/icons";
import { CountUp, Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { HeroOrbit } from "@/components/landing/hero-orbit";
import { AudienceTabs } from "@/components/landing/audience-tabs";
import { CollegeGraph } from "@/components/landing/college-graph";
import { CampaignTimeline } from "@/components/landing/campaign-timeline";
import { SectionHeading } from "@/components/landing/section-heading";
import { Marquee } from "@/components/landing/marquee";
import { FACTS, FAQS, TRUST_ITEMS } from "@/components/landing/data";
import { CITIES } from "@/lib/constants";
import { SITE } from "@/lib/site";

type Feature = { icon: LucideIcon | ((p: { className?: string }) => ReactNode); title: string; desc: string };

const FEATURES: Feature[] = [
  { icon: GraduationCap, title: "The college graph", desc: "Every profile mapped by city, campus, course and graduation year." },
  { icon: Users, title: "Creators and crew, one pool", desc: "Influencers and on-ground talent in one place — staff a brief with both." },
  { icon: Gauge, title: "Auto-fetched metrics", desc: "Followers and engagement pulled from Instagram and refreshed over time." },
  { icon: WhatsAppIcon, title: "WhatsApp-native", desc: "Briefs, nudges and status updates land where talent already lives." },
  { icon: Link2, title: "Review links for brands", desc: "Approve talent and content from a phone. No login, no PDF decks." },
  { icon: TrendingUp, title: "Live post tracking", desc: "Views and engagement captured at 24 hours, 72 hours and 7 days." },
  { icon: ShieldCheck, title: "Ranks and reliability", desc: "Bronze to Platinum ranks, ratings and attendance you can trust." },
  { icon: Workflow, title: "Run end to end", desc: "Vigor's team handles outreach, negotiation, approvals and reporting." },
];

const COMPARE: { them: string; us: string }[] = [
  { them: "Stops at a phone number", us: "Brief to report in one flow" },
  { them: "Influencers only", us: "Creators and event talent together" },
  { them: "Self-declared, stale stats", us: "Auto-fetched metrics, tracked over time" },
  { them: "Approvals buried in email", us: "Phone-friendly review links" },
  { them: "No idea who studies where", us: "College × city × graduation year" },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/icon.svg`,
    description: SITE.description,
    areaServed: CITIES.map((c) => ({ "@type": "City", name: c })),
    parentOrganization: { "@type": "Organization", name: "Vigor Launchpad" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  },
];

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SiteHeader />
      <main id="main" className="overflow-x-clip">
        {/* ---------------- Hero ---------------- */}
        <section className="relative -mt-16 pt-16" aria-labelledby="hero-title">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_106_26/0.22),transparent)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,#000,transparent)]" />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-8 lg:pb-20 lg:pt-20">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/[0.08] px-3 py-1 text-xs font-medium text-brand-3">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                  </span>
                  Now onboarding talent in {CITIES.length} cities
                </span>
              </Reveal>
              <Reveal delay={0.05}>
                <h1 id="hero-title" className="mt-6 text-balance text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.035em] text-fog sm:text-6xl lg:text-[3.8rem]">
                  Where India&apos;s <span className="text-gradient">next-gen creators</span> meet the brands that matter.
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-mute">
                  One network for college creators, influencers and on-ground event talent — matched to live
                  brand campaigns, approved by brands and tracked automatically. Built by Vigor Launchpad.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/join" className="btn-primary group min-h-12 px-6 text-base">
                    Join as talent
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                  <Link href="/brands" className="btn-ghost min-h-12 px-6 text-base">Hire talent</Link>
                </div>
                <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-mute">
                  {["Register once", "Get matched to briefs", "Updates on WhatsApp"].map((t) => (
                    <li key={t} className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-ok" aria-hidden="true" /> {t}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <div className="mx-auto w-full max-w-[440px] sm:max-w-[540px] lg:max-w-none">
              <HeroOrbit />
            </div>
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pb-6 sm:px-6">
            <p className="mb-4 text-center text-xs font-medium uppercase tracking-[0.18em] text-mute">Built for campuses across India</p>
            <Marquee items={TRUST_ITEMS} />
          </div>
        </section>

        {/* ---------------- Facts ---------------- */}
        <section aria-label="The network at a glance" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <dl className="grid grid-cols-2 overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4 [&>div]:bg-ink-2" style={{ gap: 1 }}>
            {FACTS.map((f) => (
              <div key={f.label} className="px-5 py-6 sm:px-7 sm:py-8">
                <dt className="text-sm text-mute">{f.label}</dt>
                <dd className="mt-1 font-display text-4xl font-bold tabular-nums text-fog sm:text-5xl">
                  <CountUp to={f.value} />
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------------- Audiences ---------------- */}
        <section id="audiences" className="scroll-mt-20 py-16 sm:py-24" aria-labelledby="audiences-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading id="audiences-title" eyebrow="Three ways in" title="One network. Built for everyone on the brief.">
              Creators get relevant briefs, event talent gets steady gigs, and brands get a shortlist they can approve in minutes.
            </SectionHeading>
            <div className="mt-12">
              <AudienceTabs />
            </div>
          </div>
        </section>

        {/* ---------------- College graph ---------------- */}
        <section id="campuses" className="relative scroll-mt-20 border-y border-line bg-ink-2/40 py-16 sm:py-24" aria-labelledby="campuses-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading id="campuses-title" eyebrow="The college graph" title={<>Cities → campuses → <span className="text-gradient">the right creators</span>.</>}>
              Every profile carries its city, campus type and graduation year, so &ldquo;food creators at Pune campuses,
              graduating 2027–28&rdquo; is a filter — not a three-week scouting sprint.
            </SectionHeading>
            <div className="mt-14">
              <CollegeGraph />
            </div>
          </div>
        </section>

        {/* ---------------- How a campaign runs ---------------- */}
        <section id="how" className="scroll-mt-20 py-16 sm:py-24" aria-labelledby="how-title">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionHeading id="how-title" align="left" eyebrow="How a campaign runs" title="From brief to report, without the WhatsApp chaos.">
                Six steps, one system. Brands see progress, talent sees status, and Vigor&apos;s team runs execution end to end.
              </SectionHeading>
              <Reveal delay={0.1}>
                <Link href="/brands" className="btn-ghost group mt-8 min-h-12 px-5">
                  Start a campaign
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </Reveal>
            </div>
            <CampaignTimeline />
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section className="border-t border-line py-16 sm:py-24" aria-labelledby="features-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading id="features-title" eyebrow="Why Vigor" title="Not another influencer directory.">
              Directories hand you a phone number. Vigor Talent Network runs the whole campaign — with the data to back every pick.
            </SectionHeading>

            <Stagger className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <StaggerItem key={f.title} className="h-full">
                    <div className="card card-hover group relative flex h-full gap-4 overflow-hidden p-5 sm:block sm:p-6">
                      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/20 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line-2 bg-ink-3 text-brand-2">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="relative">
                        <h3 className="text-base font-semibold text-fog sm:mt-5">{f.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-mute sm:mt-2">{f.desc}</p>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>

            <Reveal className="mt-6">
              <div className="card overflow-hidden">
                <div className="grid grid-cols-2 border-b border-line text-xs font-semibold uppercase tracking-[0.14em]">
                  <div className="px-5 py-4 text-mute sm:px-7">Directory apps</div>
                  <div className="border-l border-line bg-brand/[0.06] px-5 py-4 text-brand-2 sm:px-7">Vigor Talent Network</div>
                </div>
                <ul>
                  {COMPARE.map((r) => (
                    <li key={r.us} className="grid grid-cols-2 border-b border-line text-sm last:border-b-0">
                      <span className="flex items-start gap-2.5 px-5 py-4 text-mute sm:px-7">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-mute" aria-hidden="true" />
                        <span className="sr-only">Directory apps: </span>
                        {r.them}
                      </span>
                      <span className="flex items-start gap-2.5 border-l border-line bg-brand/[0.03] px-5 py-4 text-fog sm:px-7">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
                        <span className="sr-only">Vigor Talent Network: </span>
                        {r.us}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section id="faq" className="scroll-mt-20 border-t border-line py-16 sm:py-24" aria-labelledby="faq-title">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
            <SectionHeading id="faq-title" align="left" eyebrow="FAQ" title="Questions, answered.">
              Anything else? Brands can send a requirement and the team will get back within one working day.
            </SectionHeading>
            <div className="divide-y divide-line border-y border-line">
              {FAQS.map((f) => (
                <details key={f.q} className="group">
                  <summary className="flex min-h-14 list-none items-center justify-between gap-4 py-4 text-left text-base font-semibold text-fog marker:hidden [&::-webkit-details-marker]:hidden">
                    <h3 className="font-sans text-base font-semibold tracking-normal">{f.q}</h3>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-mute transition-transform duration-200 group-open:rotate-180">
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </summary>
                  <p className="pb-5 pr-12 text-[15px] leading-relaxed text-mute">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Final CTA ---------------- */}
        <section className="px-4 pb-20 sm:px-6 sm:pb-28" aria-labelledby="cta-title">
          <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-brand/25 bg-ink-2 px-6 py-14 text-center sm:px-12 sm:py-20">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-[28rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_106_26/0.35),transparent)]" />
              <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.03)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_0%,#000,transparent)]" />
            </div>
            <div className="relative">
              <h2 id="cta-title" className="mx-auto max-w-2xl text-balance text-3xl font-bold leading-[1.08] text-fog sm:text-5xl">
                Your next campaign starts on campus.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-pretty text-base text-mute sm:text-lg">
                Talent: build your profile once and start seeing briefs. Brands: tell us what you need and get a shortlist.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/join" className="btn-primary group min-h-12 px-6 text-base">
                  Join as talent
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                <Link href="/brands" className="btn-ghost min-h-12 px-6 text-base">Hire talent</Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
