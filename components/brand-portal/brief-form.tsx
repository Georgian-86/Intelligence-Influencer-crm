"use client";

import { useActionState, useState } from "react";
import { clsx } from "clsx";
import { Check, LoaderCircle, Send } from "lucide-react";
import { submitBrief, type BriefState } from "@/app/brand/actions";

const GOALS = ["Awareness on campus", "Sampling / trial", "Footfall to stores", "App installs or orders", "UGC content library"];
const BUDGETS = ["Under ₹5L", "₹5–10L", "₹10–25L", "₹25L+"];
const PLACES = ["Mumbai", "Pune", "Delhi", "Bangalore", "Hyderabad", "Top 20 campuses"];

export function BriefForm() {
  const [state, action, pending] = useActionState<BriefState, FormData>(submitBrief, null);
  const [goal, setGoal] = useState("");
  const [budget, setBudget] = useState("");
  const [where, setWhere] = useState("");

  if (state?.ok) {
    return (
      <div className="card p-8 text-center" role="status">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok-bg text-ok"><Check className="h-7 w-7" strokeWidth={2.6} /></div>
        <h2 className="mt-4 text-[22px] font-bold">Brief received</h2>
        <p className="mx-auto mt-2 max-w-md text-[14.5px] text-mute">Kunal will send a plan with creator mix, estimated reach and cost within 4 working hours.</p>
        <p className="mx-auto mt-4 max-w-md rounded-[14px] bg-canvas px-4 py-3 text-[13px] text-ink-2">{state.summary}</p>
      </div>
    );
  }

  const addPlace = (p: string) => setWhere((w) => (w.split(",").map((s) => s.trim()).includes(p) ? w : w ? `${w}, ${p}` : p));

  return (
    <form action={action} className="card space-y-8 p-6 sm:p-8">
      <fieldset>
        <legend className="text-[15px] font-semibold">1. What should this campaign do?</legend>
        <input type="hidden" name="goal" value={goal} />
        <div className="mt-3 flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button type="button" key={g} aria-pressed={goal === g} onClick={() => setGoal(g)}
              className={clsx("inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[14px] font-medium transition-colors",
                goal === g ? "border-cobalt bg-cobalt-50 text-cobalt-700" : "border-line bg-surface text-ink-2 hover:border-line-2")}>
              {goal === g && <Check className="h-4 w-4" strokeWidth={2.6} />}{g}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="where" className="text-[15px] font-semibold">2. Which cities or campuses?</label>
        <input id="where" name="where" value={where} onChange={(e) => setWhere(e.target.value)} className="input mt-3" placeholder="e.g. Mumbai and Pune, NMIMS, Symbiosis" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PLACES.map((p) => <button type="button" key={p} onClick={() => addPlace(p)} className="chip h-7 px-3 hover:border-line-2">+ {p}</button>)}
        </div>
      </div>

      <fieldset>
        <legend className="text-[15px] font-semibold">3. Budget range</legend>
        <input type="hidden" name="budget" value={budget} />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BUDGETS.map((b) => (
            <button type="button" key={b} aria-pressed={budget === b} onClick={() => setBudget(b)}
              className={clsx("h-12 rounded-[14px] border text-[14px] font-semibold tabular-nums transition-colors",
                budget === b ? "border-cobalt bg-cobalt-50 text-cobalt-700" : "border-line bg-surface text-ink-2 hover:border-line-2")}>{b}</button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[15px] font-semibold">4. Dates</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="label">Start</span><input type="date" name="start" className="input" min="2026-11-19" /></label>
          <label className="block"><span className="label">End (optional)</span><input type="date" name="end" className="input" min="2026-11-19" /></label>
        </div>
      </fieldset>

      {state?.error && <p role="alert" className="rounded-[12px] bg-bad-bg px-3.5 py-2.5 text-[14px] text-bad">{state.error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <p className="text-[13px] text-mute">That&apos;s all we need. We&apos;ll ask the rest on a call.</p>
        <button className="btn-primary btn-lg" disabled={pending}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send brief
        </button>
      </div>
    </form>
  );
}
