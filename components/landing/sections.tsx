import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ArrowRight, Plus } from "lucide-react";
import { Avatar, compact } from "@/components/kit";
import { CAMPAIGNS } from "@/lib/demo/fixtures";

/** Section shell: consistent 8pt rhythm (py 96/128) and a left-aligned headline block. */
export function Section({ id, children, className, labelledBy }: { id?: string; children: ReactNode; className?: string; labelledBy?: string }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={clsx("scroll-mt-24 py-24 sm:py-32", className)}>
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({ id, kicker, title, intro, action, className }: { id: string; kicker?: string; title: ReactNode; intro?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx("mb-12 flex flex-col gap-6 sm:mb-16 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="max-w-3xl">
        {kicker && <p className="mb-4 flex items-center gap-2 text-[14px] font-medium text-cobalt"><span className="h-1.5 w-1.5 rounded-full bg-cobalt" aria-hidden />{kicker}</p>}
        <h2 id={id} className="font-display text-[clamp(2.4rem,5.4vw,4.5rem)] font-bold leading-[0.98] tracking-[-0.045em] text-ink">{title}</h2>
        {intro && <p className="mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-ink-2">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export const Serif = ({ children }: { children: ReactNode }) => <em className="font-serif text-[1.06em] font-normal tracking-[-0.02em] text-cobalt">{children}</em>;

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
          <figure key={c.id} className={clsx("flex flex-col rounded-[28px] border p-7 sm:p-8", dark ? "border-white/10 bg-night text-white" : "border-line bg-surface shadow-sm")}>
            <div className={clsx("font-display text-[15px] font-bold tracking-[-0.02em]", dark ? "text-white/80" : "text-ink-2")}>{k.brand_name} <span className={clsx("font-sans font-normal", dark ? "text-white/55" : "text-mute")}>· {k.name}</span></div>
            <div className={clsx("mt-6 font-display text-[clamp(3rem,6vw,4.5rem)] font-bold leading-none tracking-[-0.05em] tabular-nums", dark ? "text-white" : "text-ink")}>
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
    <div className="divide-y divide-line rounded-[28px] border border-line bg-surface shadow-sm">
      {items.map((f) => (
        <details key={f.q} className="group px-6 sm:px-8 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-display text-[18px] font-semibold tracking-[-0.02em] text-ink sm:text-[20px]">
            {f.q}
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink-2 transition-[transform,background-color,color] duration-300 ease-out-expo group-open:rotate-45 group-open:border-cobalt group-open:bg-cobalt group-open:text-white" aria-hidden>
              <Plus className="h-4 w-4" />
            </span>
          </summary>
          <p className="-mt-1 max-w-2xl pb-6 text-[16px] leading-relaxed text-ink-2">{f.a}</p>
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
        <div className="absolute -bottom-56 left-[-10%] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgb(195_181_255/.25),transparent_70%)]" />
        {/* launch trail */}
        <svg viewBox="0 0 1200 500" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="trail" x1="0" x2="1" y1="1" y2="0"><stop offset="0" stopColor="#FF6B4A" stopOpacity="0" /><stop offset=".55" stopColor="#FF6B4A" stopOpacity=".8" /><stop offset="1" stopColor="#C3B5FF" /></linearGradient>
          </defs>
          <path d="M-20 520 C 380 470, 720 360, 1010 90" fill="none" stroke="url(#trail)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M-20 540 C 420 500, 760 400, 1040 130" fill="none" stroke="#8EA2FF" strokeOpacity=".25" strokeWidth="1" strokeDasharray="3 8" />
        </svg>
        <div className="absolute right-[14%] top-[14%] h-28 w-28 rounded-full bg-[radial-gradient(circle_at_32%_28%,#a9b8ff,#2b4bff_50%,#15226a)] shadow-[0_30px_60px_-20px_rgb(43_75_255/.8)] sm:h-40 sm:w-40" />
        <div className="absolute right-[11%] top-[11%] h-36 w-52 rounded-[50%] border border-ice/40 [transform:rotate(-24deg)] sm:h-52 sm:w-72" />
      </div>
      <div className="relative mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <h2 id="cta-title" className="max-w-4xl font-display text-[clamp(2.75rem,7vw,6rem)] font-bold leading-[0.95] tracking-[-0.05em]">
          Your next campaign is <em className="font-serif font-normal text-cobalt-300">already</em> on campus.
        </h2>
        <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-white/75">Join free with your Instagram handle, or send a brief and get a shortlist in one working day.</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/join" className="btn-flame btn-lg group">Join free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></Link>
          <Link href="/brands" className="btn btn-lg border border-white/25 text-white hover:border-white/50 hover:bg-white/5">Send a brief</Link>
        </div>
      </div>
    </section>
  );
}
