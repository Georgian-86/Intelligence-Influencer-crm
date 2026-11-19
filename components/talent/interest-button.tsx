"use client";

import Link from "next/link";
import { useActionState, useOptimistic, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, Hand, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { quickInterest, type InterestState } from "@/app/dashboard/actions";

const EASE = [0.2, 0.8, 0.2, 1] as const;

function SentPill({ size, stage }: { size: "sm" | "lg"; stage?: string }) {
  return (
    <span className={clsx(
      "inline-flex items-center justify-center gap-1.5 rounded-xl border border-ok/40 bg-ok/10 font-semibold text-ok",
      size === "lg" ? "min-h-12 px-5 text-[15px]" : "min-h-11 px-4 text-sm",
    )}>
      <Check className="h-4 w-4" strokeWidth={2.75} aria-hidden />
      {stage ?? "You're in"}
    </span>
  );
}

/**
 * One-tap "I'm in" (PRD A5). Shows the success state immediately (optimistic), then reconciles with
 * the server result; reverts with an inline error if the insert fails.
 *
 * `alreadyLabel` renders the already-interested state (e.g. "Applied", "Shortlisted").
 * `withDetails` adds an optional note + fee disclosure (used on the brief detail page).
 */
export function InterestButton({
  briefId, alreadyLabel, size = "sm", withDetails = false, className,
}: {
  briefId: string;
  alreadyLabel?: string;
  size?: "sm" | "lg";
  withDetails?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [state, dispatch, pending] = useActionState<InterestState, FormData>(quickInterest, { status: "idle" });
  const [optimisticSent, setOptimisticSent] = useOptimistic(false, (_: boolean, v: boolean) => v);
  const [open, setOpen] = useState(false);

  const sent = !!alreadyLabel || state.status === "sent" || optimisticSent;

  if (alreadyLabel && state.status !== "sent") {
    return (
      <div className={className}>
        <SentPill size={size} stage={alreadyLabel} />
      </div>
    );
  }

  return (
    <div className={className}>
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="sent"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduce ? 0.1 : 0.25, ease: EASE }}
            className="space-y-1.5"
          >
            <SentPill size={size} />
            {size === "lg" && (
              <p className="text-sm text-mute" role="status">
                {pending ? "Sending to the Vigor team…" : <>Interest sent. Track it in <Link href="/dashboard/applications" className="font-medium text-brand-2 underline-offset-4 hover:underline">Applications</Link>.</>}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={false}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            action={(fd: FormData) => {
              setOptimisticSent(true);
              dispatch(fd);
            }}
            className="space-y-3"
          >
            <input type="hidden" name="brief_id" value={briefId} />
            {withDetails && (
              <div>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`details-${briefId}`}
                  onClick={() => setOpen((o) => !o)}
                  className="flex min-h-11 items-center gap-1.5 text-sm text-mute transition-colors hover:text-fog"
                >
                  <ChevronDown className={clsx("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
                  Add a note or your fee (optional)
                </button>
                <div id={`details-${briefId}`} hidden={!open} className="mt-2 grid gap-3 sm:grid-cols-[1fr_200px]">
                  <label className="block">
                    <span className="label">Note to the team</span>
                    <textarea name="message" rows={3} className="input" placeholder="Why you're a great fit, past work, availability…" />
                  </label>
                  <label className="block">
                    <span className="label">Expected fee (₹)</span>
                    <input name="quoted_rate" inputMode="numeric" autoComplete="off" className="input" placeholder="e.g. 8000" />
                  </label>
                </div>
              </div>
            )}
            <button
              className={clsx("btn-primary", size === "lg" ? "min-h-12 w-full px-6 text-[15px] sm:w-auto" : "min-h-11")}
              disabled={pending}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Hand className="h-4 w-4" aria-hidden />}
              I&apos;m in
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      {state.status === "error" && (
        <p role="alert" className="mt-2 text-sm text-bad">{state.message}</p>
      )}
    </div>
  );
}
