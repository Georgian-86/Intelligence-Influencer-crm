"use client";

import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Mail, Phone, Rocket } from "lucide-react";
import { useState, useTransition } from "react";
import { convertEnquiry, moveEnquiry } from "@/app/crm/actions";
import { BrandTile, ChannelBadge } from "./ui";
import { ago } from "./format";
import { toast } from "./toast";
import type { EnquiryVM } from "./types";

const COLS = [
  { key: "new", label: "New", dot: "bg-flame" },
  { key: "in_progress", label: "In progress", dot: "bg-cobalt" },
  { key: "converted", label: "Converted", dot: "bg-ok" },
] as const;
const hue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 360;

export function EnquiryBoard({ items: init, now, canConvert }: { items: EnquiryVM[]; now: number; canConvert: boolean }) {
  const [items, setItems] = useState(init);
  const [, start] = useTransition();
  const router = useRouter();
  const reduce = useReducedMotion();
  const set = (id: string, status: EnquiryVM["status"]) => setItems((l) => l.map((e) => (e.id === id ? { ...e, status } : e)));

  const move = (e: EnquiryVM, status: EnquiryVM["status"]) => start(async () => {
    set(e.id, status);
    const r = await moveEnquiry(e.id, status);
    if (!r.ok) { set(e.id, e.status); toast("Couldn't update", { tone: "error" }); }
  });
  const convert = (e: EnquiryVM) => start(async () => {
    const r = await convertEnquiry(e.id);
    if (r.ok) { set(e.id, "converted"); toast(`${e.company} converted to a campaign`, { action: { label: "Open", href: `/crm/campaigns/${r.campaignId}` } }); router.refresh(); }
    else toast(r.error ?? "Couldn't convert", { tone: "error" });
  });

  return (
    <LayoutGroup>
      <div className="grid gap-4 lg:grid-cols-3">
        {COLS.map((col) => {
          const list = items.filter((e) => e.status === col.key);
          return (
            <section key={col.key} aria-label={`${col.label} (${list.length})`} className="rounded-[14px] border border-line bg-canvas-2/50 p-2">
              <header className="flex items-center gap-2 px-2 pb-2 pt-1.5">
                <span className={clsx("h-2 w-2 rounded-full", col.dot)} /><h2 className="text-[13.5px] font-semibold">{col.label}</h2><span className="text-[12px] font-semibold tabular-nums text-mute">{list.length}</span>
              </header>
              <ul className="space-y-2">
                {list.map((e) => (
                  <motion.li key={e.id} layoutId={reduce ? undefined : e.id} layout={!reduce} transition={{ type: "spring", stiffness: 500, damping: 40 }} className="rounded-[12px] border border-line bg-surface p-4 shadow-xs">
                    <div className="flex items-start gap-3">
                      <BrandTile name={e.company} hue={hue(e.company)} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14.5px] font-semibold">{e.company}</div>
                        <div className="truncate text-[12.5px] text-mute">{e.contact}{e.city ? ` · ${e.city}` : ""} · {ago(e.received, now)} ago</div>
                      </div>
                      <ChannelBadge channel={e.channel} />
                    </div>
                    <p className="mt-3 line-clamp-3 text-[13px] leading-[1.5] text-ink-2">{e.message}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                      {e.budget && <span className="rounded-full bg-canvas-2 px-2 py-0.5 font-semibold tabular-nums text-ink">{e.budget}</span>}
                      {e.email && <a href={`mailto:${e.email}`} className="inline-flex items-center gap-1 text-mute hover:text-cobalt" aria-label={`Email ${e.contact}`}><Mail className="h-3.5 w-3.5" /></a>}
                      {e.phone && <a href={`https://wa.me/${e.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-mute hover:text-cobalt" aria-label={`Message ${e.contact}`}><Phone className="h-3.5 w-3.5" /></a>}
                      <span className="ml-auto flex gap-1.5">
                        {e.status === "new" && <button onClick={() => move(e, "in_progress")} className="btn-quiet btn-sm h-8">Start <ArrowRight className="h-3.5 w-3.5" /></button>}
                        {e.status !== "converted" && canConvert && <button onClick={() => convert(e)} className="btn-ghost btn-sm h-8"><Rocket className="h-3.5 w-3.5" /> Convert to campaign</button>}
                        {e.status === "converted" && <span className="text-[12px] font-semibold text-ok">Campaign created</span>}
                      </span>
                    </div>
                  </motion.li>
                ))}
                {list.length === 0 && <li className="rounded-[12px] border border-dashed border-line-2 px-4 py-8 text-center text-[12.5px] text-faint">Nothing here</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
