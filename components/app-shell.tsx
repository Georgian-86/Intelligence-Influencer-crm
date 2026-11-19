"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useEffect, useState, type ReactNode } from "react";
import * as Icons from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/kit";

export type NavItem = { href: string; label: string; icon?: keyof typeof Icons; badge?: string | number; group?: string };

/**
 * Workspace shell shared by every role: creator app, brand portal, agency CRM, admin.
 * Desktop: fixed sidebar + sticky top bar. Mobile: top bar + bottom tab bar (first 5 items).
 */
export function AppShell({
  area, orgName, email, userName, nav, children, switchLinks, signOutAction, accent = "cobalt",
}: {
  area: string;
  orgName: string;
  email?: string;
  userName?: string;
  nav: NavItem[];
  switchLinks?: { href: string; label: string }[];
  signOutAction?: () => Promise<void>;
  accent?: "cobalt" | "flame";
  children: ReactNode;
}) {
  const path = usePathname();
  const [cmd, setCmd] = useState(false);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmd((v) => !v); }
      if (e.key === "Escape") setCmd(false);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  const isActive = (href: string) => (href === nav[0]?.href ? path === href : path === href || path.startsWith(href + "/"));
  const groups = nav.reduce<Record<string, NavItem[]>>((acc, n) => ((acc[n.group ?? ""] ??= []).push(n), acc), {});
  const name = userName ?? email?.split("@")[0] ?? "You";

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[256px_1fr]">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface/70 backdrop-blur-xl lg:flex">
        <div className="px-5 pt-5 pb-4"><Logo href={nav[0]?.href ?? "/"} /></div>
        <div className="mx-3 mb-3 flex items-center gap-3 rounded-[14px] border border-line bg-canvas/70 px-3 py-2.5">
          <span className={clsx("grid h-8 w-8 place-items-center rounded-[10px] text-[12px] font-bold text-white", accent === "flame" ? "bg-flame text-night" : "bg-cobalt")}>
            {orgName.slice(0, 1)}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] font-semibold">{orgName}</div>
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-mute">{area}</div>
          </div>
        </div>
        <button onClick={() => setCmd(true)} className="mx-3 mb-2 flex h-9 items-center gap-2 rounded-[10px] border border-line bg-surface px-3 text-[13px] text-faint shadow-xs transition hover:border-line-2">
          <Icons.Search className="h-4 w-4" /> Search or jump to…
          <kbd className="ml-auto rounded-md border border-line bg-canvas px-1.5 text-[10px] font-semibold text-mute">⌘K</kbd>
        </button>
        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label={`${area} navigation`}>
          {Object.entries(groups).map(([g, items]) => (
            <div key={g} className="mt-3">
              {g && <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">{g}</div>}
              <ul className="space-y-0.5">
                {items.map((n) => {
                  const I = (n.icon && (Icons[n.icon] as Icons.LucideIcon)) || Icons.Circle;
                  const on = isActive(n.href);
                  return (
                    <li key={n.href}>
                      <Link href={n.href} aria-current={on ? "page" : undefined}
                        className={clsx("group relative flex h-9 items-center gap-2.5 rounded-[10px] px-3 text-[14px] font-medium transition-colors duration-150",
                          on ? "bg-cobalt-50 text-cobalt-700" : "text-ink-2 hover:bg-canvas-2/70 hover:text-ink")}>
                        {on && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-cobalt" />}
                        <I className={clsx("h-[18px] w-[18px]", on ? "text-cobalt" : "text-mute group-hover:text-ink-2")} strokeWidth={1.8} />
                        {n.label}
                        {n.badge != null && <span className={clsx("ml-auto rounded-full px-1.5 text-[11px] font-semibold tabular-nums", on ? "bg-cobalt text-white" : "bg-canvas-2 text-ink-2")}>{n.badge}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          {switchLinks && switchLinks.length > 0 && (
            <div className="mb-2 space-y-0.5">
              {switchLinks.map((s) => (
                <Link key={s.href} href={s.href} className="flex h-8 items-center gap-2 rounded-[10px] px-3 text-[13px] text-mute hover:bg-canvas-2/70 hover:text-ink">
                  <Icons.ArrowLeftRight className="h-3.5 w-3.5" /> {s.label}
                </Link>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2.5 rounded-[12px] px-2 py-1.5">
            <Avatar name={name} hue={228} size={32} />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px] font-semibold capitalize">{name}</div>
              <div className="truncate text-[11.5px] text-mute">{email}</div>
            </div>
            {signOutAction && (
              <form action={signOutAction}>
                <button className="grid h-8 w-8 place-items-center rounded-full text-mute hover:bg-canvas-2 hover:text-ink" aria-label="Sign out"><Icons.LogOut className="h-4 w-4" /></button>
              </form>
            )}
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="lg:hidden"><Logo href={nav[0]?.href ?? "/"} compact /></div>
          <div className="hidden text-[13px] text-mute lg:block">
            <span className="font-medium text-ink-2">{area}</span>
            <span className="mx-2 text-faint">/</span>
            <span>{nav.find((n) => isActive(n.href))?.label ?? ""}</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={() => setCmd(true)} className="grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-canvas-2 lg:hidden" aria-label="Search"><Icons.Search className="h-[18px] w-[18px]" /></button>
            <button className="relative grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-canvas-2" aria-label="Notifications">
              <Icons.Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-flame ring-2 ring-canvas" />
            </button>
            <span className="lg:hidden"><Avatar name={name} size={30} /></span>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">{children}</main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-[22px] border border-line bg-surface/90 px-1 py-1.5 shadow-lg backdrop-blur-xl lg:hidden" aria-label="Primary">
        {nav.slice(0, 5).map((n) => {
          const I = (n.icon && (Icons[n.icon] as Icons.LucideIcon)) || Icons.Circle;
          const on = isActive(n.href);
          return (
            <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={clsx("flex min-w-14 flex-col items-center gap-0.5 rounded-[14px] px-2 py-1.5 text-[10.5px] font-semibold", on ? "text-cobalt" : "text-mute")}>
              <I className="h-5 w-5" strokeWidth={on ? 2.2 : 1.8} />
              {n.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>

      {/* Command palette */}
      {cmd && (
        <div className="fixed inset-0 z-50 grid place-items-start bg-night/30 px-4 pt-[12vh] backdrop-blur-sm" onClick={() => setCmd(false)}>
          <div role="dialog" aria-modal aria-label="Command palette" onClick={(e) => e.stopPropagation()} className="panel mx-auto w-full max-w-xl overflow-hidden p-0">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Icons.Search className="h-4 w-4 text-mute" />
              <input autoFocus placeholder="Jump to a page, creator, campaign…" className="h-13 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint" />
              <kbd className="rounded-md border border-line px-1.5 text-[10px] font-semibold text-mute">ESC</kbd>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {[...nav, ...(switchLinks ?? []).map((s) => ({ ...s, icon: "ArrowLeftRight" as const }))].map((n) => {
                const I = ("icon" in n && n.icon && (Icons[n.icon as keyof typeof Icons] as Icons.LucideIcon)) || Icons.CornerDownRight;
                return (
                  <li key={n.href}>
                    <Link href={n.href} onClick={() => setCmd(false)} className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] text-ink-2 hover:bg-cobalt-50 hover:text-cobalt-700">
                      <I className="h-4 w-4" /> {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
