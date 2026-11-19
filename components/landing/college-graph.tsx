"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { GraduationCap, MapPin, Search } from "lucide-react";
import { clsx } from "clsx";
import { CITIES } from "@/lib/constants";
import { CAMPUS_TYPES } from "@/components/landing/data";

const EASE = [0.2, 0.8, 0.2, 1] as const;
const R = 37; // node radius in % of the square stage

const NODES = CAMPUS_TYPES.map((label, i) => {
  const a = ((-90 + i * 60) * Math.PI) / 180;
  return { label, x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) };
});

// Small "talent" dots sprinkled around each campus node (deterministic, so SSR and client match).
const DOTS = NODES.flatMap((n, i) =>
  [0, 1, 2].map((k) => {
    const a = ((i * 60 + k * 120 + 25) * Math.PI) / 180;
    const d = 7 + ((i + k) % 3) * 2;
    return { x: n.x + d * Math.cos(a), y: n.y + d * Math.sin(a), c: (i + k) % 4 };
  }),
);
const DOT_COLORS = ["#FF8A3D", "#38BDF8", "#F5C542", "#22C55E"];

export function CollegeGraph() {
  const [city, setCity] = useState<string>(CITIES[0]);
  const reduce = useReducedMotion();

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
      <div>
        <fieldset>
          <legend className="text-sm font-medium text-mute">Pick a city</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-2">
            {CITIES.map((c) => {
              const on = c === city;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCity(c)}
                  className={clsx(
                    "flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-sm font-medium transition-[border-color,background-color,color] duration-150",
                    on ? "border-brand/60 bg-brand/10 text-fog" : "border-line bg-ink-2/60 text-mute hover:border-line-2 hover:text-fog",
                  )}
                >
                  <MapPin className={clsx("h-4 w-4 shrink-0", on ? "text-brand" : "text-mute")} aria-hidden="true" />
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="card mt-6 p-4" aria-live="polite">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-mute">
            <Search className="h-3.5 w-3.5" aria-hidden="true" /> Example query
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Food & lifestyle creators", `${city} campuses`, "Class of 2027–28", "ER above 4%"].map((t, i) => (
              <span key={t} className={clsx("chip px-3 py-1 text-[13px]", i === 1 && "border-brand/50 text-brand-2")}>{t}</span>
            ))}
          </div>
          <p className="mt-3 text-sm text-mute">One filter instead of weeks of re-scouting on Instagram and old spreadsheets.</p>
        </div>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[480px]" role="img" aria-label={`Illustration of the college graph: ${city} connected to ${CAMPUS_TYPES.join(", ")} campuses`}>
        <div aria-hidden="true" className="absolute inset-[22%] rounded-full bg-brand/15 blur-3xl" />
        <motion.svg
          key={`lines-${city}`}
          aria-hidden="true"
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth="0.3" />
          <circle cx="50" cy="50" r={R + 10} fill="none" stroke="rgb(255 255 255 / 0.04)" strokeWidth="0.3" strokeDasharray="0.6 1.6" />
          {NODES.map((n) => (
            <line key={n.label} x1="50" y1="50" x2={n.x} y2={n.y} stroke="url(#cg-line)" strokeWidth="0.35" />
          ))}
          {DOTS.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="0.9" fill={DOT_COLORS[d.c]} opacity="0.85" />
          ))}
          <defs>
            <linearGradient id="cg-line" gradientUnits="userSpaceOnUse" x1="50" y1="50" x2="50" y2="13">
              <stop offset="0" stopColor="#FF6A1A" stopOpacity="0.7" />
              <stop offset="1" stopColor="#FF6A1A" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </motion.svg>

        <div aria-hidden="true">
          <motion.div
            key={`hub-${city}`}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={reduce ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-brand/50 bg-ink-2 px-4 py-3 text-center shadow-[0_0_0_6px_rgb(255_106_26/0.08),0_20px_40px_-16px_rgb(255_106_26/0.6)]">
              <MapPin className="h-4 w-4 text-brand" />
              <span className="font-display text-base font-bold text-fog sm:text-lg">{city}</span>
            </div>
          </motion.div>

          {NODES.map((n, i) => (
            <div key={n.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
              <motion.div
                key={`${city}-${n.label}`}
                initial={reduce ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.05 + i * 0.04 }}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line-2 bg-ink-3/95 px-2.5 py-1.5 text-xs font-medium text-fog shadow-[0_10px_24px_-12px_rgb(0_0_0/0.9)] sm:px-3 sm:text-[13px]"
              >
                <GraduationCap className="h-3.5 w-3.5 text-brand-2" />
                {n.label}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
