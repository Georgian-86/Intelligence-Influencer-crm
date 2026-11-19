"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { Check, CircleCheck, Eye, EyeOff, Maximize2, MessageSquareText, Pause, Play, RotateCcw, Send, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Avatar } from "@/components/kit";
import { reviewDeliverable } from "@/app/crm/actions";
import { DeliverablePill } from "./ui";
import { ago, dueLabel } from "./format";
import { toast } from "./toast";
import type { ReviewComment, Submission } from "@/lib/demo/crm";

export type ReviewItem = Submission & { name: string; handle: string };

export function ReviewRoom({ items: initial, brand, now, initialId }: { items: ReviewItem[]; brand: string; now: number; initialId?: string }) {
  const [items, setItems] = useState(initial);
  const [sel, setSel] = useState(initialId && initial.some((i) => i.deliverable_id === initialId) ? initialId : initial[0]?.deliverable_id);
  const cur = items.find((i) => i.deliverable_id === sel);
  const [ver, setVer] = useState(cur?.versions.length ?? 1);
  const [draft, setDraft] = useState("");
  const [playing, setPlaying] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => { setVer(cur?.versions.length ?? 1); setPlaying(false); setDraft(""); }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (p: Partial<ReviewItem>) => setItems((l) => l.map((i) => (i.deliverable_id === sel ? { ...i, ...p } : i)));
  const comments = useMemo(() => (cur?.comments ?? []).slice().sort((a, b) => a.at.localeCompare(b.at)), [cur]);

  if (!cur) return null;
  const v = cur.versions[ver - 1];
  const latest = ver === cur.versions.length;
  const add = (body: string): ReviewComment => ({ id: `n${Date.now()}`, who: "Kunal Shah", role: "Agency", body, at: new Date(now).toISOString(), version: cur.versions.length, hue: 12 });

  const decide = (decision: "approve" | "changes") => {
    if (decision === "changes" && !draft.trim()) { toast("Add a comment so the creator knows what to change", { tone: "error" }); document.getElementById("rv-comment")?.focus(); return; }
    start(async () => {
      const res = await reviewDeliverable(cur.deliverable_id, decision, draft.trim() || undefined);
      if (!res.ok) { toast(res.error ?? "Couldn't save", { tone: "error" }); return; }
      patch({ status: decision === "approve" ? "approved" : "changes_requested", comments: [...cur.comments, add(draft.trim() || "Approved — good to post.")] });
      setDraft("");
      toast(decision === "approve" ? `Approved ${cur.kind} v${cur.versions.length} from ${cur.name.split(" ")[0]}` : `Changes requested from ${cur.name.split(" ")[0]}`);
    });
  };

  return (
    <div className="grid gap-4 lg:h-[calc(100dvh-210px)] lg:min-h-[560px] lg:grid-cols-[280px_minmax(0,1fr)_340px]">
      {/* submissions */}
      <aside className="card flex min-h-0 flex-col overflow-hidden" aria-label="Submissions">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-[14px] font-semibold">Submissions</h2>
          <span className="text-[12px] tabular-nums text-mute">{items.filter((i) => i.status === "draft_submitted").length} to review</span>
        </div>
        <ul className="flex gap-2 overflow-x-auto p-2 lg:block lg:flex-1 lg:space-y-1 lg:overflow-y-auto">
          {items.map((i) => (
            <li key={i.deliverable_id} className="shrink-0">
              <button onClick={() => setSel(i.deliverable_id)} aria-current={i.deliverable_id === sel}
                className={clsx("flex w-60 items-center gap-2.5 rounded-[12px] p-2 text-left transition-colors lg:w-full", i.deliverable_id === sel ? "bg-cobalt-50" : "hover:bg-canvas")}>
                <span className="h-12 w-9 shrink-0 rounded-[7px]" style={{ background: `linear-gradient(160deg, hsl(${i.hue} 85% 78%), hsl(${(i.hue + 50) % 360} 70% 52%) 60%, hsl(${(i.hue + 90) % 360} 60% 28%))` }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{i.name}</span>
                  <span className="block text-[11.5px] text-mute">{i.kind} · v{i.versions.length} · {dueLabel(i.due, now)}</span>
                  <span className="mt-1 block"><DeliverablePill status={i.status} /></span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* preview */}
      <section className="flex min-h-0 flex-col overflow-hidden rounded-[24px] bg-night text-white" aria-label="Preview">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Avatar name={cur.name} hue={cur.hue} size={30} />
          <div className="min-w-0 flex-1 leading-tight"><div className="truncate text-[14px] font-semibold">{cur.name}</div><div className="text-[12px] text-white/55">@{cur.handle} · {cur.kind}</div></div>
          <div className="flex rounded-full bg-white/8 p-0.5" role="group" aria-label="Version">
            {cur.versions.map((x) => (
              <button key={x.v} onClick={() => setVer(x.v)} aria-pressed={ver === x.v}
                className={clsx("h-7 rounded-full px-3 text-[12px] font-semibold tabular-nums transition-colors", ver === x.v ? "bg-white text-night" : "text-white/65 hover:text-white")}>v{x.v}</button>
            ))}
          </div>
        </div>
        <div className="relative grid flex-1 place-items-center overflow-hidden p-5">
          <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: `radial-gradient(50% 60% at 50% 40%, hsl(${cur.hue} 80% 50% / .35), transparent)` }} aria-hidden />
          <AnimatePresence mode="wait">
            <motion.div key={`${sel}-${ver}`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="relative aspect-[9/16] h-full max-h-[520px] min-h-[320px] overflow-hidden rounded-[20px] shadow-lg"
              style={{ background: `linear-gradient(165deg, hsl(${(cur.hue + ver * 18) % 360} 85% 74%), hsl(${(cur.hue + 50 + ver * 18) % 360} 70% 50%) 58%, hsl(${(cur.hue + 90) % 360} 60% 24%))` }}>
              <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_30%_22%,rgb(255_255_255/.4),transparent)]" />
              <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"} className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/30 backdrop-blur transition-transform hover:scale-105">
                {playing ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
              </button>
              <div className="absolute inset-x-3 bottom-3 rounded-[14px] bg-black/35 p-2.5 backdrop-blur">
                <p className="line-clamp-2 text-[12px] leading-snug">{v.caption}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] tabular-nums text-white/75">
                  <span>{playing ? "0:07" : "0:00"}</span>
                  <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/25"><span className={clsx("absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-[7000ms] ease-linear", playing ? "w-[35%]" : "w-0")} /></span>
                  <span>{v.duration}</span>
                  <Volume2 className="h-3.5 w-3.5" /><Maximize2 className="h-3.5 w-3.5" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="border-t border-white/10 px-4 py-3">
          <div className="mb-2 text-[12px] text-white/55">v{ver} uploaded {ago(v.at, now)} ago{!latest && " · older version"}</div>
          <ul className="flex flex-wrap gap-1.5" aria-label="Compliance checklist">
            {cur.checklist.map((c) => (
              <li key={c.label} className={clsx("inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium", c.ok ? "bg-mint/15 text-mint" : "bg-flame/15 text-flame")}>
                {c.ok ? <Check className="h-3.5 w-3.5" strokeWidth={2.6} /> : <X className="h-3.5 w-3.5" strokeWidth={2.6} />}{c.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* comments + decision */}
      <aside className="card flex min-h-0 flex-col overflow-hidden" aria-label="Review">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div><h2 className="text-[14px] font-semibold">Review</h2><div className="mt-0.5"><DeliverablePill status={cur.status} /></div></div>
          <button role="switch" aria-checked={cur.brand_visible} onClick={() => { patch({ brand_visible: !cur.brand_visible }); toast(!cur.brand_visible ? `Visible to ${brand} in their review room` : `Hidden from ${brand}`); }}
            className="inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink-2 hover:border-line-2">
            {cur.brand_visible ? <Eye className="h-3.5 w-3.5 text-cobalt" /> : <EyeOff className="h-3.5 w-3.5 text-mute" />}
            <span>{brand}</span>
            <span className={clsx("relative inline-block h-4 w-7 shrink-0 rounded-full transition-colors", cur.brand_visible ? "bg-cobalt" : "bg-line-2")}>
              <span className={clsx("absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-xs transition-transform", cur.brand_visible ? "translate-x-3.5" : "translate-x-0.5")} />
            </span>
          </button>
        </div>
        <ol className="flex-1 space-y-4 overflow-y-auto p-4" aria-label="Comments">
          {comments.length === 0 && <li className="text-[13px] text-mute">No comments yet.</li>}
          {comments.map((c, i) => (
            <li key={c.id}>
              {(i === 0 || comments[i - 1].version !== c.version) && (
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint"><span className="h-px flex-1 bg-line" />Version {c.version}<span className="h-px flex-1 bg-line" /></div>
              )}
              <div className={clsx("flex gap-2.5", c.resolved && "opacity-60")}>
                <Avatar name={c.who} hue={c.hue} size={26} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-1.5 text-[12px]"><span className="font-semibold text-ink">{c.who}</span>
                    <span className={clsx("rounded px-1 text-[10.5px] font-semibold", c.role === "Brand" ? "bg-flame-50 text-flame-700" : c.role === "Agency" ? "bg-cobalt-50 text-cobalt-700" : "bg-canvas-2 text-ink-2")}>{c.role}</span>
                    <span className="text-faint">{ago(c.at, now)}</span>{c.resolved && <span className="inline-flex items-center gap-0.5 text-ok"><CircleCheck className="h-3 w-3" />Resolved</span>}</div>
                  <p className="mt-0.5 text-[13px] leading-[1.5] text-ink-2">{c.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="border-t border-line p-3">
          <label htmlFor="rv-comment" className="sr-only">Comment</label>
          <div className="relative">
            <textarea id="rv-comment" rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Comment on v${cur.versions.length}…`} className="textarea resize-none pr-11 text-[13.5px]" />
            <button onClick={() => { if (!draft.trim()) return; patch({ comments: [...cur.comments, add(draft.trim())] }); setDraft(""); }} disabled={!draft.trim()} aria-label="Post comment"
              className="absolute bottom-2.5 right-2.5 grid h-8 w-8 place-items-center rounded-full bg-cobalt text-white disabled:bg-canvas-2 disabled:text-faint"><Send className="h-3.5 w-3.5" /></button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => decide("changes")} disabled={pending} className="btn-ghost btn-sm"><RotateCcw className="h-3.5 w-3.5" /> Request changes</button>
            <button onClick={() => decide("approve")} disabled={pending || cur.status === "approved" || cur.status === "live"} className="btn btn-sm bg-ok text-white hover:brightness-110"><Check className="h-3.5 w-3.5" strokeWidth={2.6} /> {cur.status === "approved" || cur.status === "live" ? "Approved" : "Approve"}</button>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[11.5px] text-mute"><MessageSquareText className="h-3 w-3" /> The creator is notified on WhatsApp either way.</p>
        </div>
      </aside>
    </div>
  );
}
