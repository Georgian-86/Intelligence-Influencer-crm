"use client";

import { useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Briefcase, Check, GraduationCap, Plus, Search, Sparkles, X } from "lucide-react";
import { clsx } from "clsx";
import { searchColleges } from "@/lib/colleges";
import { GRAD_YEARS, type Draft } from "./types";

/** Step 2 — "Are you in college right now?" Yes → college + graduation year. No → skip. */
export function StepCollege({ d, set, suggestion, error }: {
  d: Draft;
  set: (p: Partial<Draft>) => void;
  suggestion: { id: string; name: string; city: string; source: "email" | "bio" } | null;
  error: string | null;
}) {
  const reduce = useReducedMotion();
  return (
    <div>
      <h1 className="font-display text-[34px] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[42px]">Are you in college right now?</h1>
      <p className="mt-3 flex items-start gap-2 text-[15.5px] leading-relaxed text-ink-2">
        <Sparkles className="mt-1 h-4 w-4 shrink-0 text-cobalt" />
        Most of our brand campaigns are on campus. Students get first pick of fest, sampling and ambassador briefs.
      </p>

      <div role="radiogroup" aria-label="Are you in college?" className="mt-7 grid grid-cols-2 gap-3">
        {[
          { v: true, title: "Yes", sub: "I'm studying", Icon: GraduationCap },
          { v: false, title: "No", sub: "Not right now", Icon: Briefcase },
        ].map(({ v, title, sub, Icon }) => {
          const on = d.inCollege === v;
          return (
            <button key={title} type="button" role="radio" aria-checked={on}
              onClick={() => set(v ? { inCollege: true, college: d.college ?? (suggestion ? { id: suggestion.id, name: suggestion.name, city: suggestion.city } : null) } : { inCollege: false })}
              className={clsx("group relative flex min-h-[132px] flex-col items-start justify-between rounded-[22px] border-2 p-4 text-left transition-[border-color,background-color,transform,box-shadow] duration-200 ease-out-expo active:scale-[0.98] sm:p-5",
                on ? "border-cobalt bg-cobalt-50 shadow-[0_0_0_4px_rgb(43_75_255/.12)]" : "border-line bg-surface hover:border-line-2 hover:shadow-sm")}>
              <span className={clsx("grid h-11 w-11 place-items-center rounded-full transition-colors", on ? "bg-cobalt text-white" : "bg-canvas text-ink-2")}><Icon className="h-5 w-5" /></span>
              <span>
                <span className="block font-display text-[22px] font-bold tracking-[-0.03em]">{title}</span>
                <span className="block text-[13.5px] text-mute">{sub}</span>
              </span>
              <span className={clsx("absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full border-2 transition-colors", on ? "border-cobalt bg-cobalt text-white" : "border-line-2")}>
                {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {d.inCollege && (
          <motion.div key="college" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 space-y-6">
            <CollegePicker d={d} set={set} suggestion={suggestion} />
            <div>
              <span id="grad-l" className="label">Graduating in</span>
              <div role="radiogroup" aria-labelledby="grad-l" className="grid grid-cols-5 gap-2">
                {GRAD_YEARS.map((y) => {
                  const on = d.gradYear === y;
                  return (
                    <button key={y} type="button" role="radio" aria-checked={on} onClick={() => set({ gradYear: y })}
                      className={clsx("h-12 rounded-full border text-[15px] font-semibold tabular-nums transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96]",
                        on ? "border-cobalt bg-cobalt text-white" : "border-line bg-surface text-ink-2 hover:border-line-2")}>
                      {y}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {d.inCollege === false && (
        <p className="mt-5 rounded-[16px] bg-canvas-2/70 px-4 py-3 text-[14px] text-ink-2" role="status">
          No problem — you&apos;ll still see city and online briefs. You can add a college later.
        </p>
      )}
      {error && <p role="alert" className="mt-4 rounded-[14px] bg-bad-bg px-3.5 py-2.5 text-[13.5px] font-medium text-bad">{error}</p>}
    </div>
  );
}

function CollegePicker({ d, set, suggestion }: { d: Draft; set: (p: Partial<Draft>) => void; suggestion: { id: string; name: string; city: string; source: "email" | "bio" } | null }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchColleges(q, d.city, 6), [q, d.city]);
  const options = [...results.map((c) => ({ id: c.id, name: c.name, city: c.city, custom: false })), ...(q.trim().length > 2 ? [{ id: "custom", name: q.trim(), city: d.city ?? "", custom: true }] : [])];

  const choose = (o: (typeof options)[number]) => {
    set({ college: { id: o.custom ? null : o.id, name: o.name, city: o.city || d.city } });
    setQ(""); setOpen(false);
  };

  if (d.college) {
    return (
      <div>
        <span className="label">Your college</span>
        <div className="flex items-center gap-3 rounded-[16px] border border-cobalt/40 bg-surface p-3 pl-4 shadow-xs">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cobalt-50 text-cobalt"><GraduationCap className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold">{d.college.name}</div>
            <div className="text-[12.5px] text-mute">{d.college.city}{d.college.id === null ? " · added by you" : ""}</div>
          </div>
          <button type="button" onClick={() => { set({ college: null }); setTimeout(() => inputRef.current?.focus(), 30); }}
            className="inline-flex h-11 items-center gap-1 rounded-full px-3 text-[13.5px] font-semibold text-cobalt hover:bg-cobalt-50">
            <X className="h-4 w-4" /> Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label htmlFor="college" className="label">Your college</label>
      {suggestion && !q && (
        <button type="button" onClick={() => choose({ id: suggestion.id, name: suggestion.name, city: suggestion.city, custom: false })}
          className="mb-2.5 flex w-full items-center gap-3 rounded-[16px] border border-dashed border-cobalt/50 bg-cobalt-50/60 p-3 text-left transition-colors hover:bg-cobalt-50">
          <Sparkles className="h-4 w-4 shrink-0 text-cobalt" />
          <span className="min-w-0 flex-1 text-[14px]">
            <span className="font-semibold">{suggestion.name}?</span>
            <span className="block text-[12.5px] text-mute">Suggested from your {suggestion.source === "email" ? "email" : "Instagram bio"}</span>
          </span>
          <span className="rounded-full bg-cobalt px-3 py-1.5 text-[12.5px] font-semibold text-white">Use this</span>
        </button>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
        <input id="college" ref={inputRef} role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
          value={q} placeholder={d.city ? `Search colleges in ${d.city}` : "Search your college"} autoComplete="off"
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            if (e.key === "Enter" && open && options[active] && q) { e.preventDefault(); choose(options[active]); }
            if (e.key === "Escape") setOpen(false);
          }}
          className="input h-13 pl-11 text-[16px]" />
      </div>
      {open && options.length > 0 && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-[18px] border border-line bg-surface p-1.5 shadow-lg">
          {options.map((o, i) => (
            <li key={o.id + o.name} id={`${listId}-${i}`} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); choose(o); }} onMouseEnter={() => setActive(i)}
              className={clsx("flex min-h-12 cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2", i === active && "bg-cobalt-50")}>
              {o.custom ? <Plus className="h-4 w-4 shrink-0 text-cobalt" /> : <GraduationCap className="h-4 w-4 shrink-0 text-mute" />}
              <span className="min-w-0 flex-1">
                <span className={clsx("block truncate text-[14.5px]", o.custom ? "font-semibold text-cobalt" : "font-medium")}>{o.custom ? `Can't find it? Add “${o.name}”` : o.name}</span>
                {!o.custom && <span className="block text-[12px] text-mute">{o.city}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[12.5px] text-mute">{d.city ? `Showing ${d.city} first.` : "Type a few letters, e.g. Xavier's or SRCC."} Can&apos;t find yours? Type its full name and add it.</p>
    </div>
  );
}
