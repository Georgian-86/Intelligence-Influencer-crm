"use client";

import { useEffect, useState, useTransition } from "react";
import { brandReview } from "@/app/brand/actions";
import { AnimatePresence, motion } from "motion/react";
import { clsx } from "clsx";
import { Check, CircleCheck, ExternalLink, Heart, History, MessageCircle, Play, RotateCcw, Send, Timer, TriangleAlert } from "lucide-react";
import { Avatar } from "@/components/kit";
import type { ReviewItem } from "@/lib/demo/portal";

type Outcome = { kind: "approved" } | { kind: "changes"; reasons: string[]; note: string };

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  return now;
}

/** SLA remaining, in ms. Anchored to first render so the demo is stable. */
function useSla(items: ReviewItem[]) {
  const [anchor] = useState(() => Date.now());
  const now = useNow() ?? anchor;
  return (r: ReviewItem) => anchor + (r.sla_hours - r.submitted_hours_ago) * 3600_000 - now;
}

function slaText(ms: number) {
  const neg = ms < 0, a = Math.abs(ms);
  const h = Math.floor(a / 3600_000), m = Math.floor((a % 3600_000) / 60_000), s = Math.floor((a % 60_000) / 1000);
  const t = `${h}h ${String(m).padStart(2, "0")}m${h < 2 ? ` ${String(s).padStart(2, "0")}s` : ""}`;
  return neg ? `${t} overdue` : `${t} left`;
}
const slaTone = (ms: number) => (ms < 0 ? "bad" : ms < 4 * 3600_000 ? "warn" : "ok");

