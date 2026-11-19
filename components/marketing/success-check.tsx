"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";

/** Success badge: halo + check pop in with scale/opacity only. */
export function SuccessCheck() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  // After the server-action redirect the browser keeps its scroll position (often at the footer on
  // mobile), so bring the confirmation into view.
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 64 || r.bottom > window.innerHeight) el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [reduce]);
  return (
    <div ref={ref} className="relative grid h-20 w-20 place-items-center" aria-hidden="true">
      <motion.span
        className="absolute inset-0 rounded-full bg-ok/15"
        initial={reduce ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <motion.span
        className="absolute inset-2 rounded-full border border-ok/40 bg-ok/10"
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1], delay: 0.08 }}
      />
      <motion.span
        className="relative text-ok"
        initial={reduce ? false : { scale: 0.3, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={reduce ? { duration: 0.1 } : { type: "spring", stiffness: 500, damping: 22, delay: 0.18 }}
      >
        <Check className="h-9 w-9" strokeWidth={2.5} />
      </motion.span>
    </div>
  );
}
