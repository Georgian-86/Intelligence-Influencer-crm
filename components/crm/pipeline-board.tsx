"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Ellipsis, GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, km } from "@/components/kit";
import { moveIntent } from "@/app/crm/actions";
import { STAGE_LABEL, lakh } from "./format";
import { toast } from "./toast";
import type { PipelineCard, PipelineStage } from "./types";

const STAGES: PipelineStage[] = ["interested", "shortlisted", "contacted", "negotiating", "confirmed", "delivered"];
const DOT: Record<PipelineStage, string> = { interested: "bg-faint", shortlisted: "bg-cobalt-300", contacted: "bg-cobalt", negotiating: "bg-warn", confirmed: "bg-ok", delivered: "bg-night" };

/**
 * Kanban by pipeline stage. Cards move by drag (HTML5 DnD), by the card menu, or with the
 * arrow buttons — all three are keyboard/screen-reader reachable except drag.
 */
export function PipelineBoard({ cards: initial, canManage }: { cards: PipelineCard[]; canManage: boolean }) {
  const [cards, setCards] = useState(initial);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<PipelineStage | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | KeyboardEvent) => { if (e instanceof KeyboardEvent ? e.key === "Escape" : !(e.target as HTMLElement).closest("[data-menu]")) setMenu(null); };
    window.addEventListener("mousedown", close); window.addEventListener("keydown", close);
    return () => { window.removeEventListener("mousedown", close); window.removeEventListener("keydown", close); };
  }, [menu]);

  const move = async (id: string, stage: PipelineStage) => {
    const card = cards.find((c) => c.id === id);
    if (!card || card.stage === stage) return;
    const prev = card.stage;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, stage, agreed: stage === "confirmed" && !c.agreed ? c.quoted : c.agreed } : c)));
    setMenu(null);
    const res = await moveIntent(id, stage);
    if (res.ok) toast(`${card.name} → ${STAGE_LABEL[stage]}`);
    else { setCards((cs) => cs.map((c) => (c.id === id ? { ...c, stage: prev } : c))); toast(res.error ?? "Move failed", { tone: "error" }); }
  };

  if (cards.length === 0) {
    return <div className="rounded-[14px] border border-dashed border-line-2 bg-surface/60 px-6 py-12 text-center text-[14px] text-mute">No creators in this campaign&apos;s briefs yet. Publish a brief or add creators from Talent.</div>;
  }

  return (
    <LayoutGroup>
      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="grid min-w-[1100px] grid-cols-6 gap-2.5">
          {STAGES.map((s, si) => {
            const col = cards.filter((c) => c.stage === s).sort((a, b) => b.match - a.match);
            const value = col.reduce((t, c) => t + (c.agreed ?? c.quoted ?? 0), 0);
            return (
              <section key={s} aria-label={`${STAGE_LABEL[s]} (${col.length})`}
                onDragOver={(e) => { if (drag) { e.preventDefault(); setOver(s); } }} onDragLeave={() => setOver((o) => (o === s ? null : o))}
                onDrop={(e) => { e.preventDefault(); if (drag) move(drag, s); setDrag(null); setOver(null); }}
                className={clsx("flex min-h-[420px] flex-col rounded-[14px] border p-2 transition-colors", over === s ? "border-cobalt bg-cobalt-50/70" : "border-line bg-canvas-2/50")}>
                <header className="flex items-center gap-2 px-2 pb-2 pt-1.5">
                  <span className={clsx("h-2 w-2 rounded-full", DOT[s])} aria-hidden />
                  <h3 className="text-[13px] font-semibold text-ink">{STAGE_LABEL[s]}</h3>
                  <span className="text-[12px] font-semibold tabular-nums text-mute">{col.length}</span>
                  <span className="ml-auto text-[11.5px] tabular-nums text-mute">{value ? lakh(value) : ""}</span>
                </header>
                <ul className="flex flex-1 flex-col gap-2">
                  {col.map((c) => (
                    <motion.li key={c.id} layoutId={reduce ? undefined : c.id} layout={!reduce} transition={{ type: "spring", stiffness: 520, damping: 42 }}>
                    <div draggable={canManage} onDragStart={(e) => { setDrag(c.id); e.dataTransfer.setData("text/plain", c.id); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { setDrag(null); setOver(null); }}
                      className={clsx("group relative rounded-[14px] border border-line bg-surface p-2.5 shadow-xs transition-shadow hover:shadow-sm", drag === c.id && "opacity-50", canManage && "cursor-grab active:cursor-grabbing")}>
                      <div className="flex items-start gap-2">
                        <Avatar name={c.name} hue={c.hue} size={28} />
                        <div className="min-w-0 flex-1 leading-tight">
                          <Link href={`/crm/talent/${c.talentId}`} className="line-clamp-2 break-words text-[13px] font-semibold text-ink hover:text-cobalt-700" draggable={false}>{c.name}</Link>
                          <span className="block truncate text-[11.5px] text-mute"><span className="font-semibold tabular-nums text-ink-2">{km(c.followers)}</span> · {c.handle ? `@${c.handle}` : "—"}</span>
                        </div>
                        {canManage && <GripVertical className="-mr-1 h-4 w-4 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />}
                      </div>
                      <div className="mt-2.5 flex items-center gap-2 text-[12px]">
                        <span className={clsx("rounded-full px-1.5 py-0.5 font-bold tabular-nums", c.match >= 85 ? "bg-cobalt-50 text-cobalt-700" : "bg-canvas-2 text-ink-2")}>{c.match}%</span>
                        <span className="truncate whitespace-nowrap tabular-nums text-ink-2" title={c.agreed ? "Agreed fee" : "Quoted fee"}>{c.agreed ? <><strong className="font-semibold text-ink">₹{c.agreed.toLocaleString("en-IN")}</strong> agreed</> : c.quoted ? <>₹{c.quoted.toLocaleString("en-IN")} quoted</> : "No quote"}</span>
                      </div>
                      <div className="mt-2 truncate text-[11.5px] text-mute">{c.source === "invited" ? "Invited · " : ""}{c.brief}</div>
                      {c.sharedWithBrand && (
                        <div title={c.brandNote ?? undefined} className={clsx("mt-1.5 inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          c.brandDecision === "approved" ? "bg-ok-bg text-ok" : c.brandDecision === "passed" ? "bg-bad-bg text-bad" : c.brandDecision === "question" ? "bg-warn-bg text-warn" : "bg-cobalt-50 text-cobalt-700")}>
                          {c.brandDecision === "approved" ? "Brand approved" : c.brandDecision === "passed" ? "Brand passed" : c.brandDecision === "question" ? `Brand asked: ${c.brandNote ?? "a question"}` : "With brand"}
                          {c.brandFee ? <span className="font-medium opacity-75"> · ₹{c.brandFee.toLocaleString("en-IN")}</span> : null}
                        </div>
                      )}
                      {canManage && (
                        <div className="mt-2 flex items-center gap-1 border-t border-line pt-2" data-menu>
                          <button onClick={() => si > 0 && move(c.id, STAGES[si - 1])} disabled={si === 0} aria-label={`Move ${c.name} back to ${si > 0 ? STAGE_LABEL[STAGES[si - 1]] : ""}`} className="grid h-7 w-7 place-items-center rounded-full text-mute hover:bg-canvas-2 hover:text-ink disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                          <button onClick={() => si < STAGES.length - 1 && move(c.id, STAGES[si + 1])} disabled={si === STAGES.length - 1} aria-label={`Advance ${c.name} to ${si < 5 ? STAGE_LABEL[STAGES[si + 1]] : ""}`}
                            className="inline-flex h-7 items-center gap-0.5 rounded-[6px] px-2 text-[12px] font-semibold text-cobalt hover:bg-cobalt-50 disabled:opacity-30">
                            {si < 5 ? STAGE_LABEL[STAGES[si + 1]] : "Done"} <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                          <span className="relative ml-auto">
                            <button onClick={() => setMenu(menu === c.id ? null : c.id)} aria-haspopup="menu" aria-expanded={menu === c.id} aria-label={`Move ${c.name} to stage`} className="grid h-7 w-7 place-items-center rounded-full text-mute hover:bg-canvas-2 hover:text-ink"><Ellipsis className="h-4 w-4" /></button>
                            {menu === c.id && <MoveMenu current={c.stage} onPick={(st) => move(c.id, st)} />}
                          </span>
                        </div>
                      )}
                    </div>
                    </motion.li>
                  ))}
                  {col.length === 0 && <li className="grid flex-1 place-items-center rounded-[14px] border border-dashed border-line-2 px-3 py-6 text-center text-[12px] text-faint">Drop creators here</li>}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </LayoutGroup>
  );
}

function MoveMenu({ current, onPick }: { current: PipelineStage; onPick: (s: PipelineStage) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus(); }, []);
  return (
    <div ref={ref} role="menu" data-menu className="absolute bottom-9 right-0 z-30 w-44 rounded-[14px] border border-line bg-surface p-1 shadow-lg"
      onKeyDown={(e) => {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
        e.preventDefault();
        const items = [...(ref.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [])];
        const i = items.indexOf(document.activeElement as HTMLButtonElement);
        items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
      }}>
      <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">Move to</div>
      {STAGES.map((s) => (
        <button key={s} role="menuitem" disabled={s === current} onClick={() => onPick(s)}
          className="flex h-8 w-full items-center gap-2 rounded-[10px] px-2.5 text-left text-[13px] text-ink-2 hover:bg-cobalt-50 hover:text-cobalt-700 focus:bg-cobalt-50 focus:outline-none disabled:text-faint disabled:hover:bg-transparent">
          <span className={clsx("h-2 w-2 rounded-full", DOT[s])} />{STAGE_LABEL[s]}{s === current && <span className="ml-auto text-[11px]">Current</span>}
        </button>
      ))}
    </div>
  );
}
