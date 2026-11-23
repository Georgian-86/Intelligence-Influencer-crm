"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react";
import { clsx } from "clsx";
import { BadgeCheck, Check, ChevronLeft, ChevronRight, GraduationCap, Lock, MapPin, MessageCircleQuestion, Send, Sparkles, Undo2, X } from "lucide-react";
import { Avatar, MediaTile, km } from "@/components/kit";
import type { BrandCreator } from "@/lib/demo/portal";
import { sendShortlistDecisions } from "@/app/brand/actions";

type Decision = { d: "approve" | "pass" | "question"; q?: string };
const QUICK_QS = ["Can they shoot on fest day (28 Nov)?", "Any past QSR or food-brand work?", "Exclusive with other pizza brands?", "Can they add a 4th Story?"];
const inr = (n: number | null | undefined) => (n == null ? "Fee in proposal" : `₹${n.toLocaleString("en-IN")}`);
const pctOr = (n: number | null) => (n == null ? "—" : `${n}%`);
const RANK: Record<string, string> = { bronze: "bg-[#f6ebe1] text-bronze", silver: "bg-[#eef0f4] text-silver", gold: "bg-[#fbf3d9] text-gold", platinum: "bg-[#e1f3f8] text-platinum" };

export function ShortlistDeck({ creators, target, campaignName, deliverable, campaignId, amName = "Your account manager" }: { creators: BrandCreator[]; target: number; campaignName: string; deliverable: string; campaignId?: string; amName?: string }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() => Object.fromEntries(creators.filter((c) => c.decision).map((c) => [c.id, { d: c.decision!, q: c.note ?? undefined }])));
  const [saving, startSave] = useTransition();
  const [sendErr, setSendErr] = useState<string | null>(null);
  const send = () => startSave(async () => {
    setSendErr(null);
    const r = await sendShortlistDecisions(campaignId ?? "", Object.entries(decisions).map(([id, v]) => ({ id, d: v.d, q: v.q ?? null })));
    if (!r.ok) { setSendErr(r.error ?? "Couldn't send. Try again."); return; }
    setSent(true);
  });
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [asking, setAsking] = useState(false);
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const approved = creators.filter((c) => decisions[c.id]?.d === "approve");
  const passed = creators.filter((c) => decisions[c.id]?.d === "pass").length;
  const questions = creators.filter((c) => decisions[c.id]?.d === "question").length;
  const reviewed = Object.keys(decisions).length;
  const fee = approved.reduce((a, c) => a + (c.fee ?? 0), 0);
  const allDone = reviewed === creators.length;
  const current = creators[idx];

  const nextUndecided = useCallback((from: number, dec: Record<string, Decision>) => {
    for (let k = 1; k <= creators.length; k++) {
      const j = (from + k) % creators.length;
      if (!dec[creators[j].id]) return j;
    }
    return from;
  }, [creators]);

  const decide = useCallback((d: Decision["d"], q?: string) => {
    if (!current || sent) return;
    const next = { ...decisions, [current.id]: { d, q } };
    setDir(d === "pass" ? -1 : 1);
    setDecisions(next);
    setHistory((h) => [...h, current.id]);
    setAsking(false);
    setIdx(nextUndecided(idx, next));
  }, [current, decisions, idx, nextUndecided, sent]);

  const undo = useCallback(() => {
    const last = history.at(-1);
    if (!last || sent) return;
    const { [last]: _, ...rest } = decisions;
    void _;
    setDecisions(rest);
    setHistory((h) => h.slice(0, -1));
    setDir(-1);
    setIdx(creators.findIndex((c) => c.id === last));
  }, [creators, decisions, history, sent]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "a") decide("approve");
      else if (k === "p") decide("pass");
      else if (k === "q") setAsking(true);
      else if (k === "u") undo();
      else if (k === "arrowright") { setDir(1); setIdx((i) => (i + 1) % creators.length); }
      else if (k === "arrowleft") { setDir(-1); setIdx((i) => (i - 1 + creators.length) % creators.length); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [decide, undo, creators.length]);

  return (
    <div>
      {/* Summary bar */}
      <div className="sticky top-16 z-20 mb-6">
        <div className={clsx("flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[14px] border px-5 py-3.5 shadow-md backdrop-blur-xl", sent ? "border-ok/30 bg-ok-bg/95" : "border-line bg-surface/95")} aria-live="polite">
          {sent ? (
            <p className="flex items-center gap-2 text-[14px] font-medium text-ok"><Check className="h-4 w-4" /> Sent to Vigor. {amName.split(" ")[0]} will lock contracts with {approved.length} creator{approved.length === 1 ? "" : "s"} and reply to your questions.</p>
          ) : (
            <>
              <div className="min-w-[180px] flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-[22px] font-bold tabular-nums">{approved.length}<span className="text-faint"> / {target}</span></span>
                  <span className="text-[13px] text-mute"><span className="hidden sm:inline">approved for {campaignName}</span><span className="tabular-nums sm:hidden">approved · {inr(fee)}</span></span>
                </div>
                <div className="mt-1.5 flex h-1.5 gap-[2px] overflow-hidden rounded-full" aria-hidden>
                  {Array.from({ length: target }).map((_, i) => <span key={i} className={clsx("flex-1 transition-colors duration-300", i < approved.length ? "bg-cobalt" : "bg-canvas-2")} />)}
                </div>
              </div>
              <dl className="hidden gap-6 text-[13px] sm:flex">
                <div><dt className="text-mute">Total fees</dt><dd className="font-semibold tabular-nums">{inr(fee)}</dd></div>
                <div><dt className="text-mute">Passed</dt><dd className="font-semibold tabular-nums">{passed}</dd></div>
                <div><dt className="text-mute">Questions</dt><dd className="font-semibold tabular-nums">{questions}</dd></div>
              </dl>
              {sendErr && <p role="alert" className="w-full text-[12.5px] font-medium text-bad sm:order-last">{sendErr}</p>}
              <button onClick={send} disabled={reviewed === 0 || saving} className="btn-primary shrink-0 px-4 sm:px-5" aria-label="Send decisions to Vigor">
                <Send className="h-4 w-4" /> <span className="sm:hidden">Send</span><span className="hidden sm:inline">{allDone ? "Send decisions to Vigor" : `Send ${reviewed} decision${reviewed === 1 ? "" : "s"}`}</span>
              </button>
            </>
          )}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Deck */}
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between text-[13px] text-mute">
            <span className="tabular-nums"><b className="font-semibold text-ink">{idx + 1}</b> of {creators.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={undo} disabled={!history.length || sent} className="btn-quiet btn-sm" aria-label="Undo last decision"><Undo2 className="h-4 w-4" /> Undo</button>
              <button onClick={() => { setDir(-1); setIdx((i) => (i - 1 + creators.length) % creators.length); }} className="grid h-9 w-9 place-items-center rounded-full hover:bg-canvas-2" aria-label="Previous creator"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => { setDir(1); setIdx((i) => (i + 1) % creators.length); }} className="grid h-9 w-9 place-items-center rounded-full hover:bg-canvas-2" aria-label="Next creator"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="relative">
            {/* stacked deck hint */}
            <div aria-hidden className="absolute inset-x-6 -bottom-2 top-4 rounded-[14px] border border-line bg-surface/70" />
            <div aria-hidden className="absolute inset-x-12 -bottom-4 top-8 rounded-[14px] border border-line bg-surface/40" />
            <AnimatePresence mode="popLayout" custom={dir} initial={false}>
              {current && (
                <SwipeCard key={current.id} c={current} dir={dir} decision={decisions[current.id]} deliverable={deliverable}
                  onSwipe={(d) => decide(d)} asking={asking} setAsking={setAsking} onAsk={(q) => decide("question", q)} disabled={sent} />
              )}
            </AnimatePresence>
          </div>
          <p className="mt-6 hidden text-center text-[12.5px] text-mute sm:block">
            Keyboard: <Kbd>A</Kbd> approve · <Kbd>P</Kbd> pass · <Kbd>Q</Kbd> ask a question · <Kbd>U</Kbd> undo · <Kbd>←</Kbd><Kbd>→</Kbd> browse
          </p>
          <p className="mt-6 text-center text-[12.5px] text-mute sm:hidden">Swipe right to approve, left to pass.</p>
        </div>

        {/* Queue */}
        <aside className="card h-fit overflow-hidden" aria-label="Shortlist queue">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[14px] font-semibold">Shortlist</h2>
            <span className="text-[12px] tabular-nums text-mute">{reviewed}/{creators.length} reviewed</span>
          </div>
          <ul className="max-h-[560px] overflow-y-auto p-1.5">
            {creators.map((c, i) => {
              const d = decisions[c.id]?.d;
              return (
                <li key={c.id}>
                  <button onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i); }} aria-current={i === idx ? "true" : undefined}
                    className={clsx("flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left transition-colors", i === idx ? "bg-cobalt-50" : "hover:bg-canvas")}>
                    <Avatar name={c.name} hue={c.hue} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium">{c.name}</span>
                      <span className="block truncate text-[12px] tabular-nums text-mute">{km(c.followers)} · {c.er.toFixed(1)}% ER{c.fee != null ? ` · ${inr(c.fee)}` : ""}</span>
                    </span>
                    <DecisionDot d={d} />
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="mx-0.5 inline-grid h-5 min-w-5 place-items-center rounded-[6px] border border-line bg-surface px-1 text-[11px] font-semibold text-ink-2 shadow-xs">{children}</kbd>;
}