export function ReviewRoom({ items, reasons, brandName = "Brand", me = "You", live = false }: { items: ReviewItem[]; reasons: string[]; brandName?: string; me?: string; live?: boolean }) {
  const [saving, startSave] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const sla = useSla(items);
  const [sel, setSel] = useState(items[0]?.id);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [mode, setMode] = useState<"idle" | "changes">("idle");
  const [chosen, setChosen] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");
  const [extra, setExtra] = useState<Record<string, ReviewItem["comments"]>>({});
  const item = items.find((i) => i.id === sel)!;
  const outcome = outcomes[item.id];
  const left = sla(item);
  const pending = items.filter((i) => !outcomes[i.id]);

  const goNext = (next: Record<string, Outcome>) => {
    const n = items.find((i) => !next[i.id] && i.id !== item.id);
    setMode("idle"); setChosen([]); setNote("");
    if (n) setTimeout(() => setSel(n.id), 650);
  };
  const persist = (o: Outcome) => startSave(async () => {
    setErr(null);
    const r = await brandReview(item.id, o.kind === "approved" ? "approve" : "changes", o.kind === "changes" ? o.reasons : [], o.kind === "changes" ? o.note : "");
    if (!r.ok) { setErr(r.error ?? "Couldn't save. Try again."); return; }
    const n = { ...outcomes, [item.id]: o };
    setOutcomes(n); goNext(n);
  });
  const approve = () => persist({ kind: "approved" });
  const requestChanges = () => persist({ kind: "changes", reasons: chosen, note });
  const postComment = () => {
    const text = comment.trim();
    if (!text) return;
    startSave(async () => {
      const r = await brandReview(item.id, "comment", [], text);
      if (!r.ok) { setErr(r.error ?? "Couldn't post"); return; }
      setExtra((x) => ({ ...x, [item.id]: [...(x[item.id] ?? []), { who: me, role: "brand", when: "now", text }] }));
      setComment("");
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      {/* Queue */}
      <aside aria-label="Drafts to review" className="min-w-0">
        <div className="mb-2 flex items-center justify-between px-1 text-[13px]">
          <span className="font-semibold">Queue</span>
          <span className="tabular-nums text-mute">{pending.length} waiting</span>
        </div>
        <ul className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible">
          {items.map((r) => {
            const ms = sla(r), o = outcomes[r.id], tone = slaTone(ms);
            return (
              <li key={r.id} className="min-w-[240px] xl:min-w-0">
                <button onClick={() => { setSel(r.id); setMode("idle"); }} aria-current={r.id === sel ? "true" : undefined}
                  className={clsx("flex w-full items-center gap-3 rounded-[12px] border p-2.5 text-left transition-[border-color,background-color,box-shadow]",
                    r.id === sel ? "border-cobalt bg-surface shadow-sm" : "border-line bg-surface/70 hover:border-line-2")}>
                  <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-[10px]" style={{ background: `linear-gradient(160deg, hsl(${r.hue} 85% 76%), hsl(${(r.hue + 60) % 360} 65% 38%))` }} aria-hidden>
                    <Play className="absolute inset-0 m-auto h-4 w-4 fill-white text-white" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium">@{r.creator.handle}</span>
                    <span className="block text-[12px] text-mute">{r.kind} · v{r.version}</span>
                    {o ? (
                      <span className={clsx("mt-1 inline-flex items-center gap-1 text-[12px] font-medium", o.kind === "approved" ? "text-ok" : "text-warn")}>
                        {o.kind === "approved" ? <><Check className="h-3 w-3" /> Approved</> : <><RotateCcw className="h-3 w-3" /> Changes requested</>}
                      </span>
                    ) : (
                      <span className={clsx("mt-1 inline-flex items-center gap-1 text-[12px] font-medium tabular-nums", tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : "text-mute")}>
                        <Timer className="h-3 w-3" /> {slaText(ms)}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Stage */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* Preview */}
        <div className="min-w-0">
          <div className="relative mx-auto aspect-[9/16] w-full max-w-[340px] overflow-hidden rounded-[36px] bg-night p-2 shadow-lg">
            <div className="relative h-full w-full overflow-hidden rounded-[14px]" style={{ background: `linear-gradient(165deg, hsl(${item.hue} 85% 74%), hsl(${(item.hue + 50) % 360} 70% 48%) 55%, hsl(${(item.hue + 90) % 360} 60% 22%))` }}>
              <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_30%_20%,rgb(255_255_255/.45),transparent)]" />
              {item.media?.kind === "video" && <video key={item.media.url} src={item.media.url} controls playsInline preload="metadata" className="absolute inset-0 z-20 h-full w-full bg-black object-contain" />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {item.media?.kind === "image" && <img src={item.media.url} alt={`Draft from ${item.creator.name}`} className="absolute inset-0 z-20 h-full w-full bg-black object-contain" />}
              {item.media?.kind === "link" && (
                <a href={item.media.url} target="_blank" rel="noreferrer" className="absolute inset-x-6 bottom-28 z-20 flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-ink shadow-md hover:brightness-95">
                  <ExternalLink className="h-4 w-4" /> Open draft v{item.version}
                </a>
              )}
              <div className="absolute left-3 right-3 top-3 flex gap-1" aria-hidden>{[0, 1, 2].map((k) => <span key={k} className={clsx("h-[3px] flex-1 rounded-full", k === 0 ? "bg-white" : "bg-white/40")} />)}</div>
              <div className="absolute left-3 top-6 flex items-center gap-2 text-[12px] font-semibold text-white">
                <Avatar name={item.creator.name} hue={item.creator.hue} size={26} ring /> {item.creator.handle}
              </div>
              <button className="absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-full bg-white/25 text-white backdrop-blur transition-transform hover:scale-105" aria-label={`Play ${item.kind} draft, ${item.duration}`}>
                <Play className="ml-1 h-7 w-7 fill-white" />
              </button>
              <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 text-white/90" aria-hidden><Heart className="h-6 w-6" /><MessageCircle className="h-6 w-6" /><Send className="h-6 w-6" /></div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-[12.5px] leading-snug text-white">
                <p className="line-clamp-3">{item.caption}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-white/70 tabular-nums"><span>Draft v{item.version}</span><span>{item.duration}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Details + decision */}
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[22px] font-bold leading-tight tracking-[-0.03em]">{item.creator.name}</h2>
              <p className="text-[13.5px] text-mute">@{item.creator.handle}{item.creator.college ? ` · ${item.creator.college}` : ""} · {item.kind} draft v{item.version}</p>
            </div>
            <SlaBadge ms={left} done={!!outcome} />
          </div>

          {/* Decision */}
          <section aria-label="Your decision" className="card p-5" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {outcome ? (
                <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                  <span className={clsx("grid h-10 w-10 place-items-center rounded-full", outcome.kind === "approved" ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn")}>
                    {outcome.kind === "approved" ? <Check className="h-5 w-5" strokeWidth={2.6} /> : <RotateCcw className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1 text-[14px]">
                    <div className="font-semibold">{outcome.kind === "approved" ? "Approved. Scheduled to go live." : "Changes requested"}</div>
                    <div className="text-mute">{outcome.kind === "approved" ? "The creator gets a WhatsApp nudge to post within 24 hours." : `${outcome.reasons.join(", ") || "See note"}. ${item.creator.name.split(" ")[0]} has 24h to send v${item.version + 1}.`}</div>
                  </div>
                  {!live && <button onClick={() => setOutcomes(({ [item.id]: _, ...rest }) => (void _, rest))} className="btn-quiet btn-sm">Undo</button>}
                </motion.div>
              ) : mode === "changes" ? (
                <motion.div key="changes" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="text-[14px] font-semibold">What needs to change?</div>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Reasons">
                    {reasons.map((r) => {
                      const on = chosen.includes(r);
                      return (
                        <button key={r} type="button" aria-pressed={on} onClick={() => setChosen((c) => (on ? c.filter((x) => x !== r) : [...c, r]))}
                          className={clsx("inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
                            on ? "border-cobalt bg-cobalt-50 text-cobalt-700" : "border-line bg-surface text-ink-2 hover:border-line-2")}>
                          {on && <Check className="h-3.5 w-3.5" strokeWidth={2.6} />}{r}
                        </button>
                      );
                    })}
                  </div>
                  <label className="block">
                    <span className="label">Note for the creator (optional)</span>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="textarea" placeholder="e.g. Open on the box reveal, then the first bite." />
                  </label>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button onClick={() => setMode("idle")} className="btn-quiet">Cancel</button>
                    <button onClick={requestChanges} disabled={saving || (!chosen.length && !note.trim())} className="btn-dark"><RotateCcw className="h-4 w-4" /> Send change request</button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <p className="text-[13.5px] text-mute">Vigor QA has passed this draft. Approving schedules it to go live.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setMode("changes")} className="btn-ghost btn-lg"><RotateCcw className="h-4 w-4" /> Request changes</button>
                    <button onClick={approve} disabled={saving} className="btn-primary btn-lg"><Check className="h-5 w-5" strokeWidth={2.6} /> Approve</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {err && <p role="alert" className="mt-3 text-[13px] font-medium text-bad">{err}</p>}
          </section>

          <section aria-labelledby="cap" className="card p-5">
            <h3 id="cap" className="text-[13px] font-semibold text-ink-2">Caption</h3>
            <p className="mt-1.5 text-[14.5px] leading-relaxed">{item.caption}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {item.checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-[13px]">
                  {c.ok ? <CircleCheck className="h-4 w-4 shrink-0 text-ok" /> : <TriangleAlert className="h-4 w-4 shrink-0 text-warn" />}
                  <span className={c.ok ? "text-ink-2" : "font-medium text-warn"}>{c.label}{!c.ok && " (missing)"}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-5 2xl:grid-cols-2">
            <section aria-labelledby="hist" className="card p-5">
              <h3 id="hist" className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-2"><History className="h-4 w-4" /> Version history</h3>
              <ol className="mt-3 space-y-3">
                {[...item.history].reverse().map((h) => (
                  <li key={h.version} className="flex gap-3">
                    <span className={clsx("grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums", h.version === item.version ? "bg-cobalt text-white" : "bg-canvas-2 text-ink-2")}>v{h.version}</span>
                    <div className="min-w-0 text-[13px]">
                      <div className="font-medium">{h.outcome === "changes" ? "Changes requested" : h.version === item.version ? "Current draft" : "Submitted"} <span className="font-normal text-mute">· {h.when}</span></div>
                      <div className="text-mute">{h.note} · {h.by}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="cm" className="card p-5">
              <h3 id="cm" className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-2"><MessageCircle className="h-4 w-4" /> Comments</h3>
              <ul className="mt-3 space-y-3">
                {[...item.comments, ...(extra[item.id] ?? [])].map((c, i) => (
                  <li key={i} className="flex gap-2.5">
                    <Avatar name={c.who} hue={c.role === "brand" ? 12 : c.role === "agency" ? 228 : item.creator.hue} size={28} />
                    <div className="min-w-0 text-[13px]">
                      <div><span className="font-semibold">{c.who}</span> <span className="text-mute">· {c.role === "brand" ? brandName : c.role === "agency" ? "Vigor" : "Creator"} · {c.when}</span></div>
                      <p className="text-ink-2">{c.at && <span className="mr-1 rounded bg-cobalt-50 px-1 font-semibold text-cobalt-700 tabular-nums">{c.at}</span>}{c.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); postComment(); }}>
                <label htmlFor="cmt" className="sr-only">Add a comment</label>
                <input id="cmt" value={comment} onChange={(e) => setComment(e.target.value)} className="input h-10" placeholder="Add a comment" />
                <button className="btn-ghost h-10 px-3" aria-label="Post comment" disabled={!comment.trim() || saving}><Send className="h-4 w-4" /></button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlaBadge({ ms, done }: { ms: number; done: boolean }) {
  if (done) return null;
  const tone = slaTone(ms);
  return (
    <div className={clsx("rounded-[14px] px-3.5 py-2 text-right", tone === "bad" ? "bg-bad-bg text-bad" : tone === "warn" ? "bg-warn-bg text-warn" : "bg-canvas-2 text-ink-2")} role="timer" aria-label="Review window">
      <div className="text-[11px] font-semibold">24h review window</div>
      <div className="flex items-center justify-end gap-1 font-display text-[17px] font-bold tabular-nums"><Timer className="h-4 w-4" />{slaText(ms)}</div>
    </div>
  );
}
