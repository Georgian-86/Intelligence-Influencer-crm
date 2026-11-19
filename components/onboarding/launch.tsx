"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

const EASE = [0.16, 1, 0.3, 1] as const;
const SPARKS = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2 + (i % 3) * 0.2;
  const r = 120 + (i % 5) * 34;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.7 - 40, c: ["#7cf3d6", "#c3b5ff", "#dce5ff", "#ff6b4a", "#5e78ff"][i % 5], s: 6 + (i % 3) * 3, d: 0.9 + (i % 4) * 0.05 };
});

/** Milestone moment after onboarding: the rocket lifts off, sparks burst, then we hand over to the dashboard. */
export function Launch({ firstName, openBriefs, onDone }: { firstName: string; openBriefs: number; onDone: () => void }) {
  const reduce = useReducedMotion();
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    btn.current?.focus();
    const t = setTimeout(onDone, reduce ? 1800 : 3400);
    return () => clearTimeout(t);
  }, [onDone, reduce]);

  return (
    <motion.div role="dialog" aria-modal aria-labelledby="launch-title" className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-night px-6 text-center text-white"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0.1 : 0.35 }}>
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(43_75_255/.5),transparent)]" />
      <div className="relative">
        <div aria-hidden className="relative mx-auto h-56 w-40">
          {/* trail */}
          {!reduce && (
            <motion.div className="absolute bottom-0 left-1/2 h-64 w-3 -translate-x-1/2 rounded-full bg-gradient-to-t from-transparent via-cobalt-400/70 to-ice"
              style={{ transformOrigin: "bottom" }} initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: [0, 1, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 1.6, ease: EASE, delay: 0.25, times: [0, 0.5, 1] }} />
          )}
          <motion.div className="absolute left-1/2 top-6 -translate-x-1/2"
            initial={reduce ? false : { y: 220, opacity: 0 }} animate={{ y: [220, -12, 0], opacity: 1 }}
            transition={{ duration: 1.3, ease: EASE, delay: 0.15 }}>
            <LogoMark tone="light" className="h-28 w-28 drop-shadow-[0_0_40px_rgb(220_229_255/.6)]" />
          </motion.div>
          {!reduce && SPARKS.map((s, i) => (
            <motion.span key={i} className="absolute left-1/2 top-1/2 rounded-full" style={{ width: s.s, height: s.s, background: s.c, marginLeft: -s.s / 2, marginTop: -s.s / 2 }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }} animate={{ x: s.x, y: s.y, opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
              transition={{ duration: s.d + 0.4, ease: EASE, delay: 0.95 }} />
          ))}
        </div>
        <motion.h2 id="launch-title" className="mt-6 font-display text-[44px] font-bold leading-none tracking-[-0.045em] sm:text-[60px]"
          initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 1 }}>
          You&apos;re live, <span className="font-serif font-normal italic text-ice">{firstName}.</span>
        </motion.h2>
        <motion.p className="mx-auto mt-4 max-w-sm text-[16px] text-white/70" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.5 }}>
          {openBriefs > 0 ? `We're matching you to ${openBriefs} open briefs right now.` : "We're matching you to open briefs right now."}
        </motion.p>
        <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.35, duration: 0.5, ease: EASE }}>
          <button ref={btn} type="button" onClick={onDone} className="btn-flame btn-lg mt-8">See my matches <ArrowRight className="h-4 w-4" /></button>
        </motion.div>
      </div>
    </motion.div>
  );
}
