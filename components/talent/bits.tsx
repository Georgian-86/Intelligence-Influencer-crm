import Link from "next/link";
import { clsx } from "clsx";

/** Page title block for talent routes (display type, optional eyebrow + actions). */
export function TalentHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="min-w-0">
        {eyebrow && <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-2">{eyebrow}</div>}
        <h1 className="mt-1 text-balance text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em] text-fog sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-pretty text-sm text-mute sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Section heading with optional "see all" link. */
export function SectionTitle({ id, title, href, linkLabel = "See all", count }: { id?: string; title: string; href?: string; linkLabel?: string; count?: number }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="flex items-center gap-2 text-lg font-bold tracking-tight text-fog">
        {title}
        {count != null && <span className="rounded-full bg-ink-3 px-2 py-0.5 text-xs font-semibold tabular-nums text-mute">{count}</span>}
      </h2>
      {href && <Link href={href} className="btn-quiet min-h-11 px-3 text-sm">{linkLabel} →</Link>}
    </div>
  );
}

/** Empty state: icon halo + title + helpful copy + next action. */
export function EmptyState({ icon: Icon, title, children, action, className }: {
  icon: React.ComponentType<{ className?: string }>; title: string; children?: React.ReactNode; action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={clsx("card flex flex-col items-center px-6 py-10 text-center sm:py-14", className)}>
      <span className="relative grid h-14 w-14 place-items-center" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-brand/10" />
        <span className="absolute inset-1.5 rounded-full border border-brand/30 bg-ink-3" />
        <Icon className="relative h-6 w-6 text-brand-2" />
      </span>
      <h3 className="mt-4 text-lg font-bold text-fog">{title}</h3>
      {children && <div className="mt-1.5 max-w-sm text-pretty text-sm text-mute">{children}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/** Inline banner for flash messages (?saved=1 etc). */
export function Banner({ kind = "info", children }: { kind?: "info" | "ok" | "error"; children: React.ReactNode }) {
  const c = kind === "error" ? "border-bad/40 bg-bad/10 text-bad" : kind === "ok" ? "border-ok/40 bg-ok/10 text-ok" : "border-info/30 bg-info/10 text-info";
  return <div role={kind === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${c}`}>{children}</div>;
}
