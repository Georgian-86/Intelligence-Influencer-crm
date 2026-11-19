/**
 * Shared presentational kit (server-safe). Every workspace — creator, brand, agency, admin —
 * composes from these so the product feels like one system. See docs/brand/BRAND_GUIDELINES.md.
 */
import { clsx } from "clsx";
import type { ReactNode } from "react";

/* ---------- Avatar: gradient initials (no third-party images needed) ---------- */
export function Avatar({ name, hue = 228, size = 36, ring = false, className }: { name: string; hue?: number; size?: number; ring?: boolean; className?: string }) {
  const initials = name.replace(/[@._]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <span
      aria-hidden
      className={clsx("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-display font-semibold text-white", ring && "ring-2 ring-surface", className)}
      style={{
        width: size, height: size, fontSize: Math.max(10, size * 0.36),
        background: `radial-gradient(120% 120% at 25% 20%, hsl(${hue} 95% 72%), hsl(${(hue + 40) % 360} 80% 52%) 55%, hsl(${(hue + 70) % 360} 70% 30%))`,
      }}
    >
      {initials}
    </span>
  );
}

export function AvatarStack({ people, max = 4, size = 28 }: { people: { name: string; hue?: number }[]; max?: number; size?: number }) {
  return (
    <span className="flex -space-x-2">
      {people.slice(0, max).map((p, i) => <Avatar key={i} name={p.name} hue={p.hue} size={size} ring />)}
      {people.length > max && (
        <span className="inline-grid place-items-center rounded-full bg-canvas-2 text-[11px] font-semibold text-ink-2 ring-2 ring-surface" style={{ width: size, height: size }}>
          +{people.length - max}
        </span>
      )}
    </span>
  );
}

/* ---------- Sparkline (pure SVG, no chart lib) ---------- */
export function Sparkline({ data, className, stroke = "var(--color-cobalt)", fill = true, height = 36 }: { data: number[]; className?: string; stroke?: string; fill?: boolean; height?: number }) {
  if (data.length < 2) return null;
  const w = 120, h = height, min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const gid = `sg${Math.abs(data.reduce((a, b) => a + b, 0)) % 99991}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={clsx("h-9 w-full", className)} aria-hidden>
      {fill && (
        <>
          <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={stroke} stopOpacity=".22" /><stop offset="1" stopColor={stroke} stopOpacity="0" /></linearGradient></defs>
          <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#${gid})`} />
        </>
      )}
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={pts.at(-1)![0]} cy={pts.at(-1)![1]} r="2.6" fill={stroke} />
    </svg>
  );
}

