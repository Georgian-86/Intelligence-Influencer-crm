import { clsx } from "clsx";
import { Check } from "lucide-react";
import { PHASES, type Phase } from "@/lib/demo/portal";

export const shortDate = (iso: string) => new Date(iso + (iso.length === 10 ? "T00:00:00Z" : "")).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
export const TODAY = "2026-11-19";

/** Six-step campaign phase rail: Brief → Report. */
export function PhaseRail({ phase, className }: { phase: Phase; className?: string }) {
  const at = PHASES.findIndex((p) => p.key === phase);
  return (
    <ol className={clsx("grid grid-cols-6 gap-1", className)} aria-label={`Campaign phase: ${PHASES[at].label}`}>
      {PHASES.map((p, i) => {
        const done = i < at, now = i === at;
        return (
          <li key={p.key} className={clsx("min-w-0", now && "max-sm:overflow-visible")} aria-current={now ? "step" : undefined}>
            <div className={clsx("h-1.5 rounded-full", done ? "bg-cobalt" : now ? "bg-[linear-gradient(90deg,var(--color-cobalt)_50%,var(--color-cobalt-100)_50%)]" : "bg-canvas-2")} />
            <div className={clsx("mt-2 items-center gap-1 truncate text-[11.5px]", now ? "flex font-semibold text-ink" : done ? "hidden text-ink-2 sm:flex" : "hidden text-faint sm:flex")}>
              {done && <Check className="h-3 w-3 shrink-0 text-cobalt" strokeWidth={2.6} aria-hidden />}
              {now && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-flame" aria-hidden />}
              <span className="truncate">{p.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function PageTitle({ title, subtitle, actions, eyebrow }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[13px] text-mute">{eyebrow}</div>}
        <h1 className="text-[24px] leading-tight sm:text-[26px]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[14.5px] text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
