"use client";

import { motion, useInView, useReducedMotion, animate } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const EASE = [0.2, 0.8, 0.2, 1] as const;

/** Fade + rise into view once. Renders final state under reduced motion. */
export function Reveal({ children, delay = 0, y = 12, className, as = "div" }: {
  children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "section" | "li" | "span";
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}

/** Children animate in sequence (30–60 ms stagger). */
export function Stagger({ children, className, gap = 0.05 }: { children: ReactNode; className?: string; gap?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated number that counts up when scrolled into view. Renders the real value on the server
 * (no "0" flash for crawlers, no-JS or slow hydration); only numbers that start below the fold animate.
 */
export function CountUp({ to, decimals = 0, suffix = "", prefix = "", className }: {
  to: number; decimals?: number; suffix?: string; prefix?: string; className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(to);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (reduce || !ref.current) return;
    if (ref.current.getBoundingClientRect().top > window.innerHeight) { setVal(0); setArmed(true); }
  }, [reduce]);
  useEffect(() => {
    if (!armed || !inView) return;
    const c = animate(0, to, { duration: 0.9, ease: EASE, onUpdate: (v) => setVal(v) });
    return () => c.stop();
  }, [armed, inView, to]);
  useEffect(() => { if (!armed) setVal(to); }, [to, armed]);
  const text = val.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span ref={ref} className={className}>{prefix}{text}{suffix}</span>;
}
