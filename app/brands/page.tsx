import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, Clock, GraduationCap, Link2, MessageSquareText, TrendingUp, Users, type LucideIcon } from "lucide-react";
import { HeaderBar } from "@/components/landing/header-bar";
import { SiteFooter } from "@/components/marketing/site-footer";
import { EnquiryForm } from "@/components/marketing/enquiry-form";
import { SuccessCheck } from "@/components/marketing/success-check";
import { JsonLd, breadcrumbs } from "@/components/marketing/json-ld";
import { CaseStudies, Serif } from "@/components/landing/sections";
import { CountUp } from "@/components/motion/reveal";
import { PLATFORM_STATS } from "@/lib/demo/fixtures";
import { SITE } from "@/lib/site";

const TITLE = "Hire college creators, influencers and event talent";
const DESC = "Send Vigor a brief and get a verified shortlist of creators, campus ambassadors, promoters and hosts within one working day. Approve from your phone; every post is tracked.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/brands" },
  openGraph: { url: "/brands", title: `${TITLE} · ${SITE.name}`, description: DESC, type: "website", locale: "en_IN" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

const PROOF: { to: number; suffix?: string; decimals?: number; label: string }[] = [
  { to: PLATFORM_STATS.creators, label: "creators and event talent" },
  { to: PLATFORM_STATS.campuses, label: "campuses across India" },
  { to: PLATFORM_STATS.brands, label: "brands served" },
  { to: PLATFORM_STATS.reach_month / 10_000_000, decimals: 1, suffix: " Cr", label: "monthly reach" },
];

const PROCESS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: MessageSquareText, title: "Brief", desc: "Two minutes here, then a 15-minute call to lock goals, talent mix, cities and budget." },
  { icon: Users, title: "Shortlist", desc: "Verified creators and talent on a review link within one working day." },
  { icon: Link2, title: "Approve", desc: "Approve people and content from your phone. No login needed." },
  { icon: TrendingUp, title: "Launch & report", desc: "Posts tracked at 24h, 72h and 7 days, rolled into one shareable report." },
];

const MODELS = [
  {
    name: "Sprint", fit: "One launch, one city", budget: "From ₹1 lakh",
    items: ["10–25 creators", "Reels + Stories", "Shortlist in 24 hours", "Final report"],
  },
  {
    name: "Campaign", fit: "Multi-city, creators + on-ground", budget: "₹5–15 lakh", featured: true,
    items: ["25–100 creators and talent", "Campus activations & fests", "Content review room", "Live tracking + city/campus report"],
  },
  {
    name: "Always-on", fit: "Campus ambassadors year-round", budget: "₹15 lakh+",
    items: ["Ambassadors at chosen campuses", "Monthly content calendar", "Dedicated account manager", "Quarterly insights review"],
  },
];

const BENEFITS: { icon: LucideIcon; title: string }[] = [
  { icon: GraduationCap, title: "Target by city, campus and graduation year" },
  { icon: BadgeCheck, title: "Metrics fetched from Instagram, not screenshots" },
  { icon: Users, title: "Creators and on-ground talent from one brief" },
];

