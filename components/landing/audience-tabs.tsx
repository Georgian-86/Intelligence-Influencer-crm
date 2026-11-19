"use client";

import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight, BadgeCheck, Building2, CalendarCheck, Clapperboard, FileText, Link2, ListChecks,
  Mic, Sparkles, TrendingUp, Trophy, UserRound, type LucideIcon,
} from "lucide-react";
import { clsx } from "clsx";

type Step = { icon: LucideIcon; title: string; desc: string };
type Audience = {
  id: string; label: string; icon: LucideIcon; title: string; desc: string;
  cta: { href: string; label: string }; steps: Step[];
};

const AUDIENCES: Audience[] = [
  {
    id: "creators",
    label: "Creators",
    icon: Clapperboard,
    title: "Briefs that actually fit you.",
    desc: "For Instagram creators of every size — especially college creators. No cold DMs, no forwarded WhatsApp chains.",
    cta: { href: "/register?type=influencer", label: "Join as a creator" },
    steps: [
      { icon: UserRound, title: "Build your profile once", desc: "Add your Instagram handle — followers and engagement are fetched for you." },
      { icon: Sparkles, title: "See briefs that match", desc: "Only campaigns that fit your niche, city and campus. One tap to say you're in." },
      { icon: BadgeCheck, title: "Know where you stand", desc: "Shortlisted, confirmed, live — every stage visible, with WhatsApp updates." },
    ],
  },
  {
    id: "event",
    label: "Event talent",
    icon: Mic,
    title: "Gigs by city. Growth by rank.",
    desc: "Promoters, hosts, anchors, DJs, musicians, dancers and crew for activations, fests and launches.",
    cta: { href: "/register?type=event", label: "Join as event talent" },
    steps: [
      { icon: ListChecks, title: "Pick your roles", desc: "Choose what you do — from brand promoter to sound engineer — and where you work." },
      { icon: Trophy, title: "Get screened and ranked", desc: "Profiles move from Bronze to Platinum as ratings and experience build up." },
      { icon: CalendarCheck, title: "Show up, get rebooked", desc: "Reliable attendance and good ratings bring better gigs your way." },
    ],
  },
  {
    id: "brands",
    label: "Brands",
    icon: Building2,
    title: "Share the brief. We run the rest.",
    desc: "For brand and agency teams running youth, campus and on-ground campaigns across India.",
    cta: { href: "/brands", label: "Hire talent" },
    steps: [
      { icon: FileText, title: "Send your requirement", desc: "Goal, talent mix, cities, dates and budget — one short form." },
      { icon: Link2, title: "Approve from your phone", desc: "Review the shortlist and content through a review link. No login needed." },
      { icon: TrendingUp, title: "Watch it go live", desc: "Posts are tracked automatically and summed up in a campaign report." },
    ],
  },
];

const EASE = [0.2, 0.8, 0.2, 1] as const;

export function AudienceTabs() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (i: number) => {
    const n = (i + AUDIENCES.length) % AUDIENCES.length;
    setActive(n);
    tabs.current[n]?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") { e.preventDefault(); select(active + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); select(active - 1); }
    else if (e.key === "Home") { e.preventDefault(); select(0); }
    else if (e.key === "End") { e.preventDefault(); select(AUDIENCES.length - 1); }
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Choose your audience"
        onKeyDown={onKey}
        className="mx-auto flex w-full max-w-md rounded-2xl border border-line bg-ink-2/80 p-1"
      >
        {AUDIENCES.map((a, i) => {
          const selected = i === active;
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              ref={(el) => { tabs.current[i] = el; }}
              role="tab"
              type="button"
              id={`${base}-tab-${a.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${a.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={clsx(
                "relative flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold transition-colors duration-150",
                selected ? "text-black" : "text-mute hover:text-fog",
              )}
            >
              {selected && (
                <motion.span
                  layoutId={`${base}-pill`}
                  className="absolute inset-0 rounded-xl bg-brand shadow-[0_8px_24px_-10px_rgb(255_106_26/0.8)]"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <Icon className="relative hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />
              <span className="relative whitespace-nowrap">{a.label}</span>
            </button>
          );
        })}
      </div>

      {/* All panels share one grid cell so the section height never jumps between tabs. */}
      <div className="mt-10 grid">
        {AUDIENCES.map((a, i) => {
          const selected = i === active;
          return (
            <motion.div
              key={a.id}
              role="tabpanel"
              id={`${base}-panel-${a.id}`}
              aria-labelledby={`${base}-tab-${a.id}`}
              inert={!selected}
              className={clsx("[grid-area:1/1]", !selected && "pointer-events-none")}
              initial={false}
              animate={{ opacity: selected ? 1 : 0 }}
              transition={{ duration: reduce ? 0.1 : 0.25, ease: EASE }}
            >
              <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
                <div>
                  <h3 className="text-2xl font-bold text-fog sm:text-3xl">{a.title}</h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-mute">{a.desc}</p>
                  <Link href={a.cta.href} className="btn-primary group mt-6 min-h-12 px-5" tabIndex={selected ? 0 : -1}>
                    {a.cta.label}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </div>
                <ol className="relative grid gap-3 sm:grid-cols-3">
                  {/* connector line */}
                  <span aria-hidden="true" className="absolute left-[2.375rem] top-6 bottom-6 w-px bg-gradient-to-b from-brand/60 via-line to-transparent sm:hidden" />
                  <span aria-hidden="true" className="absolute left-[16%] right-[16%] top-[2.375rem] hidden h-px bg-gradient-to-r from-brand/60 via-line to-line sm:block" />
                  {a.steps.map((s, si) => {
                    const Icon = s.icon;
                    return (
                      <motion.li
                        key={s.title}
                        className="card relative p-5"
                        initial={false}
                        animate={selected ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 10 }}
                        transition={{ duration: reduce ? 0.1 : 0.4, ease: EASE, delay: selected && !reduce ? 0.08 + si * 0.08 : 0 }}
                      >
                        <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-brand/30 bg-ink-3 text-brand">
                            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                          </span>
                          <span className="text-xs font-semibold tabular-nums tracking-wider text-mute">STEP {si + 1}</span>
                        </div>
                        <div className="mt-3 font-semibold text-fog">{s.title}</div>
                        <p className="mt-1.5 text-sm leading-relaxed text-mute">{s.desc}</p>
                      </motion.li>
                    );
                  })}
                </ol>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
