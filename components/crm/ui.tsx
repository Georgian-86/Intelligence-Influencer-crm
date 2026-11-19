/** CRM presentational primitives (server-safe). Compose with components/kit.tsx. */
import Link from "next/link";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Globe, Mail, OctagonAlert, Users2 } from "lucide-react";
import { InstagramIcon, WhatsAppIcon } from "@/components/brand/icons";
import { DELIVERABLE_LABEL, STAGE_LABEL } from "./format";
import type { Health } from "./types";

export function PageHeader({ title, subtitle, actions, back, meta }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: { href: string; label: string }; meta?: ReactNode }) {
  return (
    <header className="mb-6">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex h-7 items-center gap-1.5 rounded-full pr-2 text-[13px] font-medium text-mute transition-colors hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.035em] text-ink sm:text-[30px]">{title}</h1>
          {subtitle && <p className="mt-1 text-[14px] text-mute">{subtitle}</p>}
          {meta && <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

const HEALTH: Record<Health, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  on_track: { label: "On track", cls: "bg-ok-bg text-ok", Icon: CheckCircle2 },
  at_risk: { label: "At risk", cls: "bg-warn-bg text-warn", Icon: AlertTriangle },
  blocked: { label: "Blocked", cls: "bg-bad-bg text-bad", Icon: OctagonAlert },
};

export function HealthBadge({ health, className }: { health: Health; className?: string }) {
  const h = HEALTH[health];
  return (
    <span className={clsx("inline-flex h-6 items-center gap-1 rounded-full px-2 text-[12px] font-semibold", h.cls, className)}>
      <h.Icon className="h-3.5 w-3.5" strokeWidth={2.2} /> {h.label}
    </span>
  );
}

const DELIV_TONE: Record<string, string> = {
  brief_sent: "bg-canvas-2 text-ink-2",
  draft_submitted: "bg-cobalt-50 text-cobalt-700",
  changes_requested: "bg-warn-bg text-warn",
  approved: "bg-ok-bg text-ok",
  live: "bg-ok text-white",
  overdue: "bg-bad-bg text-bad",
};
const DELIV_DOT: Record<string, string> = {
  brief_sent: "bg-faint", draft_submitted: "bg-cobalt", changes_requested: "bg-warn", approved: "bg-ok", live: "bg-white", overdue: "bg-bad",
};

export function DeliverablePill({ status }: { status: string }) {
  return (
    <span className={clsx("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-semibold", DELIV_TONE[status] ?? "bg-canvas-2 text-ink-2")}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", DELIV_DOT[status] ?? "bg-faint")} aria-hidden />
      {DELIVERABLE_LABEL[status] ?? status}
    </span>
  );
}

const STAGE_TONE: Record<string, string> = {
  interested: "bg-canvas-2 text-ink-2", shortlisted: "bg-cobalt-50 text-cobalt-700", contacted: "bg-cobalt-100 text-cobalt-800",
  negotiating: "bg-warn-bg text-warn", confirmed: "bg-ok-bg text-ok", delivered: "bg-ok text-white", rejected: "bg-bad-bg text-bad", dropped: "bg-canvas-2 text-mute",
};
export function StagePill({ stage }: { stage: string }) {
  return <span className={clsx("inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-[12px] font-semibold", STAGE_TONE[stage] ?? "bg-canvas-2 text-ink-2")}>{STAGE_LABEL[stage] ?? stage}</span>;
}

const RANK_STYLE: Record<string, string> = {
  bronze: "border-bronze/25 bg-[#f6ebe1] text-bronze",
  silver: "border-silver/25 bg-[#eef0f4] text-silver",
  gold: "border-gold/25 bg-[#fbf3d9] text-[#8a6608]",
  platinum: "border-platinum/25 bg-[#e1f3f8] text-[#1d6c85]",
};
export function RankBadge({ rank, compact = false }: { rank: string; compact?: boolean }) {
  return (
    <span className={clsx("inline-flex h-[22px] items-center gap-1 rounded-full border px-2 text-[11.5px] font-semibold capitalize", RANK_STYLE[rank] ?? "border-line bg-canvas text-ink-2")} title={`${rank} rank`}>
      <svg viewBox="0 0 10 10" className="h-2 w-2" aria-hidden><path d="M5 0 6.2 3.8 10 5 6.2 6.2 5 10 3.8 6.2 0 5 3.8 3.8z" fill="currentColor" /></svg>
      {compact ? rank.slice(0, 1).toUpperCase() + rank.slice(1, 4) : rank}
    </span>
  );
}

const CHANNEL: Record<string, { Icon: (p: { className?: string }) => ReactNode; cls: string }> = {
  WhatsApp: { Icon: WhatsAppIcon, cls: "text-[#128C4B] bg-[#e4f6ea]" },
  Website: { Icon: Globe, cls: "text-info bg-info-bg" },
  Email: { Icon: Mail, cls: "text-cobalt-700 bg-cobalt-50" },
  Referral: { Icon: Users2, cls: "text-[#6a4bd6] bg-[#efeaff]" },
  Instagram: { Icon: InstagramIcon, cls: "text-[#b8346b] bg-[#fde8f1]" },
};
export function ChannelBadge({ channel, iconOnly = false }: { channel: string; iconOnly?: boolean }) {
  const c = CHANNEL[channel] ?? CHANNEL.Website;
  return (
    <span className={clsx("inline-flex h-6 items-center gap-1 rounded-full text-[12px] font-semibold", iconOnly ? "w-6 justify-center" : "px-2", c.cls)} title={channel}>
      <c.Icon className="h-3.5 w-3.5" />
      {iconOnly ? <span className="sr-only">{channel}</span> : channel}
    </span>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={clsx("inline-grid h-5 min-w-5 place-items-center rounded-[5px] border border-line-2 bg-surface px-1 font-sans text-[10.5px] font-semibold text-mute shadow-[0_1px_0_var(--color-line-2)]", className)}>{children}</kbd>;
}

export function LinkTabs({ items, active }: { items: { href: string; label: string; count?: number; key: string }[]; active: string }) {
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto border-b border-line px-1" aria-label="Sections">
      {items.map((t) => {
        const on = t.key === active;
        return (
          <Link key={t.key} href={t.href} scroll={false} aria-current={on ? "page" : undefined}
            className={clsx("relative inline-flex h-11 shrink-0 items-center gap-2 px-3 text-[14px] font-medium transition-colors", on ? "text-ink" : "text-mute hover:text-ink")}>
            {t.label}
            {t.count != null && <span className={clsx("rounded-full px-1.5 text-[11px] font-semibold tabular-nums", on ? "bg-cobalt text-white" : "bg-canvas-2 text-ink-2")}>{t.count}</span>}
            {on && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-cobalt" />}
          </Link>
        );
      })}
    </nav>
  );
}

/** Square brand tile with initials — campaigns and enquiries. */
export function BrandTile({ name, hue, size = 40, className }: { name: string; hue: number; size?: number; className?: string }) {
  const initials = name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <span aria-hidden className={clsx("inline-grid shrink-0 place-items-center rounded-[12px] font-display font-bold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(145deg, hsl(${hue} 78% 58%), hsl(${(hue + 35) % 360} 70% 38%))` }}>
      {initials}
    </span>
  );
}

/**
 * Budget burn: spent vs budget, with a tick for time elapsed so "ahead of / behind plan" reads at a glance.
 */
export function BurnMeter({ spent, budget, elapsed, className }: { spent: number; budget: number | null; elapsed: number | null; className?: string }) {
  const p = budget ? Math.min(100, (spent / budget) * 100) : 0;
  const over = elapsed != null && p > elapsed * 100 + 12;
  return (
    <div className={clsx("relative h-2 w-full rounded-full bg-canvas-2", className)} role="meter" aria-valuenow={Math.round(p)} aria-valuemin={0} aria-valuemax={100} aria-label="Budget spent">
      <div className={clsx("h-full rounded-full", over ? "bg-flame" : "bg-cobalt")} style={{ width: `${p}%` }} />
      {elapsed != null && (
        <span className="absolute -top-1 h-4 w-[2px] rounded-full bg-ink" style={{ left: `calc(${Math.min(100, Math.max(0, elapsed * 100))}% - 1px)` }} title="Time elapsed" />
      )}
    </div>
  );
}

export function SectionTitle({ children, action, count }: { children: ReactNode; action?: ReactNode; count?: number }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-[17px] font-semibold tracking-[-0.025em]">
        {children}
        {count != null && <span className="rounded-full bg-canvas-2 px-2 py-0.5 font-sans text-[12px] font-semibold tabular-nums text-ink-2">{count}</span>}
      </h2>
      {action}
    </div>
  );
}

export function DemoNote({ children }: { children: ReactNode }) {
  return <p className="text-[12px] text-mute">{children}</p>;
}