export default async function BrandsPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  const sent = !!sp.sent;
  return (
    <>
      <JsonLd data={[
        breadcrumbs(SITE.url, [{ name: "Home", path: "/" }, { name: "For brands", path: "/brands" }]),
        {
          "@context": "https://schema.org", "@type": "Service", name: "Campus & creator marketing talent",
          serviceType: "Influencer marketing and event staffing", areaServed: { "@type": "Country", name: "India" },
          provider: { "@type": "Organization", name: "Vigor Launchpad", url: SITE.url },
          description: DESC,
        },
      ]} />
      <HeaderBar />
      <main id="main" className="overflow-x-clip">
        {/* hero + form */}
        <section className="grain relative isolate pb-20 pt-32 sm:pt-40" aria-labelledby="brands-title">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-[-10%] top-[-20rem] h-[50rem] w-[50rem] rounded-full bg-[radial-gradient(closest-side,rgb(220_229_255/.95),transparent_70%)]" />
          </div>
          <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
            <div>
              <p className="flex items-center gap-2 text-[14px] font-medium text-cobalt"><span className="h-1.5 w-1.5 rounded-full bg-cobalt" aria-hidden />For brands & agencies</p>
              <h1 id="brands-title" className="mt-4 font-display text-[clamp(3rem,6.6vw,5.75rem)] font-bold leading-[0.94] tracking-[-0.05em] text-ink">
                Campus reach, <em className="font-serif font-normal tracking-[-0.02em] text-cobalt">without</em> the chaos.
              </h1>
              <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-ink-2">
                Creators for a launch, promoters for a campus activation, a host and DJ for your fest night. Tell us who you need —
                Vigor&apos;s team brings the shortlist and runs outreach, approvals and tracking end to end.
              </p>
              <ul className="mt-8 space-y-3">
                {BENEFITS.map((b) => (
                  <li key={b.title} className="flex items-center gap-3 text-[16px] text-ink">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cobalt-50 text-cobalt"><b.icon className="h-[18px] w-[18px]" aria-hidden /></span>
                    {b.title}
                  </li>
                ))}
              </ul>
              <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-4">
                {PROOF.map((p) => (
                  <div key={p.label}>
                    <dt className="sr-only">{p.label}</dt>
                    <dd>
                      <CountUp to={p.to} decimals={p.decimals} suffix={p.suffix} className="block font-display text-[34px] font-bold leading-none tracking-[-0.04em] text-ink tabular-nums" />
                      <span aria-hidden className="mt-2 block text-[13px] text-mute">{p.label}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div id="enquire" className="scroll-mt-28 lg:sticky lg:top-28 lg:self-start">
              <div className="panel relative p-6 sm:p-8">
                {sent ? (
                  <div className="flex flex-col items-center py-10 text-center" role="status">
                    <SuccessCheck />
                    <h2 className="mt-6 font-display text-[28px] font-bold tracking-[-0.03em] text-ink">Brief received</h2>
                    <p className="mt-2 max-w-sm text-ink-2">Our team will reach out within one working day to talk through your brief.</p>
                    <div className="mt-6 flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-2">
                      <Clock className="h-3.5 w-3.5 text-cobalt" aria-hidden /> Typical reply: within 1 working day
                    </div>
                    <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <Link href="/" className="btn-ghost h-12 px-5">Back to home</Link>
                      <Link href="/brands" className="btn-quiet h-12 px-5">Send another brief <ArrowRight className="h-4 w-4" aria-hidden /></Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-[26px] font-bold tracking-[-0.03em] text-ink">Send a brief</h2>
                    <p className="mb-6 mt-1 text-[14px] text-mute">About two minutes. We reply within one working day.</p>
                    <EnquiryForm serverError={sp.error} />
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* process */}
        <section className="border-y border-line bg-surface/60 py-24 sm:py-28" aria-labelledby="process-title">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <h2 id="process-title" className="max-w-3xl font-display text-[clamp(2.4rem,5vw,4rem)] font-bold leading-[0.98] tracking-[-0.045em] text-ink">From brief to report in <Serif>four</Serif> steps.</h2>
            <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {PROCESS.map((p, i) => (
                <li key={p.title} className="relative rounded-[28px] border border-line bg-surface p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white"><p.icon className="h-5 w-5" aria-hidden /></span>
                    <span className="font-display text-[14px] font-bold text-mute tabular-nums">0{i + 1}</span>
                  </div>
                  <h3 className="mt-8 font-display text-[22px] font-semibold tracking-[-0.025em] text-ink">{p.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{p.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* engagement models */}
        <section className="py-24 sm:py-32" aria-labelledby="models-title">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <h2 id="models-title" className="max-w-3xl font-display text-[clamp(2.4rem,5vw,4rem)] font-bold leading-[0.98] tracking-[-0.045em] text-ink">Ways to <Serif>work</Serif> with us.</h2>
              <p className="max-w-sm text-[15px] leading-relaxed text-ink-2">Budgets are indicative and include talent fees. Every engagement is quoted after the brief call.</p>
            </div>
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {MODELS.map((m) => (
                <article key={m.name} className={`flex flex-col rounded-[28px] border p-7 sm:p-8 ${m.featured ? "border-white/10 bg-night text-white shadow-lg" : "border-line bg-surface shadow-sm"}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-[26px] font-bold tracking-[-0.03em]">{m.name}</h3>
                    {m.featured && <span className="chip border-flame bg-flame text-night">Most booked</span>}
                  </div>
                  <p className={`mt-1 text-[15px] ${m.featured ? "text-white/70" : "text-mute"}`}>{m.fit}</p>
                  <p className="mt-8 font-display text-[40px] font-bold leading-none tracking-[-0.04em]">{m.budget}</p>
                  <ul className={`mt-8 flex-1 space-y-3 border-t pt-6 ${m.featured ? "border-white/10" : "border-line"}`}>
                    {m.items.map((it) => (
                      <li key={it} className={`flex items-start gap-2.5 text-[15px] ${m.featured ? "text-white/85" : "text-ink-2"}`}>
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${m.featured ? "text-mint" : "text-cobalt"}`} aria-hidden />{it}
                      </li>
                    ))}
                  </ul>
                  <Link href="#enquire" className={`mt-8 h-12 ${m.featured ? "btn bg-white text-night hover:bg-ice" : "btn-ghost"}`}>Start with a brief</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* proof */}
        <section className="bg-canvas-2/60 py-24 sm:py-32" aria-labelledby="proof-title">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <h2 id="proof-title" className="mb-14 max-w-3xl font-display text-[clamp(2.4rem,5vw,4rem)] font-bold leading-[0.98] tracking-[-0.045em] text-ink">Recent <Serif>launches</Serif>.</h2>
            <CaseStudies />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
