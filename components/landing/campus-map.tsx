"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { clsx } from "clsx";
import { ArrowUpRight, GraduationCap } from "lucide-react";

export type MapCity = {
  slug: string; name: string; lat: number; lng: number; creators: number; campuses: number;
  colleges: { slug: string; name: string; short?: string }[];
};

const W = 340, H = 380;
const project = (lat: number, lng: number) => ({ x: 24 + ((lng - 70.5) / (90 - 70.5)) * (W - 48), y: 20 + ((32 - lat) / (32 - 11)) * (H - 40) });
const EASE = [0.16, 1, 0.3, 1] as const;

/** Abstract constellation of launch cities (projected from lat/long) → colleges in the selected city. */
export function CampusMap({ cities }: { cities: MapCity[] }) {
  const [sel, setSel] = useState(0);
  const reduce = useReducedMotion();
  const c = cities[sel];
  const pts = cities.map((x) => project(x.lat, x.lng));
  const p = pts[sel];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10">
      <div className="relative overflow-hidden rounded-[36px] bg-night p-4 text-white sm:p-6">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_30%,rgb(43_75_255/.35),transparent_70%)]" />
        <svg viewBox={`0 0 ${W} ${H}`} className="relative mx-auto block h-auto w-full max-w-[420px]" role="group" aria-label="Launch cities">
          <defs>
            <radialGradient id="cm-glow"><stop offset="0" stopColor="#7CF3D6" stopOpacity=".7" /><stop offset="1" stopColor="#7CF3D6" stopOpacity="0" /></radialGradient>
          </defs>
          {/* faint lat/long grid */}
          {Array.from({ length: 8 }, (_, i) => <line key={`h${i}`} x1="0" x2={W} y1={i * 50 + 15} y2={i * 50 + 15} stroke="white" strokeOpacity=".06" />)}
          {Array.from({ length: 7 }, (_, i) => <line key={`v${i}`} y1="0" y2={H} x1={i * 52 + 14} x2={i * 52 + 14} stroke="white" strokeOpacity=".06" />)}
          {/* links from the selected city */}
          {pts.map((q, i) => i !== sel && (
            <line key={`l${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#8EA2FF" strokeOpacity=".22" strokeDasharray="2 4" />
          ))}
          <circle cx={p.x} cy={p.y} r="34" fill="url(#cm-glow)" />
          {cities.map((x, i) => {
            const q = pts[i];
            const on = i === sel;
            return (
              <g key={x.slug}>
                <circle cx={q.x} cy={q.y} r={on ? 7 : 4.5} fill={on ? "#7CF3D6" : "#DCE5FF"} />
                {on && !reduce && (
                  <circle cx={q.x} cy={q.y} r="7" fill="none" stroke="#7CF3D6" strokeWidth="1.5">
                    <animate attributeName="r" from="7" to="22" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from=".9" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <text x={["mumbai", "bangalore"].includes(x.slug) ? q.x - 10 : q.x + 10} y={q.y + 4} textAnchor={["mumbai", "bangalore"].includes(x.slug) ? "end" : "start"} fill="white" fillOpacity={on ? 1 : 0.6} fontSize="11" fontWeight={on ? 700 : 500} fontFamily="var(--font-sans)">{x.name}</text>
                <circle
                  cx={q.x} cy={q.y} r="16" fill="transparent" className="cursor-pointer"
                  onClick={() => setSel(i)} aria-hidden
                />
              </g>
            );
          })}
        </svg>
        <div className="relative mt-2 flex items-end justify-between gap-4 px-2">
          <div>
            <div className="text-[12px] text-white/60">Selected city</div>
            <div className="font-display text-[26px] font-bold tracking-[-0.03em]">{c.name}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-[26px] font-bold tabular-nums tracking-[-0.03em] text-mint">{c.creators.toLocaleString("en-IN")}</div>
            <div className="text-[12px] text-white/60">creators · {c.campuses} campuses</div>
          </div>
        </div>
      </div>

      <div>
        <div role="group" aria-label="Choose a city" className="flex flex-wrap gap-2">
          {cities.map((x, i) => (
            <button
              key={x.slug} type="button" aria-pressed={i === sel} onClick={() => setSel(i)}
              className={clsx("h-10 rounded-full border px-4 text-[14px] font-medium transition-[background-color,border-color,color] duration-200",
                i === sel ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2 hover:border-line-2 hover:text-ink")}
            >
              {x.name}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-[28px] border border-line bg-surface p-5 shadow-sm sm:p-6" aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-ink">Campuses in {c.name}</h3>
            <Link href={`/creators/${c.slug}`} className="inline-flex items-center gap-1 text-[14px] font-semibold text-cobalt hover:underline">
              Creators in {c.name} <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.ul
              key={c.slug}
              initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="mt-4 grid gap-2 sm:grid-cols-2"
            >
              {c.colleges.slice(0, 10).map((col) => (
                <li key={col.slug}>
                  <Link href={`/colleges/${col.slug}`} className="group flex min-h-12 items-center gap-3 rounded-2xl border border-line px-3 py-2 transition-[border-color,background-color] duration-150 hover:border-cobalt-200 hover:bg-cobalt-50">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-canvas text-cobalt"><GraduationCap className="h-4 w-4" aria-hidden /></span>
                    <span className="min-w-0 text-[14px] font-medium leading-snug text-ink">{col.short ?? col.name}<span className="block truncate text-[12px] font-normal text-mute">{col.name}</span></span>
                  </Link>
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>
          {c.colleges.length > 10 && <p className="mt-3 text-[13px] text-mute">+ {c.colleges.length - 10} more campuses listed in {c.name}</p>}
        </div>
      </div>
    </div>
  );
}
