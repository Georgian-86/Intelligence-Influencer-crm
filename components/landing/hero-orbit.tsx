"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { BadgeCheck, CircleCheck, Mic, Star, TrendingUp } from "lucide-react";
import { clsx } from "clsx";
import { LogoMark } from "@/components/brand/logo";
import { InstagramIcon } from "@/components/brand/icons";

const EASE = [0.2, 0.8, 0.2, 1] as const;

/**
 * Decorative hero visual: sample creator / event-talent / brief cards floating around the Vigor hub.
 * Everything is sized in `em` off a container-query font size, so it scales fluidly with no JS
 * measurement and no layout shift. Only transform/opacity animate.
 */
export function HeroOrbit() {
  const reduce = useReducedMotion();
  const rect = useRef<DOMRect | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 90, damping: 18, mass: 0.5 });

  const onEnter = (e: PointerEvent<HTMLDivElement>) => {
    rect.current = e.currentTarget.getBoundingClientRect();
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse" || !rect.current) return;
    const r = rect.current;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div className="w-full [container-type:inline-size]">
      <div
        role="img"
        aria-label="Illustration: sample creator and event-talent profiles being matched to a brand brief"
        onPointerEnter={onEnter}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative mx-auto aspect-[4/5] w-full select-none [--fs:calc(100cqw/27)] sm:aspect-square sm:[--fs:calc(100cqw/31)]"
        style={{ fontSize: "var(--fs)" }}
      >
        <div aria-hidden="true" className="absolute inset-0">
          <Hub reduce={!!reduce} />

          <Card x={sx} y={sy} depth={18} delay={0.15} float="0s" className="left-0 top-0 sm:left-[2%] sm:top-[6%]">
            <CreatorCard />
          </Card>
          <Card x={sx} y={sy} depth={-14} delay={0.3} float="-2.2s" className="right-0 top-[12%] sm:right-0 sm:top-[22%]">
            <EventCard />
          </Card>
          <Card x={sx} y={sy} depth={10} delay={0.45} float="-4s" className="bottom-[11%] left-0 sm:bottom-[6%] sm:left-[6%]">
            <BriefCard />
          </Card>
          <Card x={sx} y={sy} depth={-22} delay={0.6} float="-1.2s" className="bottom-0 right-0 sm:bottom-[22%] sm:right-[2%]">
            <Toast icon={<CircleCheck className="h-[1.1em] w-[1.1em] text-ok" />} title="Shortlist approved" sub="by brand · via review link" />
          </Card>
          <Card x={sx} y={sy} depth={26} delay={0.75} float="-3.1s" className="right-[6%] top-[1%] hidden sm:block">
            <Toast icon={<TrendingUp className="h-[1.1em] w-[1.1em] text-brand" />} title="Reel live · 24h" sub="views tracked automatically" />
          </Card>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-mute">Sample profiles shown for illustration.</p>
    </div>
  );
}

