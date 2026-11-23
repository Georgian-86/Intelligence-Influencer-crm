"use client";

import { useOptimistic, useState, useTransition } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Hand, LoaderCircle } from "lucide-react";
import { clsx } from "clsx";
import { markInterested } from "@/app/dashboard/actions";

/** One-tap "I'm interested" with optimistic UI; reverts with an inline error if the server says no. */
export function InterestButton({ briefId, applied, size = "md", className, block = false }: { briefId: string; applied: boolean; size?: "md" | "lg"; className?: string; block?: boolean }) {
  const reduce = useReducedMotion();
  const [optimistic, setOptimistic] = useOptimistic(applied);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const click = () => {
    setError(null);
    start(async () => {
      setOptimistic(true);
      const r = await markInterested(briefId);
      if (!r.ok) setError(r.error);
      else { setToast(r.message ?? "Sent"); setTimeout(() => setToast(null), 3200); }
    });
  };

  return (
    <div className={clsx("relative", block && "w-full", className)}>
      {optimistic ? (
        <motion.span initial={reduce ? false : { scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className={clsx("inline-flex items-center justify-center gap-2 rounded-[10px] bg-ok-bg font-semibold text-ok", size === "lg" ? "h-11 px-5 text-[14px]" : "h-[38px] px-3.5 text-[13.5px]", block && "w-full")}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={2.6} />}
          {pending ? "Sending" : "Interested"}
        </motion.span>
      ) : (
        <button type="button" onClick={click} className={clsx(size === "lg" ? "btn-primary btn-lg" : "btn-ghost", block && "w-full")}>
          I&apos;m interested
        </button>
      )}
      <span aria-live="polite" className="sr-only">{toast ?? ""}</span>
      {error && <p role="alert" className="mt-2 text-[12.5px] font-medium text-bad">{error}</p>}
    </div>
  );
}
