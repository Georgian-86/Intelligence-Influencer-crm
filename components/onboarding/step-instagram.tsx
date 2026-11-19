"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AtSign, Check, LoaderCircle, Pencil, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { InstagramIcon } from "@/components/brand/icons";
import { CITIES, INFLUENCER_NICHES } from "@/lib/constants";
import type { Draft } from "./types";

export type FetchPhase = "input" | "fetching" | "review" | "error";

const TICKS = ["Finding your account", "Reading your recent posts", "Working out engagement", "Spotting your niche and city"];

/** Step 1 — "What's your Instagram?" with a choreographed fetch and a one-tap confirm. */
export function StepInstagram({
  d, set, phase, error, errorCode, onFetch, onRetry, onManual, editing, setEditing,
}: {
  d: Draft;
  set: (p: Partial<Draft>) => void;
  phase: FetchPhase;
  error: string | null;
  errorCode: string | null;
  onFetch: () => void;
  onRetry: () => void;
  onManual: () => void;
  editing: boolean;
  setEditing: (v: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (phase !== "fetching") { setTick(phase === "review" ? TICKS.length : 0); return; }
    setTick(0);
    const t = setInterval(() => setTick((v) => Math.min(TICKS.length - 1, v + 1)), 380);
    return () => clearInterval(t);
  }, [phase]);

  const showInput = phase === "input" || phase === "error";
  const p = d.preview;

  return (
    <div>
      <h1 className="font-display text-[34px] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[42px]">
        {phase === "review" ? (d.manual ? "Tell us who you are." : "Looks right?") : "What's your Instagram?"}
      </h1>
      <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">
        {phase === "review"
          ? d.manual ? "Just your name and city for now. Connect Instagram later from your dashboard." : `We found @${p?.handle}. Check the details we picked up, then confirm.`
          : "Drop your handle. We'll fetch your followers, engagement and best posts so you don't type a thing."}
      </p>

      {showInput && (
        <div className="mt-7">
          <label htmlFor="ig" className="label">Instagram handle</label>
          <div className={clsx("flex h-14 items-center gap-2 rounded-[16px] border bg-surface pl-3 pr-1.5 shadow-xs transition-[border-color,box-shadow] focus-within:border-cobalt focus-within:ring-4 focus-within:ring-cobalt/12",
            error ? "border-bad" : "border-line")}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[radial-gradient(circle_at_30%_110%,#ffd776,#f3a536_25%,#e1306c_55%,#833ab4)] text-white">
              <InstagramIcon className="h-[18px] w-[18px]" />
            </span>
            <AtSign className="h-4 w-4 shrink-0 text-mute" aria-hidden />
            <input id="ig" ref={inputRef} autoFocus value={d.handle} autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="off" enterKeyHint="go"
              placeholder="yourhandle" aria-invalid={!!error} aria-describedby={error ? "ig-error" : "ig-hint"}
              onChange={(e) => set({ handle: e.target.value.replace(/^@/, "").replace(/\s/g, "") })}
              className="h-full min-w-0 flex-1 bg-transparent text-[17px] font-medium outline-none placeholder:font-normal placeholder:text-faint" />
          </div>
          {error ? (
            <div id="ig-error" role="alert" className="mt-2.5 rounded-[14px] bg-bad-bg px-3.5 py-3 text-[13.5px] text-bad">
              <p className="font-medium">{error}</p>
              {errorCode && errorCode !== "invalid" && (
                <button type="button" onClick={onManual} className="mt-1.5 inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-4">
                  Continue without stats
                </button>
              )}
            </div>
          ) : (
            <p id="ig-hint" className="mt-2 text-[12.5px] text-mute">Public data only. We never post or DM from your account. Paste a profile link if that&apos;s easier.</p>
          )}
          <button type="button" onClick={onManual} className="mt-4 inline-flex min-h-11 items-center text-[14px] font-medium text-mute underline-offset-4 hover:text-ink hover:underline">
            I don&apos;t use Instagram for work
          </button>
        </div>
      )}

      {phase === "fetching" && (
        <ul className="mt-7 space-y-3" aria-live="polite">
          {TICKS.map((t, i) => (
            <motion.li key={t} className="flex items-center gap-3 text-[15px]"
              initial={reduce ? false : { opacity: 0, x: -6 }} animate={{ opacity: i <= tick ? 1 : 0.35, x: 0 }} transition={{ duration: 0.3, delay: reduce ? 0 : i * 0.05 }}>
              <span className={clsx("grid h-7 w-7 place-items-center rounded-full transition-colors duration-300", i < tick ? "bg-ok text-white" : "bg-cobalt-50 text-cobalt")}>
                {i < tick ? <Check className="h-4 w-4" strokeWidth={2.6} /> : i === tick ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>
              <span className={i <= tick ? "text-ink" : "text-mute"}>{i === 0 ? `Finding @${d.handle}` : t}</span>
            </motion.li>
          ))}
        </ul>
      )}

      {phase === "review" && (
        <div className="mt-7 space-y-5">
          <AnimatePresence initial={false} mode="wait">
            {editing || d.manual ? (
              <motion.div key="edit" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 rounded-[20px] border border-line bg-surface p-4 shadow-sm sm:p-5">
                <div>
                  <label htmlFor="name" className="label">Your name</label>
                  <input id="name" className="input h-12 text-[16px]" autoComplete="name" value={d.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder="First and last name" />
                </div>
                <div>
                  <span className="label" id="city-l">City</span>
                  <ChipRow labelledBy="city-l" options={[...CITIES]} value={d.city ? [d.city] : []} single onChange={(v) => set({ city: v[0] ?? null })} />
                </div>
                <div>
                  <span className="label" id="niche-l">What you create <span className="font-normal text-mute">(pick up to 4)</span></span>
                  <ChipRow labelledBy="niche-l" options={[...INFLUENCER_NICHES].slice(0, 14)} value={d.niches} max={4} onChange={(v) => set({ niches: v })} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="summary" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-[20px] border border-line bg-surface p-4 shadow-sm sm:p-5">
                <div className="text-[13px] font-semibold text-mute">We picked up</div>
                <dl className="mt-3 grid gap-3 text-[14.5px]">
                  <Row k="Name" v={d.fullName || "—"} />
                  <Row k="City" v={d.city ?? "Not in your bio — add it"} muted={!d.city} />
                  <Row k="Niche" v={d.niches.length ? d.niches.join(", ") : "Not sure yet — add one"} muted={!d.niches.length} />
                  <Row k="Language" v={d.languages.join(", ") || "English"} />
                </dl>
                <button type="button" onClick={() => setEditing(true)} className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-cobalt hover:underline">
                  <Pencil className="h-3.5 w-3.5" /> Edit details
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {!d.manual && (
            <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-medium text-mute hover:text-ink">
              <RotateCcw className="h-3.5 w-3.5" /> Not you? Try another handle
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
      <dt className="text-mute">{k}</dt>
      <dd className={clsx("text-right font-medium", muted && "font-normal text-mute")}>{v}</dd>
    </div>
  );
}

export function ChipRow({ options, value, onChange, single, max, labelledBy }: { options: string[]; value: string[]; onChange: (v: string[]) => void; single?: boolean; max?: number; labelledBy?: string }) {
  return (
    <div role={single ? "radiogroup" : "group"} aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" role={single ? "radio" : "checkbox"} aria-checked={on}
            onClick={() => onChange(single ? (on ? [] : [o]) : on ? value.filter((x) => x !== o) : max && value.length >= max ? value : [...value, o])}
            className={clsx("inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[14px] font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]",
              on ? "border-cobalt bg-cobalt text-white" : "border-line bg-surface text-ink-2 hover:border-line-2")}>
            {on && <Check className="h-3.5 w-3.5" strokeWidth={2.6} />}{o}
          </button>
        );
      })}
    </div>
  );
}
