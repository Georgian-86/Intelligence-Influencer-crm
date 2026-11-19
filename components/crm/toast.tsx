"use client";

import { AnimatePresence, motion } from "motion/react";
import { CircleCheck, CircleAlert } from "lucide-react";
import { useEffect, useState } from "react";

type T = { id: number; msg: string; tone: "ok" | "error"; action?: { label: string; href: string } };
const EVT = "crm:toast";
let seq = 0;

/** Fire-and-forget toast from any client component. */
export function toast(msg: string, opts: { tone?: "ok" | "error"; action?: { label: string; href: string } } = {}) {
  window.dispatchEvent(new CustomEvent<T>(EVT, { detail: { id: ++seq, msg, tone: opts.tone ?? "ok", action: opts.action } }));
}

export function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const t = (e as CustomEvent<T>).detail;
      setItems((s) => [...s.slice(-2), t]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), 4200);
    };
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex min-h-11 items-center gap-2.5 rounded-full bg-night py-2 pl-3.5 pr-2 text-[13.5px] font-medium text-white shadow-lg">
            {t.tone === "ok" ? <CircleCheck className="h-4 w-4 text-mint" /> : <CircleAlert className="h-4 w-4 text-flame" />}
            <span className="pr-1.5">{t.msg}</span>
            {t.action && <a href={t.action.href} className="rounded-full bg-white/12 px-3 py-1 text-[12.5px] font-semibold hover:bg-white/20">{t.action.label}</a>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
