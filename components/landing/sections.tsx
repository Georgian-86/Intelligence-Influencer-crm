import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ArrowRight, Plus } from "lucide-react";
import { Avatar, compact } from "@/components/kit";
import { CAMPAIGNS } from "@/lib/demo/fixtures";

/** Section shell: consistent 8pt rhythm (py 96/128) and a left-aligned headline block. */
export function Section({ id, children, className, labelledBy }: { id?: string; children: ReactNode; className?: string; labelledBy?: string }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={clsx("scroll-mt-24 py-20 sm:py-24", className)}>
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({ id, kicker, title, intro, action, className }: { id: string; kicker?: string; title: ReactNode; intro?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx("mb-10 flex flex-col gap-6 sm:mb-12 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="max-w-3xl">
        {kicker && <p className="mb-3 text-[14px] font-medium text-cobalt">{kicker}</p>}
        <h2 id={id} className="text-balance font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.04] tracking-[-0.04em] text-ink">{title}</h2>
        {intro && <p className="mt-4 max-w-xl text-pretty text-[17px] leading-relaxed text-mute">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

/** Accent words in section headlines: brand colour only. The italic serif is reserved for the hero. */
export const Serif = ({ children }: { children: ReactNode }) => <span className="text-cobalt">{children}</span>;

/* ---------- case studies ---------- */
const CASES = [
  { id: "k1", quote: "The brief, the script and the call time all came on WhatsApp. I just had to show up and create.", who: "Riya S.", role: "Food creator, Mithibai '27", hue: 14 },
  { id: "k5", quote: "Brand comments landed on the exact second of my reel. Two rounds and we were live.", who: "Kabir M.", role: "Lifestyle creator, Mumbai", hue: 210 },
  { id: "k4", quote: "We staffed 30 hosts and promoters across 14 campuses in under a week — with ratings for every one.", who: "Mira Iyer", role: "Account manager, Vigor Launchpad", hue: 160 },
];

export function CaseStudies() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {CASES.map((c, i) => {
        const k = CAMPAIGNS.find((x) => x.id === c.id)!;
        const dark = i === 0;
        return (
          <figure key={c.id} className={clsx("flex flex-col rounded-[20px] border p-6 sm:p-7", dark ? "border-white/10 bg-night text-white" : "border-line bg-surface shadow-sm")}>
            <div className={clsx("font-display text-[15px] font-bold tracking-[-0.02em]", dark ? "text-white/80" : "text-ink-2")}>{k.brand_name} <span className={clsx("font-sans font-normal", dark ? "text-white/55" : "text-mute")}>· {k.name}</span></div>
            <div className={clsx("mt-5 font-display text-[clamp(2.5rem,4.5vw,3.5rem)] font-bold leading-none tracking-[-0.045em] tabular-nums", dark ? "text-white" : "text-ink")}>
              {compact(k.views)}<span className={clsx("ml-2 align-top font-sans text-[15px] font-medium tracking-normal", dark ? "text-mint" : "text-cobalt")}>views</span>
            </div>
            <dl className={clsx("mt-6 grid grid-cols-3 gap-3 border-y py-4", dark ? "border-white/10" : "border-line")}>
              {[["Creators", String(k.creators_confirmed)], ["Campuses", String(k.colleges)], ["Eng. rate", `${k.er}%`]].map(([a, b]) => (
                <div key={a}><dt className={clsx("text-[12px]", dark ? "text-white/60" : "text-mute")}>{a}</dt><dd className="mt-0.5 font-display text-[20px] font-bold tabular-nums">{b}</dd></div>
              ))}
            </dl>
            <blockquote className={clsx("mt-6 flex-1 text-[16px] leading-relaxed", dark ? "text-white/85" : "text-ink-2")}>&ldquo;{c.quote}&rdquo;</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <Avatar name={c.who} hue={c.hue} size={36} />
              <span className="text-[13.5px] leading-tight"><b className="block font-semibold">{c.who}</b><span className={dark ? "text-white/60" : "text-mute"}>{c.role}</span></span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

/* ---------- FAQ ---------- */
export const FAQS: { q: string; a: string }[] = [
  { q: "What is Vigor Talent Network?", a: "A campus-first talent network by Vigor Launchpad, a Mumbai youth and college marketing agency. Creators, college creators and event talent join once; Vigor matches them to live brand campaigns and runs the campaign end to end." },
  { q: "Do I need a big following to join?", a: "No. Briefs are matched on niche, city, campus and engagement — not follower count alone — so nano and micro creators are welcome." },
  { q: "How do you get my Instagram stats?", a: "You add your Instagram handle and we fetch public profile metrics such as followers, engagement rate and average views, then refresh them regularly. You can also connect Instagram insights to show verified audience data." },
  { q: "Why do you ask if I'm in college?", a: "Brands often want to reach specific campuses. Telling us your college unlocks campus-ambassador, fest and sampling briefs at your college. It is one question, and you can skip it." },
  { q: "Is it free for creators and event talent?", a: "Yes. Joining is free. You are paid per campaign at the rate agreed before you confirm." },
  { q: "How do brands hire talent?", a: "Send a brief through the brand page. Vigor's team shares a shortlist on a review link you can approve from your phone, then handles briefing, content review, go-live tracking and the final report." },
  { q: "Which cities do you cover?", a: "Talent is live in 38 cities, with the deepest pools in Mumbai, Pune, Delhi NCR, Bangalore, Hyderabad, Chennai, Kolkata, Ahmedabad, Chandigarh and Goa. Campaigns can run pan-India." },
];

export function Faq({ items = FAQS }: { items?: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line rounded-[20px] border border-line bg-surface">
      {items.map((f) => (
        <details key={f.q} className="group px-6 sm:px-8 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-4 text-left text-[16px] font-semibold text-ink sm:text-[17px]">
            {f.q}
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-mute transition-transform duration-300 ease-out-expo group-open:rotate-45 group-open:text-ink" aria-hidden>
              <Plus className="h-4 w-4" />
            </span>
          </summary>
          <p className="-mt-1 max-w-2xl pb-5 text-[15.5px] leading-relaxed text-ink-2">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/* ---------- final CTA on night ---------- */
export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden bg-night text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-40 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(closest-side,rgb(43_75_255/.55),transparent_70%)]" />
              </div>
      <div className="relative mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-24">
        <h2 id="cta-title" className="max-w-3xl text-balance font-display text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[1] tracking-[-0.045em]">
          Your next campaign is <span className="text-cobalt-300">already</span> on campus.
        </h2>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/70">Join free with your Instagram handle, or send a brief and get a shortlist in one working day.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/join" className="btn-flame btn-lg group">Join free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></Link>
          <Link href="/brands" className="btn btn-lg border border-white/25 text-white hover:border-white/50 hover:bg-white/5">Send a brief</Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- how it works: four plain steps ---------- */
const HOW = [
  { n: "01", title: "Brief in", body: "A brand shares goals, cities, talent mix and budget. Two minutes, from a phone." },
  { n: "02", title: "Matched shortlist", body: "Creators are scored on niche, city, campus and engagement, then hand-checked by Vigor. The brand approves in one tap." },
  { n: "03", title: "Brief, review, go live", body: "Talent gets the brief on WhatsApp. Drafts are reviewed with time-stamped comments and posts go live on schedule." },
  { n: "04", title: "One report", body: "Reach, views, engagement and cost per view by city and campus, tracked automatically." },
];

export function HowItWorks() {
  return (
    <ol className="grid gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {HOW.map((h) => (
        <li key={h.n} className="bg-surface p-6 sm:p-7">
          <span className="text-[13px] font-semibold tabular-nums text-cobalt">{h.n}</span>
          <h3 className="mt-3 text-[18px] font-semibold tracking-[-0.02em] text-ink">{h.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-mute">{h.body}</p>
        </li>
      ))}
    </ol>
  );
}
