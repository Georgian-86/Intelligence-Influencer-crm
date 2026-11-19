import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { imgSrc } from "@/components/ui";
import { initials } from "@/components/crm/format";

/** Round avatar: Instagram picture through the image proxy, else initials. */
export function Avatar({ src, name, size = "md", className }: {
  src?: string | null; name?: string | null; size?: "xs" | "sm" | "md" | "lg" | "xl"; className?: string;
}) {
  const dim = { xs: "h-6 w-6 text-[10px]", sm: "h-8 w-8 text-[11px]", md: "h-10 w-10 text-xs", lg: "h-14 w-14 text-base", xl: "h-20 w-20 text-xl" }[size];
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imgSrc(src)} alt="" referrerPolicy="no-referrer" loading="lazy"
      className={clsx("shrink-0 rounded-full border border-line bg-ink-3 object-cover", dim, className)} />
  ) : (
    <span aria-hidden className={clsx("grid shrink-0 place-items-center rounded-full border border-line bg-ink-3 font-semibold text-mute", dim, className)}>
      {initials(name)}
    </span>
  );
}

/** Metric tile for dashboards (dense, calm). */
export function KpiTile({ label, value, hint, icon, href, accent = false }: {
  label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; href?: string; accent?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-mute">{label}</span>
        {icon && (
          <span aria-hidden className={clsx("grid h-8 w-8 place-items-center rounded-lg", accent ? "bg-brand/15 text-brand" : "bg-ink-3 text-mute")}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 font-display text-3xl font-bold tabular-nums tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-mute">{hint}</div>}
      {href && <ArrowUpRight aria-hidden className="absolute bottom-3 right-3 h-4 w-4 text-mute opacity-0 transition-opacity group-hover:opacity-100" />}
    </>
  );
  return href ? (
    <Link href={href} className="card card-hover group relative block p-4">{body}</Link>
  ) : (
    <div className="card relative p-4">{body}</div>
  );
}

/** Titled card section. */
export function Panel({ title, icon, actions, children, className, bodyClassName, id }: {
  title?: ReactNode; icon?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string; id?: string;
}) {
  return (
    <section id={id} className={clsx("card", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
          {title && (
            <h2 className="flex items-center gap-2 font-sans text-sm font-semibold tracking-normal">
              {icon && <span aria-hidden className="text-mute">{icon}</span>}
              {title}
            </h2>
          )}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={clsx("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg pr-2 text-sm text-mute hover:text-fog">
      <ArrowLeft aria-hidden className="h-4 w-4" /> {children}
    </Link>
  );
}

/** Page title row used across CRM/admin screens. */
export function ScreenHeader({ title, subtitle, actions, eyebrow, back }: {
  title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6">
      {back && <div className="mb-2"><BackLink href={back.href}>{back.label}</BackLink></div>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="mb-1 text-xs font-medium text-mute">{eyebrow}</div>}
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-mute">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Underlined tab-style links (server-rendered filters). */
export function TabLinks({ items, label }: { items: { href: string; label: ReactNode; count?: number; active: boolean }[]; label: string }) {
  return (
    <nav aria-label={label} className="-mx-1 flex gap-1 overflow-x-auto border-b border-line px-1">
      {items.map((t) => (
        <Link key={t.href} href={t.href} aria-current={t.active ? "page" : undefined}
          className={clsx(
            "relative flex min-h-11 shrink-0 items-center gap-2 px-3 text-sm font-medium capitalize transition-colors",
            t.active ? "text-fog" : "text-mute hover:text-fog",
          )}>
          {t.label}
          {t.count != null && (
            <span className={clsx("rounded-full px-1.5 py-px text-[11px] tabular-nums", t.active ? "bg-brand/15 text-brand" : "bg-ink-3 text-mute")}>{t.count}</span>
          )}
          {t.active && <span aria-hidden className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
        </Link>
      ))}
    </nav>
  );
}

/** Empty state with an icon and a next action. */
export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-2 px-6 py-12 text-center">
      {icon && <span aria-hidden className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-3 text-mute">{icon}</span>}
      <div className="font-semibold">{title}</div>
      {children && <div className="max-w-md text-sm text-mute">{children}</div>}
      {action}
    </div>
  );
}

/** Label/value pair for detail pages. */
export function Meta({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-mute">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

/** Chip list for tags like categories. */
export function TagList({ items, max, empty = "—" }: { items: string[]; max?: number; empty?: string }) {
  if (!items.length) return <span className="text-mute">{empty}</span>;
  const shown = max ? items.slice(0, max) : items;
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((c) => <span key={c} className="rounded-md border border-line bg-ink-3/60 px-1.5 py-0.5 text-[11px] text-fog/90">{c}</span>)}
      {max && items.length > max && <span className="px-1 py-0.5 text-[11px] text-mute">+{items.length - max}</span>}
    </span>
  );
}