function Card({
  children, className, x, y, depth, delay, float,
}: {
  children: ReactNode; className: string; x: MotionValue<number>; y: MotionValue<number>;
  depth: number; delay: number; float: string;
}) {
  const reduce = useReducedMotion();
  const tx = useTransform(x, (v) => v * depth);
  const ty = useTransform(y, (v) => v * depth);
  return (
    <motion.div
      className={clsx("absolute z-10", className)}
      initial={reduce ? false : { opacity: 0, scale: 0.92, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      <motion.div style={{ x: tx, y: ty }}>
        <div className="animate-float will-change-transform" style={{ animationDelay: float }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Hub({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 h-[17em] w-[17em] -translate-x-1/2 -translate-y-1/2 sm:top-1/2 sm:h-[20em] sm:w-[20em]"
      initial={reduce ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <div className="absolute inset-[18%] rounded-full bg-brand/20 blur-3xl" />
      {/* static rings */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        <circle cx="100" cy="100" r="98" fill="none" stroke="rgb(255 255 255 / 0.06)" />
        <circle cx="100" cy="100" r="66" fill="none" stroke="rgb(255 255 255 / 0.08)" />
        <circle cx="100" cy="100" r="36" fill="rgb(255 106 26 / 0.06)" stroke="rgb(255 106 26 / 0.25)" />
      </svg>
      {/* slowly rotating orbit with "talent" dots */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full animate-spin [animation-duration:48s]">
        <circle cx="100" cy="100" r="82" fill="none" stroke="rgb(255 106 26 / 0.35)" strokeDasharray="2 7" strokeLinecap="round" />
        <circle cx="100" cy="18" r="3.2" fill="#FF8A3D" />
        <circle cx="171" cy="141" r="2.4" fill="#38BDF8" />
        <circle cx="29" cy="141" r="2.4" fill="#F5C542" />
      </svg>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full animate-spin [animation-direction:reverse] [animation-duration:70s]">
        <circle cx="100" cy="100" r="50" fill="none" stroke="rgb(255 255 255 / 0.12)" strokeDasharray="1 5" strokeLinecap="round" />
        <circle cx="150" cy="100" r="2.2" fill="#22C55E" />
        <circle cx="50" cy="100" r="2" fill="#EDEDF0" />
      </svg>
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <div className="rounded-[1.1em] shadow-[0_0_0_0.4em_rgb(255_106_26/0.12),0_1.2em_3em_-0.6em_rgb(255_106_26/0.7)]">
          <LogoMark className="h-[3.6em] w-[3.6em]" />
        </div>
      </div>
    </motion.div>
  );
}

const surface =
  "rounded-[1em] border border-white/10 bg-ink-2/90 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05),0_1.5em_3em_-1em_rgb(0_0_0/0.8)] backdrop-blur-md";

function CreatorCard() {
  return (
    <div className={clsx(surface, "w-[13em] p-[0.85em]")}>
      <div className="flex items-center gap-[0.6em]">
        <div className="grid h-[2.4em] w-[2.4em] shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-2 to-[#e1306c] p-[0.12em]">
          <div className="grid h-full w-full place-items-center rounded-full bg-ink-3 text-[0.8em] font-bold text-fog">AK</div>
        </div>
        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-[0.25em] text-[0.82em] font-semibold text-fog">
            @aanya.creates <BadgeCheck className="h-[1em] w-[1em] text-info" />
          </div>
          <div className="truncate text-[0.68em] text-mute">Lifestyle · ’27 batch</div>
        </div>
        <InstagramIcon className="ml-auto h-[1em] w-[1em] shrink-0 text-mute" />
      </div>
      <div className="mt-[0.75em] grid grid-cols-2 gap-[0.4em]">
        <Metric label="Followers" value="48.2K" />
        <Metric label="Avg. ER" value="6.4%" tone="text-ok" />
      </div>
      <svg viewBox="0 0 120 28" className="mt-[0.6em] h-[1.8em] w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#FF6A1A" stopOpacity="0.35" />
            <stop offset="1" stopColor="#FF6A1A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 22 L12 19 L24 21 L36 15 L48 17 L60 11 L72 13 L84 8 L96 10 L108 4 L120 5 L120 28 L0 28 Z" fill="url(#spark-fill)" />
        <path d="M0 22 L12 19 L24 21 L36 15 L48 17 L60 11 L72 13 L84 8 L96 10 L108 4 L120 5" fill="none" stroke="#FF8A3D" strokeWidth="1.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function EventCard() {
  return (
    <div className={clsx(surface, "w-[12.5em] p-[0.85em]")}>
      <div className="flex items-center gap-[0.6em]">
        <div className="grid h-[2.4em] w-[2.4em] shrink-0 place-items-center rounded-[0.7em] bg-gold/15 text-gold">
          <Mic className="h-[1.2em] w-[1.2em]" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="text-[0.82em] font-semibold text-fog">Rohan M.</div>
          <div className="text-[0.68em] text-mute">Host &amp; emcee · Mumbai</div>
        </div>
      </div>
      <div className="mt-[0.7em] flex items-center justify-between">
        <span className="rounded-full border border-gold/50 bg-gold/10 px-[0.6em] py-[0.15em] text-[0.66em] font-semibold text-gold">Gold rank</span>
        <span className="flex items-center gap-[0.25em] text-[0.72em] font-semibold text-fog">
          <Star className="h-[1em] w-[1em] fill-gold text-gold" /> 4.9
        </span>
      </div>
      <div className="mt-[0.6em] flex flex-wrap gap-[0.3em]">
        {["English", "Hindi", "College fests"].map((t) => (
          <span key={t} className="rounded-full border border-line px-[0.55em] py-[0.1em] text-[0.62em] text-mute">{t}</span>
        ))}
      </div>
    </div>
  );
}

function BriefCard() {
  return (
    <div className={clsx(surface, "w-[13.5em] p-[0.85em]")}>
      <div className="flex items-center justify-between">
        <span className="text-[0.62em] font-semibold uppercase tracking-[0.14em] text-brand">New brief</span>
        <span className="flex items-center gap-[0.3em] text-[0.62em] text-mute">
          <span className="h-[0.45em] w-[0.45em] rounded-full bg-ok" /> Matching
        </span>
      </div>
      <div className="mt-[0.35em] text-[0.86em] font-semibold text-fog">Café menu launch</div>
      <div className="text-[0.68em] text-mute">Pune + Mumbai · Reels + stories</div>
      <div className="mt-[0.7em] h-[0.4em] w-full overflow-hidden rounded-full bg-ink-4">
        <div className="h-full w-[80%] origin-left rounded-full bg-gradient-to-r from-brand to-brand-2" />
      </div>
      <div className="mt-[0.5em] flex items-center justify-between">
        <div className="flex -space-x-[0.4em]">
          {["bg-brand-2", "bg-info", "bg-gold", "bg-ok"].map((c) => (
            <span key={c} className={clsx("h-[1.4em] w-[1.4em] rounded-full border-[0.12em] border-ink-2", c)} />
          ))}
        </div>
        <span className="text-[0.68em] text-mute"><span className="font-semibold text-fog">32</span> / 40 matched</span>
      </div>
    </div>
  );
}

function Toast({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className={clsx(surface, "flex items-center gap-[0.6em] px-[0.8em] py-[0.6em]")}>
      <span className="grid h-[2em] w-[2em] shrink-0 place-items-center rounded-full bg-white/5">{icon}</span>
      <span className="leading-tight">
        <span className="block whitespace-nowrap text-[0.76em] font-semibold text-fog">{title}</span>
        <span className="block whitespace-nowrap text-[0.64em] text-mute">{sub}</span>
      </span>
    </div>
  );
}

function Metric({ label, value, tone = "text-fog" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[0.6em] bg-ink-3 px-[0.55em] py-[0.4em]">
      <div className="text-[0.6em] uppercase tracking-wider text-mute">{label}</div>
      <div className={clsx("text-[0.95em] font-bold tabular-nums", tone)}>{value}</div>
    </div>
  );
}
