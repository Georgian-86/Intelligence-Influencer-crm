import Link from "next/link";
import { clsx } from "clsx";
import { ArrowRight, Clock, Timer } from "lucide-react";
import type { ReactNode } from "react";
import { daysUntil, STAGE_COPY } from "@/app/dashboard/_lib/score";

/** Brand monogram tile (brands rarely give us logos for confidential briefs). */
export function BrandTile({ name, hue, size = 44, className }: { name: string; hue: number; size?: number; className?: string }) {
  const letter = name.replace(/[^A-Za-z0-9]/g, "").slice(0, 1).toUpperCase() || "•";
  return (
    <span aria-hidden className={clsx("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-[10px] font-display font-bold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(150deg, hsl(${hue} 80% 62%), hsl(${(hue + 40) % 360} 70% 42%))` }}>
      <span className="absolute inset-0 bg-[radial-gradient(70%_60%_at_25%_20%,rgb(255_255_255/.4),transparent)]" />
      <span className="relative">{letter}</span>
    </span>
  );
}

export function Deadline({ date, label = "left", className }: { date: string | null; label?: string; className?: string }) {
  const d = daysUntil(date);
  if (d == null) return null;
  const closed = d < 0, urgent = d >= 0 && d <= 2;
  return (
    <span className={clsx("inline-flex h-6 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium tabular-nums",
      closed ? "bg-canvas-2 text-mute" : urgent ? "bg-flame-50 text-flame-700" : "bg-canvas-2 text-ink-2", className)}>
      {urgent ? <Timer className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      {closed ? "Closed" : d === 0 ? "Closes today" : `${d} day${d === 1 ? "" : "s"} ${label}`}
    </span>
  );
}

export const payout = (min: number | null, max: number | null) =>
  min || max ? `₹${(min ?? max)!.toLocaleString("en-IN")}${max && min && max !== min ? `–${max.toLocaleString("en-IN")}` : ""}` : "Fee on discussion";

export function MatchBadge({ value, className }: { value: number; className?: string }) {
  const tone = value >= 85 ? "bg-ok-bg text-ok" : value >= 70 ? "bg-cobalt-50 text-cobalt-700" : "bg-canvas-2 text-ink-2";
  return <span className={clsx("inline-flex h-6 items-center rounded-[6px] px-2 text-[12px] font-semibold tabular-nums", tone, className)}>{value}% match</span>;
}

export function StageChip({ stage, className }: { stage: string; className?: string }) {
  const s = STAGE_COPY[stage] ?? STAGE_COPY.interested;
  return <span className={clsx("inline-flex h-6 items-center gap-1.5 rounded-[6px] px-2 text-[12px] font-medium", s.tone, className)}><span className="h-1.5 w-1.5 rounded-full bg-current" />{s.label}</span>;
}

export function SectionHead({ title, sub, href, cta, className }: { title: ReactNode; sub?: ReactNode; href?: string; cta?: string; className?: string }) {
  return (
    <div className={clsx("mb-3 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{title}</h2>
        {sub && <p className="mt-0.5 text-[13.5px] text-mute">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex min-h-9 shrink-0 items-center gap-1 text-[13.5px] font-medium text-cobalt hover:underline">
          {cta ?? "See all"} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
