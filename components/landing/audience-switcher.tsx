"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { clsx } from "clsx";
import { ArrowRight, BadgeCheck, Check, GraduationCap, MapPin, Mic, Sparkles, Star, Wallet } from "lucide-react";
import { Avatar, Progress } from "@/components/kit";
import { InstagramIcon, WhatsAppIcon } from "@/components/brand/icons";

type Tab = { id: string; label: string; title: ReactNode; body: string; steps: [string, string][]; cta: { href: string; label: string }; mock: ReactNode };

const EASE = [0.16, 1, 0.3, 1] as const;

const TABS: Tab[] = [
  {
    id: "creators", label: "Creators",
    title: <>Your handle is your <em className="font-serif font-normal text-cobalt">portfolio</em>.</>,
    body: "Any size, any niche. Add your Instagram handle once and your profile stays current on its own.",
    steps: [["Add your @handle", "We fetch followers, engagement and recent posts."], ["Get matched briefs", "Only campaigns that fit your niche, city and rate."], ["Post, get paid", "Content review, go-live and payout tracking in one place."]],
    cta: { href: "/register?type=influencer", label: "Join as a creator" },
    mock: <CreatorMock />,
  },
  {
    id: "college", label: "College creators",
    title: <>Your campus is an <em className="font-serif font-normal text-cobalt">audience</em>.</>,
    body: "Brands pay for campus reach. Tell us where you study and you unlock fest, ambassador and sampling briefs.",
    steps: [["Answer one question", "Are you in college? Pick your campus from the list."], ["Become a campus face", "Ambassador, fest and launch briefs at your college."], ["Grow with your batch", "Ranks from Bronze to Platinum as you deliver."]],
    cta: { href: "/register?type=influencer", label: "Join from your campus" },
    mock: <CollegeMock />,
  },
  {
    id: "event", label: "Event talent",
    title: <>Gigs that find <em className="font-serif font-normal text-cobalt">you</em>.</>,
    body: "Promoters, hosts, DJs, dancers, comics and crew — booked for activations, fests and launches in your city.",
    steps: [["Build a gig profile", "Skills, languages, rates and a short showreel."], ["Confirm on WhatsApp", "Call time, venue and brief arrive as one message."], ["Ratings that rebook", "Every gig adds to your rating and reliability score."]],
    cta: { href: "/register?type=event", label: "Join as event talent" },
    mock: <EventMock />,
  },
  {
    id: "brands", label: "Brands",
    title: <>A shortlist by <em className="font-serif font-normal text-cobalt">tomorrow</em>.</>,
    body: "Tell us the goal, cities and budget. Vigor's team returns verified creators and on-ground talent, then runs the campaign.",
    steps: [["Send a brief", "Two minutes, from any device."], ["Approve from your phone", "A review link with real, fetched metrics."], ["Track every post", "Live views at 24h, 72h and 7 days, in one report."]],
    cta: { href: "/brands", label: "Send a brief" },
    mock: <BrandMock />,
  },
];

