"use client";

import { Camera, Check, Clapperboard, GraduationCap, Mic } from "lucide-react";
import { clsx } from "clsx";
import { WhatsAppIcon } from "@/components/brand/icons";
import { INTERESTS, type Draft } from "./types";

const ICONS = { Clapperboard, GraduationCap, Mic, Camera } as const;

/** Step 3 — "What do you want to do?" multi-select + optional WhatsApp alerts. */
export function StepGoals({ d, set, error, phoneFromAuth }: { d: Draft; set: (p: Partial<Draft>) => void; error: string | null; phoneFromAuth: boolean }) {
  const toggle = (k: string) => set({ interests: d.interests.includes(k) ? d.interests.filter((x) => x !== k) : [...d.interests, k] });
  const digits = d.whatsapp.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  return (
    <div>
      <h1 className="font-display text-[34px] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[42px]">What do you want to do?</h1>
      <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">Pick as many as you like. We only send you briefs for these.</p>

      <div role="group" aria-label="What you want to do" className="mt-7 grid gap-3 sm:grid-cols-2">
        {INTERESTS.map((it) => {
          const on = d.interests.includes(it.key);
          const Icon = ICONS[it.icon];
          return (
            <button key={it.key} type="button" role="checkbox" aria-checked={on} onClick={() => toggle(it.key)}
              className={clsx("relative flex min-h-[76px] items-center gap-3.5 rounded-[20px] border-2 p-4 text-left transition-[border-color,background-color,transform] duration-200 ease-out-expo active:scale-[0.98]",
                on ? "border-cobalt bg-cobalt-50" : "border-line bg-surface hover:border-line-2")}>
              <span className={clsx("grid h-11 w-11 shrink-0 place-items-center rounded-[14px] transition-colors", on ? "bg-cobalt text-white" : "bg-canvas text-ink-2")}><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1 pr-6">
                <span className="block text-[15.5px] font-semibold leading-tight">{it.key}</span>
                <span className="mt-0.5 block text-[13px] text-mute">{it.sub}</span>
              </span>
              <span className={clsx("absolute right-4 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-[8px] border-2 transition-colors", on ? "border-cobalt bg-cobalt text-white" : "border-line-2")}>
                {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-7 rounded-[22px] border border-line bg-surface p-4 shadow-sm sm:p-5">
        <label htmlFor="wa" className="flex items-center gap-2 text-[14px] font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e7f8ee] text-[#128c4a]"><WhatsAppIcon className="h-4 w-4" /></span>
          WhatsApp number <span className="font-normal text-mute">(optional)</span>
        </label>
        <div className="mt-3 flex h-12 items-center overflow-hidden rounded-[14px] border border-line bg-surface shadow-xs focus-within:border-cobalt focus-within:ring-4 focus-within:ring-cobalt/12">
          <span className="flex h-full items-center border-r border-line bg-canvas px-3 text-[15px] font-semibold text-ink-2">+91</span>
          <input id="wa" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" value={digits}
            onChange={(e) => { const v = e.target.value.replace(/[^\d ]/g, "").slice(0, 11); set({ whatsapp: v, whatsappAlerts: v ? d.whatsappAlerts || !d.whatsapp : false }); }}
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-[16px] tabular-nums outline-none placeholder:text-faint" />
        </div>
        {phoneFromAuth && <p className="mt-1.5 text-[12.5px] text-mute">From your sign-in. Change it if you use another number for WhatsApp.</p>}
        <div className="mt-4 flex items-center justify-between gap-4">
          <span id="wa-alerts-l" className="text-[14px]">
            <span className="block font-medium">Send me matching briefs on WhatsApp</span>
            <span className="block text-[12.5px] text-mute">At most 2 a week. Reply STOP anytime.</span>
          </span>
          <button type="button" role="switch" aria-checked={d.whatsappAlerts} aria-labelledby="wa-alerts-l" disabled={!digits}
            onClick={() => set({ whatsappAlerts: !d.whatsappAlerts })}
            className={clsx("relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40 before:absolute before:-inset-2 before:content-['']", d.whatsappAlerts ? "bg-cobalt" : "bg-line-2")}>
            <span className={clsx("absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out-expo", d.whatsappAlerts && "translate-x-5")} />
          </button>
        </div>
      </div>
      {error && <p role="alert" className="mt-4 rounded-[14px] bg-bad-bg px-3.5 py-2.5 text-[13.5px] font-medium text-bad">{error}</p>}
    </div>
  );
}
