"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BadgeCheck, GraduationCap } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Avatar } from "@/components/kit";

export type ShowcaseCreator = { name: string; handle: string; college: string; followers: string; gig: string; fee: string; hue: number };

const EASE = [0.16, 1, 0.3, 1] as const;

/** Night band beside the auth form: rocket trail + a rotating stack of matched-creator cards. */
export function BrandPanel({ creators }: { creators: ShowcaseCreator[] }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((v) => (v + 1) % creators.length), 3200);
    return () => clearInterval(t);
  }, [reduce, creators.length]);
  const order = [0, 1, 2].map((k) => creators[(i + k) % creators.length]);

  return (
    <div className="grain relative isolate flex h-full min-h-[640px] flex-col overflow-hidden rounded-[36px] bg-night px-10 pb-10 pt-12 text-white xl:px-14">
      {/* light */}
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,rgb(43_75_255/.55),transparent)]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 -left-24 -z-10 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,rgb(195_181_255/.28),transparent)]" />

      {/* rocket trail */}
      <div aria-hidden className="pointer-events-none absolute right-[24%] bottom-[24%] -z-10 h-[44%] w-24 origin-bottom rotate-[28deg]">
        <motion.div
          className="absolute inset-x-[42%] bottom-0 top-16 rounded-full bg-gradient-to-t from-transparent via-cobalt-400/50 to-ice/90"
          initial={reduce ? false : { scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }} style={{ transformOrigin: "bottom" }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.2 }} />
        <motion.div className="absolute inset-x-[30%] bottom-0 top-32 rounded-full bg-gradient-to-t from-transparent to-cobalt/30 blur-xl"
          initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6, delay: 0.4 }} />
        {!reduce && Array.from({ length: 7 }).map((_, k) => (
          <motion.span key={k} className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-ice"
            style={{ bottom: `${8 + k * 11}%`, marginLeft: (k % 2 ? 1 : -1) * (6 + k * 1.5) }}
            animate={{ y: [0, -40], opacity: [0, 0.8, 0] }} transition={{ duration: 2.6, repeat: Infinity, delay: k * 0.37, ease: "easeOut" }} />
        ))}
        <motion.div className="absolute left-1/2 top-0 -translate-x-1/2 -rotate-[28deg]"
          initial={reduce ? false : { y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.3, ease: EASE, delay: 0.1 }}>
          <div className={reduce ? "" : "animate-float"}><LogoMark tone="light" className="h-20 w-20 drop-shadow-[0_0_24px_rgb(220_229_255/.6)]" /></div>
        </motion.div>
      </div>

      <h2 className="max-w-[15ch] font-display text-[44px] font-bold leading-[1.02] tracking-[-0.045em] xl:text-[54px]">
        Brands come to campus. <span className="font-serif italic font-normal text-ice">You get the brief.</span>
      </h2>
      <p className="mt-4 max-w-[38ch] text-[15px] leading-relaxed text-white/70">
        Vigor runs youth campaigns for India&apos;s biggest consumer brands. One profile puts you in the room for every one of them.
      </p>

      {/* rotating cards */}
      <div className="relative mt-auto h-[220px] max-w-[400px]" aria-hidden>
        <AnimatePresence initial={false}>
          {order.slice().reverse().map((c, k) => {
            const depth = 2 - k; // 0 = front
            return (
              <motion.div key={c.handle}
                className="absolute inset-x-0 bottom-0 rounded-[22px] border border-white/12 bg-white/[0.07] p-4 backdrop-blur-xl"
                initial={reduce ? false : { opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: depth === 0 ? 1 : depth === 1 ? 0.55 : 0.25, y: -depth * 22, scale: 1 - depth * 0.05 }}
                exit={{ opacity: 0, y: 30, scale: 1.02, transition: { duration: 0.35 } }}
                transition={{ duration: 0.6, ease: EASE }} style={{ zIndex: 3 - depth }}>
                <div className={depth ? "invisible" : undefined}><div className="flex items-center gap-3">
                  <Avatar name={c.name} hue={c.hue} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[15px] font-semibold">{c.name}<BadgeCheck className="h-4 w-4 text-ice" /></div>
                    <div className="flex items-center gap-1.5 text-[12.5px] text-white/60"><GraduationCap className="h-3.5 w-3.5" />{c.college}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-[18px] font-bold tabular-nums">{c.followers}</div>
                    <div className="text-[11px] text-white/55">followers</div>
                  </div>
                </div>
                <div className="mt-3.5 flex items-center justify-between rounded-[14px] bg-white/[0.08] px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-[13px]">
                    <span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-ping rounded-full bg-flame/70" /><span className="relative h-2 w-2 rounded-full bg-flame" /></span>
                    Matched: {c.gig}
                  </span>
                  <span className="font-display text-[15px] font-semibold tabular-nums">{c.fee}</span>
                </div>
              </div></motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <ol className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-[13px] text-white/70">
        {["Sign in", "Drop your Instagram", "Get matched to briefs"].map((s, k) => (
          <li key={s} className="flex items-start gap-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/20 font-display text-[12px] font-semibold text-white">{k + 1}</span>
            <span className="pt-0.5 leading-snug">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