export function AudienceSwitcher() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const t = TABS[active];

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (e.key === "Home" || e.key === "End" || d) {
      e.preventDefault();
      const next = e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (active + d + TABS.length) % TABS.length;
      setActive(next);
      refs.current[next]?.focus();
    }
  };

  return (
    <div>
      <div role="tablist" aria-label="Who is it for" onKeyDown={onKey} className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <div className="inline-flex gap-1 rounded-full border border-line bg-surface p-1 shadow-xs">
          {TABS.map((x, i) => (
            <button
              key={x.id}
              ref={(el) => { refs.current[i] = el; }}
              role="tab"
              id={`tab-${x.id}`}
              aria-selected={i === active}
              aria-controls={`panel-${x.id}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={clsx("relative h-11 whitespace-nowrap rounded-full px-4 text-[14px] font-semibold transition-colors duration-200 sm:px-5",
                i === active ? "text-white" : "text-ink-2 hover:text-ink")}
            >
              {i === active && <motion.span layoutId="aud-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ duration: reduce ? 0 : 0.45, ease: EASE }} />}
              <span className="relative">{x.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} className="mt-8 grid gap-8 rounded-[24px] border border-line bg-surface p-5 shadow-md sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 lg:p-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={t.id} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: EASE }} className="flex flex-col">
            <h3 className="font-display text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.02] tracking-[-0.04em] text-ink">{t.title}</h3>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-ink-2">{t.body}</p>
            <ol className="mt-8 space-y-5">
              {t.steps.map(([h, d], i) => (
                <li key={h} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cobalt-200 bg-cobalt-50 font-display text-[14px] font-bold text-cobalt tabular-nums">{i + 1}</span>
                  <span>
                    <span className="block text-[16px] font-semibold text-ink">{h}</span>
                    <span className="mt-0.5 block text-[14.5px] leading-relaxed text-mute">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-auto pt-9">
              <Link href={t.cta.href} className="btn-primary btn-lg group">{t.cta.label} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></Link>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="relative min-h-[380px] overflow-hidden rounded-[20px] bg-canvas-2 p-5 sm:p-8" aria-hidden>
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgb(43_75_255/.18),transparent)]" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={t.id} initial={reduce ? false : { opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, scale: 0.98 }} transition={{ duration: 0.45, ease: EASE }} className="relative grid h-full place-items-center">
              {t.mock}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ---------- mini UI mockups ---------- */
function MockCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("w-full max-w-[340px] rounded-[20px] border border-line bg-surface p-4 shadow-lg", className)}>{children}</div>;
}

function CreatorMock() {
  return (
    <div className="relative w-full max-w-[340px]">
      <MockCard>
        <div className="flex items-center gap-3">
          <Avatar name="Kavya Iyer" hue={310} size={44} />
          <div>
            <div className="flex items-center gap-1 text-[14px] font-semibold text-ink">Kavya Iyer <BadgeCheck className="h-3.5 w-3.5 text-cobalt" /></div>
            <div className="flex items-center gap-1 text-[12.5px] text-mute"><InstagramIcon className="h-3 w-3" /> kavya.iyer · Beauty</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[["86.4K", "Followers"], ["5.9%", "Eng. rate"], ["1.2L", "Avg views"]].map(([v, k]) => (
            <div key={k} className="rounded-xl bg-canvas py-2"><div className="font-display text-[17px] font-bold text-ink">{v}</div><div className="text-[11px] text-mute">{k}</div></div>
          ))}
        </div>
      </MockCard>
      <MockCard className="relative -mt-2 ml-8 w-[88%]">
        <div className="flex items-center justify-between"><span className="text-[12px] font-semibold text-cobalt">New match · 94%</span><span className="chip">₹8,500</span></div>
        <div className="mt-1.5 text-[14px] font-semibold text-ink">Glow Week Sampling — Nua</div>
        <div className="mt-1 text-[12.5px] text-mute">1 Reel + 2 Stories · Mumbai</div>
      </MockCard>
    </div>
  );
}

function CollegeMock() {
  return (
    <MockCard>
      <div className="text-[15px] font-semibold text-ink">Are you in college?</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <span className="flex h-11 items-center justify-center gap-1.5 rounded-xl border-2 border-cobalt bg-cobalt-50 text-[14px] font-semibold text-cobalt"><Check className="h-4 w-4" /> Yes</span>
        <span className="flex h-11 items-center justify-center rounded-xl border border-line text-[14px] font-medium text-ink-2">Not right now</span>
      </div>
      <div className="mt-3 flex h-11 items-center gap-2 rounded-xl border border-cobalt bg-surface px-3 text-[14px] text-ink ring-4 ring-cobalt/10">
        <GraduationCap className="h-4 w-4 text-cobalt" /> Mithi<span className="-ml-2 h-4 w-px animate-pulse bg-cobalt" />
      </div>
      <ul className="mt-2 overflow-hidden rounded-xl border border-line text-[13.5px]">
        <li className="flex items-center justify-between bg-cobalt-50 px-3 py-2.5 font-medium text-ink">Mithibai College <span className="text-[12px] text-mute">Mumbai</span></li>
        <li className="flex items-center justify-between px-3 py-2.5 text-ink-2">Mithibai — Junior College <span className="text-[12px] text-mute">Mumbai</span></li>
      </ul>
      <div className="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium text-ok"><Sparkles className="h-3.5 w-3.5" /> 3 campus briefs unlocked</div>
    </MockCard>
  );
}

function EventMock() {
  return (
    <div className="w-full max-w-[340px] space-y-3">
      <MockCard>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-flame-700"><Mic className="h-3.5 w-3.5" /> Event host · Freshers&apos; Night</span>
          <span className="chip">₹12,000/day</span>
        </div>
        <div className="mt-2 text-[15px] font-semibold text-ink">boAt — Pune campus tour</div>
        <div className="mt-1 flex items-center gap-1 text-[12.5px] text-mute"><MapPin className="h-3.5 w-3.5" /> Symbiosis · Sat, 6:00 pm call time</div>
        <div className="mt-3 flex items-center gap-2"><Progress value={72} /><span className="shrink-0 text-[12px] font-medium text-ink-2">Gold · 72%</span></div>
      </MockCard>
      <div className="ml-auto w-[82%] rounded-[18px] rounded-br-md bg-[#d9fdd3] p-3 text-[13px] leading-snug text-ink shadow-md">
        <div className="mb-1 flex items-center gap-1 text-[11.5px] font-semibold text-[#128c4a]"><WhatsAppIcon className="h-3.5 w-3.5" /> Vigor Ops</div>
        You&apos;re confirmed! Venue pin, script and dress code attached. Reply YES to lock it.
      </div>
      <div className="flex items-center gap-1 pl-1 text-[12.5px] text-ink-2">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />)} <span className="ml-1">4.9 from 23 gigs</span></div>
    </div>
  );
}

function BrandMock() {
  const rows = [["Riya Shah", 12, "Food", "94"], ["Arjun Nair", 200, "Comedy", "91"], ["Meher Kapoor", 280, "Fashion", "88"]] as const;
  return (
    <MockCard className="max-w-[360px]">
      <div className="flex items-center justify-between">
        <div><div className="text-[12px] font-medium text-mute">Shortlist · Campus Fest Takeover</div><div className="text-[15px] font-semibold text-ink">15 creators · 3 cities</div></div>
        <span className="chip border-ok/25 bg-ok-bg text-ok">12 approved</span>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {rows.map(([n, h, c, m], i) => (
          <li key={n} className="flex items-center gap-3 py-2.5">
            <Avatar name={n} hue={h} size={32} />
            <div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-semibold text-ink">{n}</div><div className="text-[12px] text-mute">{c} · {m}% match</div></div>
            <span className={clsx("grid h-8 w-8 place-items-center rounded-full", i < 2 ? "bg-ok text-white" : "border border-line text-mute")}><Check className="h-4 w-4" /></span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between rounded-xl bg-canvas px-3 py-2 text-[12.5px]"><span className="inline-flex items-center gap-1.5 text-ink-2"><Wallet className="h-3.5 w-3.5" /> Est. spend</span><b className="font-display text-ink">₹6.4L of ₹9.6L</b></div>
    </MockCard>
  );
}
