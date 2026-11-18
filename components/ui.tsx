import Link from "next/link";
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
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const tone: Record<string, string> = {
  pending: "border-warn/40 text-warn",
  screening: "border-info/40 text-info",
  approved: "border-ok/40 text-ok",
  rejected: "border-bad/40 text-bad",
  suspended: "border-bad/40 text-bad",
  draft: "border-line text-mute",
  open: "border-ok/40 text-ok",
  closed: "border-line text-mute",
  interested: "border-info/40 text-info",
  shortlisted: "border-brand/50 text-brand",
  contacted: "border-brand/50 text-brand-2",
  negotiating: "border-warn/40 text-warn",
  confirmed: "border-ok/40 text-ok",
  delivered: "border-ok/60 text-ok",
  dropped: "border-line text-mute",
  bronze: "border-[#cd7f32]/60 text-[#e0a36b]",
  silver: "border-[#c0c0c0]/60 text-[#d6d6d6]",
  gold: "border-[#ffd700]/60 text-[#ffd700]",
  platinum: "border-[#b4f0ff]/60 text-[#b4f0ff]",
  new: "border-brand/50 text-brand",
  in_progress: "border-info/40 text-info",
  converted: "border-ok/40 text-ok",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return <span className={`chip capitalize ${tone[value] ?? ""}`}>{label ?? value.replace("_", " ")}</span>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-mute">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-mute">{hint}</div>}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-10 text-center">
      <div className="font-semibold">{title}</div>
      {children && <div className="text-sm text-mute">{children}</div>}
    </div>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "ok"; children: ReactNode }) {
  const c = kind === "error" ? "border-bad/40 bg-bad/10 text-bad" : kind === "ok" ? "border-ok/40 bg-ok/10 text-ok" : "border-info/30 bg-info/10 text-info";
  return <div className={`rounded-lg border px-3 py-2 text-sm ${c}`}>{children}</div>;
}

export function CheckGroup({ name, options, selected = [], columns = 2 }: { name: string; options: readonly string[]; selected?: string[]; columns?: number }) {
  return (
    <div className={`grid gap-1.5 ${columns === 3 ? "sm:grid-cols-3" : columns === 1 ? "" : "sm:grid-cols-2"}`}>
      {options.map((o) => (
        <label key={o} className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={name} value={o} defaultChecked={selected.includes(o)} className="accent-[#ff6a1a]" />
          {o}
        </label>
      ))}
    </div>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold tracking-tight">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-sm font-black text-black">V</span>
      <span>Vigor <span className="text-brand">Talent Network</span></span>
    </Link>
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