/* ---------- Metric tile ---------- */
export function Metric({ label, value, delta, hint, spark, icon, tone = "default", className }: {
  label: string; value: ReactNode; delta?: number | null; hint?: ReactNode; spark?: number[]; icon?: ReactNode; tone?: "default" | "night" | "cobalt"; className?: string;
}) {
  const night = tone === "night", cobalt = tone === "cobalt";
  return (
    <div className={clsx("relative overflow-hidden rounded-[20px] border p-4 sm:p-5",
      night ? "border-white/10 bg-night text-white" : cobalt ? "border-cobalt-600 bg-cobalt text-white" : "border-line bg-surface shadow-sm", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className={clsx("text-[13px] font-medium", night || cobalt ? "text-white/70" : "text-mute")}>{label}</span>
        {icon && <span className={clsx("grid h-8 w-8 place-items-center rounded-full", night || cobalt ? "bg-white/10" : "bg-canvas")}>{icon}</span>}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="font-display text-[30px] font-bold leading-none tracking-[-0.035em] tabular-nums">{value}</span>
        {delta != null && <Delta value={delta} onDark={night || cobalt} />}
      </div>
      {hint && <div className={clsx("mt-1.5 text-[12px]", night || cobalt ? "text-white/60" : "text-mute")}>{hint}</div>}
      {spark && <Sparkline data={spark} className="mt-3" stroke={night || cobalt ? "#fff" : undefined} />}
    </div>
  );
}

export function Delta({ value, onDark = false, suffix = "%" }: { value: number; onDark?: boolean; suffix?: string }) {
  const up = value >= 0;
  return (
    <span className={clsx("mb-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
      onDark ? "bg-white/12 text-white" : up ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad")}>
      <svg viewBox="0 0 10 10" className={clsx("h-2.5 w-2.5", !up && "rotate-180")} aria-hidden><path d="M5 1.5 9 7H1z" fill="currentColor" /></svg>
      {Math.abs(value)}{suffix}
      <span className="sr-only">{up ? "increase" : "decrease"}</span>
    </span>
  );
}

/* ---------- Progress ---------- */
export function Progress({ value, className, tone = "cobalt", label }: { value: number; className?: string; tone?: "cobalt" | "flame" | "ok" | "warn" | "bad"; label?: string }) {
  const c = { cobalt: "bg-cobalt", flame: "bg-flame", ok: "bg-ok", warn: "bg-[#f0a43a]", bad: "bg-bad" }[tone];
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={clsx("h-1.5 w-full overflow-hidden rounded-full bg-canvas-2", className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={clsx("h-full rounded-full transition-[width] duration-700 ease-out-expo", c)} style={{ width: `${v}%` }} />
    </div>
  );
}

/* ---------- Section card with header ---------- */
export function Panel({ title, action, children, className, bodyClass, subtitle }: { title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={clsx("card overflow-hidden", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <div>
            {title && <h2 className="font-display text-[16px] font-semibold tracking-[-0.02em]">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[12.5px] text-mute">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={clsx(title || action ? "px-5 pb-5" : "p-5", bodyClass)}>{children}</div>
    </section>
  );
}

/* ---------- Media tile: stands in for IG thumbnails ---------- */
export function MediaTile({ hue, type, views, className }: { hue: number; type?: string; views?: number; className?: string }) {
  return (
    <div className={clsx("group relative aspect-[4/5] overflow-hidden rounded-[14px]", className)}
      style={{ background: `linear-gradient(160deg, hsl(${hue} 85% 78%), hsl(${(hue + 50) % 360} 70% 52%) 60%, hsl(${(hue + 90) % 360} 60% 28%))` }}>
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_25%,rgb(255_255_255/.45),transparent)] transition-opacity duration-500 group-hover:opacity-70" />
      {type === "reel" && (
        <svg viewBox="0 0 24 24" className="absolute right-2 top-2 h-4 w-4 text-white drop-shadow" aria-hidden><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
      )}
      {views != null && (
        <span className="absolute bottom-2 left-2 rounded-full bg-black/35 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
          {compact(views)} views
        </span>
      )}
    </div>
  );
}

export function compact(n?: number | null) {
  if (n == null) return "—";
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1).replace(/\.0$/, "")}Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(1).replace(/\.0$/, "")}L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}

/** International-style compact numbers (K/M) for social metrics. */
export function km(n?: number | null) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}

export const inr = (n?: number | null) => (n == null ? "—" : `₹${n.toLocaleString("en-IN")}`);

/* ---------- Segmented tabs (link-based, server-safe) ---------- */
export function Segmented({ items, active }: { items: { href: string; label: string; count?: number }[]; active: string }) {
  return (
    <nav className="inline-flex rounded-full border border-line bg-canvas-2/70 p-1" aria-label="Views">
      {items.map((i) => (
        <a key={i.href} href={i.href} aria-current={i.href === active ? "page" : undefined}
          className={clsx("inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors",
            i.href === active ? "bg-surface text-ink shadow-sm" : "text-mute hover:text-ink")}>
          {i.label}{i.count != null && <span className="tabular-nums text-faint">{i.count}</span>}
        </a>
      ))}
    </nav>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ title, body, action, icon }: { title: string; body?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-line-2 bg-surface/60 px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-cobalt-50 text-cobalt">{icon ?? <span className="text-xl">✦</span>}</div>
      <div className="font-display text-[17px] font-semibold">{title}</div>
      {body && <p className="max-w-sm text-[14px] text-mute">{body}</p>}
      {action}
    </div>
  );
}
