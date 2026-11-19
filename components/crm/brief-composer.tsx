"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ClipboardPaste, Loader2, Sparkles, Users, WandSparkles } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { Avatar, km } from "@/components/kit";
import { WhatsAppIcon } from "@/components/brand/icons";
import { CITIES, INFLUENCER_NICHES } from "@/lib/constants";
import { createBrief, extractBrief } from "@/app/crm/actions";
import { EMPTY_BRIEF, type ParsedBrief } from "./brief-parser";
import { eligible, matchScore } from "./match-score";
import type { BriefCriteriaVM, TalentRow } from "./types";

type K = keyof ParsedBrief;
const ORDER: K[] = ["brand_display", "title", "talent_kind", "cities", "colleges_only", "categories", "min_followers", "max_followers", "min_engagement", "deliverables", "budget_min", "budget_max", "apply_by", "event_date", "description"];
const NICHES = INFLUENCER_NICHES.slice(0, 13).concat(["Student / Campus"]).filter((v, i, a) => a.indexOf(v) === i);

export function BriefComposer({ talent, campaigns, defaultCampaign, sample, error }: {
  talent: TalentRow[]; campaigns: { id: string; name: string; brand: string }[]; defaultCampaign?: string; sample: string; error?: string;
}) {
  const reduce = useReducedMotion();
  const [text, setText] = useState("");
  const [b, setB] = useState<ParsedBrief>({ ...EMPTY_BRIEF, brand_display: campaigns.find((c) => c.id === (defaultCampaign ?? campaigns[0]?.id))?.brand ?? "" });
  const [campaign, setCampaign] = useState(defaultCampaign ?? campaigns[0]?.id ?? "");
  const [flash, setFlash] = useState<Set<K>>(new Set());
  const [filled, setFilled] = useState<K[]>([]);
  const [phase, setPhase] = useState<"idle" | "reading" | "filling" | "done">("idle");
  const [pending, start] = useTransition();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const set = <T extends K>(k: T, v: ParsedBrief[T]) => setB((s) => ({ ...s, [k]: v }));
  const toggle = (k: "cities" | "categories", v: string) => setB((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }));

  const extract = () => {
    if (!text.trim()) return;
    timers.current.forEach(clearTimeout);
    setPhase("reading"); setFilled([]);
    start(async () => {
      const parsed = await extractBrief(text);
      const keys = ORDER.filter((k) => { const v = parsed[k]; return Array.isArray(v) ? v.length > 0 : v !== null && v !== "" && v !== false; });
      setPhase("filling");
      const step = reduce ? 0 : 110;
      keys.forEach((k, i) => {
        timers.current.push(setTimeout(() => {
          setB((s) => ({ ...s, [k]: parsed[k] }));
          setFilled((f) => [...f, k]);
          setFlash((f) => new Set(f).add(k));
          timers.current.push(setTimeout(() => setFlash((f) => { const n = new Set(f); n.delete(k); return n; }), 900));
        }, 260 + i * step));
      });
      timers.current.push(setTimeout(() => { setB((s) => ({ ...s, talent_kind: parsed.talent_kind, colleges_only: parsed.colleges_only })); setPhase("done"); }, 300 + keys.length * step));
    });
  };

  const crit: BriefCriteriaVM = { id: "draft", title: b.title, brand: b.brand_display, talent_kind: b.talent_kind, categories: b.categories, cities: b.cities, colleges_only: b.colleges_only, min_followers: b.min_followers, max_followers: b.max_followers, min_engagement: b.min_engagement, ranks: [] };
  const matches = useMemo(() => talent.filter((t) => eligible(crit, t).length === 0).map((t) => ({ t, m: matchScore(crit, t) })).sort((a, c) => c.m - a.m), [talent, JSON.stringify(crit)]); // eslint-disable-line react-hooks/exhaustive-deps
  const avgRate = matches.length ? Math.round(matches.reduce((s, x) => s + (x.t.rate ?? 0), 0) / matches.length) : 0;
  const fx = (k: K) => clsx("transition-[background-color,box-shadow] duration-500", flash.has(k) && "!border-cobalt !bg-cobalt-50 ring-4 ring-cobalt/12");
  const numIn = (k: "min_followers" | "max_followers" | "budget_min" | "budget_max" | "min_engagement", label: string, ph: string) => (
    <div><label className="label" htmlFor={`f-${k}`}>{label}</label>
      <input id={`f-${k}`} name={k} inputMode="decimal" value={b[k] ?? ""} placeholder={ph} onChange={(e) => set(k, e.target.value ? Number(e.target.value.replace(/[^\d.]/g, "")) : null)} className={clsx("input tabular-nums", fx(k))} /></div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* left: paste + matching */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:col-span-5 lg:self-start">
        <section className="card p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label htmlFor="paste" className="font-display text-[16px] font-semibold tracking-[-0.02em]">Paste the brand&apos;s email or WhatsApp message</label>
            <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#128C4B]" />
          </div>
          <textarea id="paste" rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Hi team, we're launching… need 20 college creators in Mumbai, 1 Reel + 2 Stories, budget ₹5–10K each…" className="textarea text-[14px] leading-[1.55]" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={extract} disabled={!text.trim() || pending || phase === "filling"} className="btn-primary">
              {phase === "reading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
              {phase === "reading" ? "Reading message…" : phase === "filling" ? "Filling brief…" : "Extract brief"}
            </button>
            {!text && <button onClick={() => setText(sample)} className="btn-quiet btn-sm"><ClipboardPaste className="h-3.5 w-3.5" /> Use a sample</button>}
          </div>
          <AnimatePresence>
            {filled.length > 0 && (
              <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 flex flex-wrap gap-1.5 overflow-hidden border-t border-line pt-3" aria-live="polite" aria-label="Extracted fields">
                {filled.map((k) => (
                  <motion.li key={k} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex h-6 items-center gap-1 rounded-full bg-ok-bg px-2 text-[11.5px] font-medium text-ok">
                    <Check className="h-3 w-3" strokeWidth={3} />{k.replace(/_/g, " ").replace("display", "").trim()}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </section>

        <section className="card overflow-hidden" aria-live="polite">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-night px-5 py-4 text-white">
            <div>
              <div className="text-[12.5px] text-white/60">Matching creators</div>
              <motion.div key={matches.length} initial={reduce ? false : { opacity: 0.3, y: 4 }} animate={{ opacity: 1, y: 0 }} className="font-display text-[34px] font-bold leading-none tabular-nums tracking-[-0.04em]">{matches.length}</motion.div>
            </div>
            <div className="text-right text-[12px] text-white/60">
              <div>of {talent.length} in the pool</div>
              {avgRate > 0 && <div className="mt-0.5">avg rate <span className="font-semibold tabular-nums text-white">₹{avgRate.toLocaleString("en-IN")}</span></div>}
            </div>
          </div>
          {matches.length === 0 ? <p className="p-5 text-[13px] text-mute">No creators meet every criterion — widen cities, followers or ER.</p> : (
            <ul className="divide-y divide-line">
              {matches.slice(0, 5).map(({ t, m }) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                  <Avatar name={t.name} hue={t.hue} size={30} />
                  <Link href={`/crm/talent/${t.id}`} className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[13.5px] font-semibold hover:text-cobalt-700">{t.name}</span><span className="text-[12px] text-mute">{t.city} · {km(t.followers)} · {t.er?.toFixed(1)}%</span></Link>
                  <span className="rounded-full bg-cobalt-50 px-2 py-0.5 text-[12px] font-bold tabular-nums text-cobalt-700">{m}%</span>
                </li>
              ))}
              {matches.length > 5 && <li className="px-5 py-2.5 text-[12.5px] text-mute"><Users className="mr-1 inline h-3.5 w-3.5" />+{matches.length - 5} more are notified when you publish</li>}
            </ul>
          )}
        </section>
      </div>

      {/* right: structured form */}
      <form action={createBrief} className="space-y-4 lg:col-span-7">
        {error && <p className="rounded-[12px] bg-bad-bg px-4 py-3 text-[13.5px] text-bad">{error}</p>}
        <input type="hidden" name="description" value={b.description} />
        {b.cities.map((c) => <input key={c} type="hidden" name="cities" value={c} />)}
        {b.categories.map((c) => <input key={c} type="hidden" name="categories" value={c} />)}
        <input type="hidden" name="colleges_only" value={b.colleges_only ? "1" : "0"} />
        <input type="hidden" name="talent_kind" value={b.talent_kind} />

        <section className="card space-y-4 p-5">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cobalt" /><h2 className="font-display text-[16px] font-semibold">Brief</h2>{phase === "done" && <span className="text-[12px] text-mute">Check the extracted fields, then publish.</span>}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="f-campaign">Campaign</label>
              <select id="f-campaign" name="campaign_id" value={campaign} onChange={(e) => setCampaign(e.target.value)} className="input" required>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.brand}</option>)}
              </select></div>
            <div><label className="label" htmlFor="f-brand">Brand shown to creators</label><input id="f-brand" name="brand_display" value={b.brand_display} onChange={(e) => set("brand_display", e.target.value)} placeholder="Confidential brand" className={clsx("input", fx("brand_display"))} /></div>
          </div>
          <div><label className="label" htmlFor="f-title">Title</label><input id="f-title" name="title" required value={b.title} onChange={(e) => set("title", e.target.value)} placeholder="Campus fest food reels" className={clsx("input", fx("title"))} /></div>
          <div><label className="label" htmlFor="f-del">Deliverables</label><input id="f-del" name="deliverables" value={b.deliverables} onChange={(e) => set("deliverables", e.target.value)} placeholder="1 Reel + 3 Stories" className={clsx("input", fx("deliverables"))} /></div>
          <div className="grid gap-4 sm:grid-cols-4">
            {numIn("budget_min", "Budget min ₹", "4000")}
            {numIn("budget_max", "Budget max ₹", "12000")}
            <div><label className="label" htmlFor="f-apply">Apply by</label><input id="f-apply" type="date" name="apply_by" value={b.apply_by} onChange={(e) => set("apply_by", e.target.value)} className={clsx("input", fx("apply_by"))} /></div>
            <div><label className="label" htmlFor="f-event">Event / go-live</label><input id="f-event" type="date" name="event_date" value={b.event_date} onChange={(e) => set("event_date", e.target.value)} className={clsx("input", fx("event_date"))} /></div>
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="font-display text-[16px] font-semibold">Who should see it</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className={clsx("inline-flex rounded-full border border-line bg-canvas-2/70 p-1", fx("talent_kind"))} role="radiogroup" aria-label="Talent type">
              {(["influencer", "event", "any"] as const).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={b.talent_kind === k} onClick={() => set("talent_kind", k)}
                  className={clsx("h-8 rounded-full px-3.5 text-[13px] font-medium", b.talent_kind === k ? "bg-surface text-ink shadow-sm" : "text-mute hover:text-ink")}>
                  {k === "influencer" ? "Influencers" : k === "event" ? "Event talent" : "Anyone"}
                </button>
              ))}
            </div>
            <button type="button" role="switch" aria-checked={b.colleges_only} onClick={() => set("colleges_only", !b.colleges_only)}
              className={clsx("inline-flex h-10 items-center gap-2.5 rounded-full border border-line px-3.5 text-[13.5px] font-medium", fx("colleges_only"))}>
              <span className={clsx("relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors", b.colleges_only ? "bg-cobalt" : "bg-line-2")}><span className={clsx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-transform", b.colleges_only ? "translate-x-4" : "translate-x-0.5")} /></span>
              College students only
            </button>
          </div>
          <ChipGroup label="Cities" hint="none = all" options={[...CITIES]} value={b.cities} onToggle={(v) => toggle("cities", v)} flash={flash.has("cities")} />
          <ChipGroup label="Niches" hint="none = all" options={NICHES} value={b.categories} onToggle={(v) => toggle("categories", v)} flash={flash.has("categories")} />
          <div className="grid gap-4 sm:grid-cols-3">
            {numIn("min_followers", "Min followers", "10000")}
            {numIn("max_followers", "Max followers", "150000")}
            {numIn("min_engagement", "Min ER %", "3")}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button name="publish" value="1" className="btn-primary">Publish to {matches.length} creators</button>
          <button name="publish" value="0" className="btn-ghost">Save draft</button>
          <span className="text-[12.5px] text-mute">Publishing notifies matching creators in-app; WhatsApp broadcast is on the next screen.</span>
        </div>
      </form>
    </div>
  );
}

function ChipGroup({ label, hint, options, value, onToggle, flash }: { label: string; hint: string; options: string[]; value: string[]; onToggle: (v: string) => void; flash: boolean }) {
  return (
    <fieldset className={clsx("rounded-[14px] transition-[background-color] duration-500", flash && "bg-cobalt-50/70")}>
      <legend className="label">{label} <span className="font-normal text-faint">({hint})</span></legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button key={o} type="button" aria-pressed={on} onClick={() => onToggle(o)}
              className={clsx("inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] font-medium transition-colors", on ? "border-cobalt bg-cobalt text-white" : "border-line bg-surface text-ink-2 hover:border-line-2")}>
              {on && <Check className="h-3 w-3" strokeWidth={3} />}{o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
