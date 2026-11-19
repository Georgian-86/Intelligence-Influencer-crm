import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, GraduationCap, Link2, TrendingUp, Users, type LucideIcon } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Reveal } from "@/components/motion/reveal";
import { EnquiryForm } from "@/components/marketing/enquiry-form";
import { SuccessCheck } from "@/components/marketing/success-check";
import { CITIES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Hire creators & event talent",
  description: "Tell Vigor what you need — college creators, influencers, promoters, hosts or crew. Get a curated shortlist with real engagement data, approve from your phone, and track every post.",
  alternates: { canonical: "/brands" },
};

const BENEFITS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: GraduationCap, title: "Campus-level targeting", desc: "Filter by city, campus type and graduation year — not just follower count." },
  { icon: Users, title: "Creators and on-ground talent", desc: "Influencers, promoters, hosts, DJs and crew staffed from one brief." },
  { icon: BadgeCheck, title: "Real, fetched metrics", desc: "Followers and engagement pulled from Instagram, not screenshots." },
  { icon: Link2, title: "Approve from your phone", desc: "Shortlists and content arrive as a review link. No login needed." },
  { icon: TrendingUp, title: "Tracked and reported", desc: "Live posts tracked at 24h, 72h and 7d, summed up in one report." },
];

const NEXT = [
  "We read your requirement and reply within one working day.",
  "A quick call to lock goals, talent mix, cities and budget.",
  "You get a curated shortlist on a review link to approve.",
];

export default async function BrandsPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  const sent = !!sp.sent;
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative overflow-x-clip">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] overflow-hidden">
          <div className="absolute left-[20%] top-[-18rem] h-[36rem] w-[56rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_106_26/0.18),transparent)]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          {/* -------- pitch -------- */}
          <div>
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-2">For brands &amp; agencies</span>
              <h1 className="mt-3 text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-fog sm:text-5xl">
                Tell us who you need. <span className="text-gradient">We&apos;ll bring the shortlist.</span>
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-mute">
                Creators for a launch, promoters for a campus activation, a host and DJ for your event — Vigor&apos;s team
                matches your brief to verified talent, then runs outreach, approvals and tracking end to end.
              </p>
            </Reveal>

            <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {BENEFITS.map((b, i) => {
                const Icon = b.icon;
                return (
                  <Reveal as="li" key={b.title} delay={0.04 * i} className="flex gap-3.5 rounded-2xl border border-line bg-ink-2/50 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line-2 bg-ink-3 text-brand-2">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-[15px] font-semibold text-fog">{b.title}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-mute">{b.desc}</span>
                    </span>
                  </Reveal>
                );
              })}
            </ul>

            <Reveal delay={0.1} className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-fog">What happens next</h2>
              <ol className="mt-4 space-y-3">
                {NEXT.map((n, i) => (
                  <li key={n} className="flex items-start gap-3 text-[15px] text-mute">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-brand/40 text-xs font-semibold tabular-nums text-brand-2">{i + 1}</span>
                    {n}
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-sm text-mute">
                Talent across {CITIES.slice(0, 4).join(", ")} and {CITIES.length - 4} more cities.
              </p>
            </Reveal>
          </div>

          {/* -------- form -------- */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal delay={0.08}>
              <div className="relative rounded-3xl border border-line bg-ink-2 p-5 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04),0_40px_80px_-40px_rgb(0_0_0/0.9)] sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-brand/70 to-transparent" />
                {sent ? (
                  <div className="flex flex-col items-center py-10 text-center" role="status">
                    <SuccessCheck />
                    <h2 className="mt-6 text-2xl font-bold text-fog">Requirement received</h2>
                    <p className="mt-2 max-w-sm text-mute">
                      Thanks! Our team will reach out within one working day to talk through your brief.
                    </p>
                    <div className="mt-6 flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-mute">
                      <Clock className="h-3.5 w-3.5 text-brand-2" aria-hidden="true" /> Typical reply: within 1 working day
                    </div>
                    <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <Link href="/" className="btn-ghost min-h-12 px-5">Back to home</Link>
                      <Link href="/brands" className="btn-quiet min-h-12 px-5">
                        Send another requirement <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-fog">Send your requirement</h2>
                    <p className="mb-6 mt-1 text-sm text-mute">Takes about two minutes. Fields marked optional can be skipped.</p>
                    <EnquiryForm serverError={sp.error} />
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
