"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Clapperboard, Inbox, MessageCircleReply, TimerOff, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/kit";
import { WhatsAppIcon } from "@/components/brand/icons";
import { toast } from "./toast";
import type { QueueItem } from "@/lib/demo/crm";

const KIND = {
  review: { label: "Drafts to review", short: "Reviews", Icon: Clapperboard, tone: "bg-cobalt-50 text-cobalt" },
  overdue: { label: "Overdue", short: "Overdue", Icon: TimerOff, tone: "bg-bad-bg text-bad" },
  enquiry: { label: "New enquiries", short: "Enquiries", Icon: Inbox, tone: "bg-flame-50 text-flame-700" },
  reply: { label: "Creators awaiting reply", short: "Replies", Icon: MessageCircleReply, tone: "bg-warn-bg text-warn" },
} as const;

export function NeedsQueue({ items }: { items: QueueItem[] }) {
  const [done, setDone] = useState<string[]>([]);
  const [filter, setFilter] = useState<keyof typeof KIND | "all">("all");
  const reduce = useReducedMotion();
  const open = items.filter((i) => !done.includes(i.id));
  const shown = useMemo(() => open.filter((i) => filter === "all" || i.kind === filter), [open, filter]);
  const counts = (Object.keys(KIND) as (keyof typeof KIND)[]).map((k) => [k, open.filter((i) => i.kind === k).length] as const);

  const complete = (id: string) => {
    setDone((d) => [...d, id]);
    toast("Marked done");
  };

  return (
    <section className="card overflow-hidden" aria-labelledby="needs-h">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 id="needs-h" className="flex items-center gap-2 font-display text-[17px] font-semibold tracking-[-0.025em]">
          Needs you now
          <span className="relative grid h-5 min-w-5 place-items-center rounded-full bg-flame px-1.5 font-sans text-[11.5px] font-bold tabular-nums text-night">{open.length}</span>
        </h2>
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Filter queue">
          {[["all", open.length] as const, ...counts].map(([k, n]) => (
            <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
              className={clsx("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors",
                filter === k ? "bg-night text-white" : "text-mute hover:bg-canvas-2 hover:text-ink")}>
              {k === "all" ? "All" : KIND[k].short}
              <span className={clsx("tabular-nums", filter === k ? "text-white/60" : "text-faint")}>{n}</span>
            </button>
          ))}
        </div>
      </header>
      <ul className="divide-y divide-line" aria-live="polite">
        <AnimatePresence initial={false}>
          {shown.map((i) => {
            const k = KIND[i.kind];
            const external = i.href.startsWith("http");
            return (
              <motion.li key={i.id} layout={!reduce} initial={false} exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-canvas/60">
                <span className={clsx("grid h-9 w-9 shrink-0 place-items-center rounded-[10px]", k.tone)} title={k.label}>
                  <k.Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-semibold text-ink">{i.title}</span>
                    <span className="shrink-0 text-[12px] tabular-nums text-faint">{i.age}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-mute">
                    <Avatar name={i.who} hue={i.hue} size={16} />
                    <span className="truncate">{i.meta}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {i.secondary && <Link href={i.secondary.href} className="btn-quiet btn-sm hidden md:inline-flex">{i.secondary.label}</Link>}
                  {external ? (
                    <a href={i.href} target="_blank" rel="noreferrer" onClick={() => complete(i.id)} className="btn btn-sm bg-[#e4f6ea] text-[#0d6b3a] hover:bg-[#d3f0dd]">
                      <WhatsAppIcon className="h-4 w-4" /><span className="hidden sm:inline">{i.action}</span><span className="sm:hidden">Nudge</span>
                    </a>
                  ) : (
                    <Link href={i.href} className="btn-ghost btn-sm">{i.action}</Link>
                  )}
                  <button onClick={() => complete(i.id)} aria-label={`Mark "${i.title}" done`}
                    className="grid h-9 w-9 place-items-center rounded-full text-faint transition-colors hover:bg-ok-bg hover:text-ok">
                    <Check className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {shown.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ok-bg text-ok"><Check className="h-5 w-5" strokeWidth={2.4} /></span>
          <div className="font-display text-[16px] font-semibold">Queue clear</div>
          <p className="text-[13px] text-mute">Nothing waiting on you here. New drafts and replies land in this list.</p>
          {done.length > 0 && (
            <button onClick={() => setDone([])} className="btn-quiet btn-sm mt-1"><Undo2 className="h-3.5 w-3.5" /> Restore {done.length} done</button>
          )}
        </div>
      )}
    </section>
  );
}
