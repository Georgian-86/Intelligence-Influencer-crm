"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { BadgeCheck, ChartColumn, ChartLine, FileText, ListChecks, Radar, type LucideIcon } from "lucide-react";

const EASE = [0.2, 0.8, 0.2, 1] as const;

const STEPS: { icon: LucideIcon; tag: string; title: string; desc: string; meta: string[] }[] = [
  { icon: FileText, tag: "Brief", title: "The requirement becomes a structured brief", desc: "Goal, talent mix, cities, campuses, dates, deliverables and budget — captured once, no re-typing from a WhatsApp forward.", meta: ["Enquiry form", "Email", "WhatsApp"] },
  { icon: Radar, tag: "Matching", title: "The brief reaches talent who fit", desc: "Creators and event talent matching on niche, city, campus, graduation year and engagement see it and raise their hand.", meta: ["College graph", "Interest in one tap"] },
  { icon: ListChecks, tag: "Shortlist", title: "Vigor's team curates the shortlist", desc: "Interested talent is screened against real metrics, ranks and past ratings before anyone reaches the brand.", meta: ["Auto-fetched metrics", "Ranks & ratings"] },
  { icon: BadgeCheck, tag: "Brand approval", title: "The brand approves from a review link", desc: "Talent and content are approved or sent back with comments from a phone — no login, no PDF decks.", meta: ["Magic link", "Comments"] },
  { icon: ChartLine, tag: "Live tracking", title: "Posts are tracked the moment they go live", desc: "Views and engagement are captured automatically at 24 hours, 72 hours and 7 days.", meta: ["24h", "72h", "7d"] },
  { icon: ChartColumn, tag: "Report", title: "A report closes the loop", desc: "Reach, views, engagement and the content gallery in one shareable report — and every rating feeds the next campaign.", meta: ["Shareable", "Learnings kept"] },
];

export function CampaignTimeline() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  return (
    <ol ref={ref} className="relative">
      {/* rail */}
      <span aria-hidden="true" className="absolute bottom-4 left-[1.375rem] top-4 w-px bg-line" />
      <motion.span
        aria-hidden="true"
        className="absolute bottom-4 left-[1.375rem] top-4 w-px origin-top bg-gradient-to-b from-brand via-brand-2 to-brand-3"
        style={{ scaleY: reduce ? 1 : progress }}
      />
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.li
            key={s.tag}
            className="relative pb-10 pl-16 last:pb-0"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <span className="absolute left-0 top-0 grid h-11 w-11 place-items-center rounded-2xl border border-brand/40 bg-ink-2 text-brand shadow-[0_0_0_6px_var(--color-ink)]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex items-center gap-2 pt-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-2">
              <span className="tabular-nums text-mute">{String(i + 1).padStart(2, "0")}</span> {s.tag}
            </div>
            <h3 className="mt-1.5 text-lg font-semibold text-fog sm:text-xl">{s.title}</h3>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-mute">{s.desc}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.meta.map((m) => (
                <span key={m} className="chip border-line-2 bg-ink-2 text-mute">{m}</span>
              ))}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