function DecisionDot({ d }: { d?: Decision["d"] }) {
  if (!d) return <span className="h-6 w-6 shrink-0 rounded-full border border-dashed border-line-2" aria-label="Not reviewed" />;
  const m = { approve: ["bg-ok text-white", Check, "Approved"], pass: ["bg-canvas-2 text-mute", X, "Passed"], question: ["bg-warn-bg text-warn", MessageCircleQuestion, "Question asked"] } as const;
  const [c, I, l] = m[d];
  return <span className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full", c)} aria-label={l}><I className="h-3.5 w-3.5" strokeWidth={2.4} /></span>;
}

function SwipeCard({ c, dir, decision, deliverable, onSwipe, asking, setAsking, onAsk, disabled }: {
  c: BrandCreator; dir: number; decision?: Decision; deliverable: string; onSwipe: (d: "approve" | "pass") => void;
  asking: boolean; setAsking: (v: boolean) => void; onAsk: (q: string) => void; disabled: boolean;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-8, 8]);
  const approveO = useTransform(x, [30, 140], [0, 1]);
  const passO = useTransform(x, [-140, -30], [1, 0]);
  const [q, setQ] = useState("");
  const onEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120 || info.velocity.x > 700) onSwipe("approve");
    else if (info.offset.x < -120 || info.velocity.x < -700) onSwipe("pass");
  };
  const tiles = useMemo(() => c.posts, [c.posts]);
  return (
    <motion.article
      custom={dir}
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 60, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 320, rotate: dir * 6, transition: { duration: 0.32 } }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      drag={disabled || asking ? false : "x"} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.85} onDragEnd={onEnd}
      style={{ x, rotate }}
      className="relative z-10 touch-pan-y select-none overflow-hidden rounded-[14px] border border-line bg-surface shadow-md"
      aria-label={`${c.name}, ${km(c.followers)} followers`}
    >
      <motion.div style={{ opacity: approveO }} className="pointer-events-none absolute left-6 top-6 z-20 rotate-[-8deg] rounded-[10px] border-2 border-ok px-3 py-1 font-display text-[20px] font-bold text-ok">APPROVE</motion.div>
      <motion.div style={{ opacity: passO }} className="pointer-events-none absolute right-6 top-6 z-20 rotate-[8deg] rounded-[10px] border-2 border-mute px-3 py-1 font-display text-[20px] font-bold text-mute">PASS</motion.div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <Avatar name={c.name} hue={c.hue} size={64} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-[22px] font-bold leading-tight tracking-[-0.03em]">{c.name}</h2>
                <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", RANK[c.rank])}>{c.rank}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[14px] text-ink-2">
                @{c.handle}
                {c.verified_insights && <span className="inline-flex items-center gap-1 text-[12px] font-medium text-info"><BadgeCheck className="h-3.5 w-3.5" /> Verified insights</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-mute">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.city}</span>
                {c.college && <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{c.college}{c.grad_year ? ` '${String(c.grad_year).slice(2)}` : ""}</span>}
              </div>
            </div>
            {decision && <DecisionDot d={decision.d} />}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-line bg-line sm:grid-cols-4">
            {[
              ["Followers", km(c.followers)],
              ["Engagement", `${c.er.toFixed(1)}%`],
              c.audience_18_24 != null ? ["Age 18–24", pctOr(c.audience_18_24)] : ["Posts shown", String(c.posts.length || "—")],
              ["Avg views", km(c.avg_views)],
            ].map(([l, v]) => (
              <div key={l} className="bg-surface px-3 py-3">
                <dt className="text-[11.5px] text-mute">{l}</dt>
                <dd className="mt-0.5 font-display text-[19px] font-bold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5">
            <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-medium text-ink-2"><Sparkles className="h-3.5 w-3.5 text-cobalt" /> Why Vigor picked them · {c.match}% match</div>
            <ul className="space-y-1.5 text-[13.5px] text-ink-2">
              {c.why.map((w) => <li key={w} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" strokeWidth={2.6} />{w}</li>)}
            </ul>
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-[14px] bg-canvas px-3.5 py-3 text-[12.5px] text-mute">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span><span className="font-medium text-ink-2">Contact details stay with Vigor.</span> We handle outreach, contracts and payments so creators aren&apos;t spammed. <span className="whitespace-nowrap tabular-nums text-faint">+91 ••••• ••••• · ••••@••••.com</span></span>
          </div>
        </div>

        <div className="border-t border-line bg-canvas/40 p-5 sm:p-7 md:border-l md:border-t-0">
          <div className="mb-2 text-[12.5px] font-medium text-ink-2">Recent content</div>
          <div className="grid grid-cols-3 gap-2">
            {tiles.map((p) => p.url
              ? <a key={p.id} href={p.url} target="_blank" rel="noreferrer" aria-label="Open post on Instagram"><MediaTile hue={p.hue} type={p.type} views={p.views} thumb={p.thumb} /></a>
              : <MediaTile key={p.id} hue={p.hue} type={p.type} views={p.views} thumb={p.thumb} />)}
            {tiles.length === 0 && <p className="col-span-3 text-[12.5px] text-mute">Recent posts appear after the next Instagram sync.</p>}
          </div>
          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <div className="text-[12.5px] text-mute">Proposed fee</div>
              <div className="font-display text-[30px] font-bold leading-none tracking-[-0.03em] tabular-nums">{inr(c.fee)}</div>
              <div className="mt-1 text-[12px] text-mute">{c.deliverable ?? deliverable}</div>
            </div>
            {c.reliability != null && <div className="text-right text-[12px] text-mute">Reliability<div className="font-display text-[18px] font-bold text-ink tabular-nums">{c.reliability}<span className="text-[12px] text-faint">/100</span></div></div>}
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-2 text-[12.5px] font-medium text-ink-2">{c.female != null ? "Audience" : "Niches"}</div>
            {c.female != null && <>
              <div className="flex h-2 overflow-hidden rounded-full bg-canvas-2" aria-hidden><span className="bg-cobalt" style={{ width: `${c.female}%` }} /></div>
              <div className="mt-1.5 flex justify-between text-[12px] tabular-nums text-mute"><span>{c.female}% women</span><span>{100 - c.female}% men</span></div>
            </>}
            <div className="mt-3 flex flex-wrap gap-1.5">{c.categories.map((k) => <span key={k} className="chip">{k}</span>)}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-line p-4 sm:px-7">
        {asking ? (
          <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) onAsk(q.trim()); }} className="space-y-3">
            <label htmlFor={`q-${c.id}`} className="label">Ask Vigor about {c.name.split(" ")[0]}</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_QS.map((s) => <button type="button" key={s} onClick={() => setQ(s)} className={clsx("chip h-8 px-3 text-[12.5px] transition-colors", q === s ? "border-cobalt bg-cobalt-50 text-cobalt-700" : "hover:border-line-2")}>{s}</button>)}
            </div>
            <textarea id={`q-${c.id}`} value={q} onChange={(e) => setQ(e.target.value)} rows={2} className="textarea" placeholder="Type your question. Kunal usually answers within the hour." autoFocus />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAsking(false)} className="btn-quiet">Cancel</button>
              <button disabled={!q.trim()} className="btn-dark"><Send className="h-4 w-4" /> Send question</button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2 sm:gap-3">
            <button onClick={() => onSwipe("pass")} disabled={disabled} className="btn-ghost btn-lg px-3"><X className="h-5 w-5" /> Pass <Hint k="P" /></button>
            <button onClick={() => setAsking(true)} disabled={disabled} className="btn-ghost btn-lg px-3"><MessageCircleQuestion className="h-5 w-5" /> <span className="hidden sm:inline">Ask a question</span><span className="sm:hidden">Ask</span> <Hint k="Q" /></button>
            <button onClick={() => onSwipe("approve")} disabled={disabled} className="btn-primary btn-lg px-3"><Check className="h-5 w-5" strokeWidth={2.6} /> Approve <Hint k="A" dark /></button>
          </div>
        )}
        {decision?.q && !asking && <p className="mt-3 rounded-[12px] bg-warn-bg px-3 py-2 text-[12.5px] text-warn">Your question: “{decision.q}” Vigor will reply here.</p>}
      </div>
    </motion.article>
  );
}

function Hint({ k, dark }: { k: string; dark?: boolean }) {
  return <kbd className={clsx("ml-1 hidden h-5 min-w-5 place-items-center rounded-[6px] px-1 text-[11px] font-semibold lg:inline-grid", dark ? "bg-white/20 text-white" : "border border-line bg-canvas text-mute")}>{k}</kbd>;
}
