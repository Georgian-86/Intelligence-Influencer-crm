export { Logo } from "@/components/brand/logo";
import type { ReactNode } from "react";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.035em]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const tone: Record<string, string> = {
  pending: "border-transparent bg-warn-bg text-warn",
  screening: "border-transparent bg-info-bg text-info",
  approved: "border-transparent bg-ok-bg text-ok",
  rejected: "border-transparent bg-bad-bg text-bad",
  suspended: "border-transparent bg-bad-bg text-bad",
  draft: "border-line bg-canvas text-mute",
  open: "border-transparent bg-ok-bg text-ok",
  closed: "border-line bg-canvas text-mute",
  planning: "border-line bg-canvas text-ink-2",
  active: "border-transparent bg-cobalt-50 text-cobalt-700",
  completed: "border-transparent bg-ok-bg text-ok",
  interested: "border-transparent bg-info-bg text-info",
  shortlisted: "border-transparent bg-cobalt-50 text-cobalt-700",
  contacted: "border-transparent bg-cobalt-100 text-cobalt-800",
  negotiating: "border-transparent bg-warn-bg text-warn",
  confirmed: "border-transparent bg-ok-bg text-ok",
  delivered: "border-transparent bg-ok text-white",
  dropped: "border-line bg-canvas text-mute",
  bronze: "border-bronze/30 bg-[#f6ebe1] text-bronze",
  silver: "border-silver/30 bg-[#eef0f4] text-silver",
  gold: "border-gold/30 bg-[#fbf3d9] text-gold",
  platinum: "border-platinum/30 bg-[#e1f3f8] text-platinum",
  new: "border-transparent bg-flame-50 text-flame-700",
  in_progress: "border-transparent bg-info-bg text-info",
  converted: "border-transparent bg-ok-bg text-ok",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return <span className={`chip capitalize ${tone[value] ?? ""}`}>{label ?? value.replace("_", " ")}</span>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-[12px] font-medium text-mute">{label}</div>
      <div className="mt-1.5 font-display text-[28px] font-bold leading-none tracking-[-0.03em] tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-mute">{hint}</div>}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-10 text-center">
      <div className="font-display text-lg font-semibold">{title}</div>
      {children && <div className="text-sm text-mute">{children}</div>}
    </div>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "ok"; children: ReactNode }) {
  const c = kind === "error" ? "bg-bad-bg text-bad" : kind === "ok" ? "bg-ok-bg text-ok" : "bg-info-bg text-info";
  return <div role={kind === "error" ? "alert" : "status"} className={`rounded-[12px] px-3.5 py-2.5 text-sm ${c}`}>{children}</div>;
}

export function CheckGroup({ name, options, selected = [], columns = 2 }: { name: string; options: readonly string[]; selected?: string[]; columns?: number }) {
  return (
    <div className={`grid gap-1.5 ${columns === 3 ? "sm:grid-cols-3" : columns === 1 ? "" : "sm:grid-cols-2"}`}>
      {options.map((o) => (
        <label key={o} className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={name} value={o} defaultChecked={selected.includes(o)} className="accent-cobalt" />
          {o}
        </label>
      ))}
    </div>
  );
}

export function fmtNum(n?: number | null) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return String(Math.round(n));
}

export function fmtINR(n?: number | null) {
  return n == null ? "—" : `₹${n.toLocaleString("en-IN")}`;
}

/** Route Instagram CDN images through /api/img (they can't be hot-linked). */
export function imgSrc(url?: string | null) {
  return url ? `/api/img?u=${encodeURIComponent(url)}` : "";
}
