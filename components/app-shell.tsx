"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { clsx } from "clsx";
import {
  ArrowLeftRight, Briefcase, ChevronsLeft, ChevronsRight, Gauge, Inbox, KanbanSquare, LayoutDashboard,
  LogOut, Megaphone, Menu, Search, ShieldCheck, UserCog, Users, X, type LucideIcon,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { signOut } from "@/app/auth-actions";
import { SIDEBAR_COOKIE } from "@/components/crm/shell-config";

/** Icons are referenced by name so server layouts can pass nav config across the client boundary. */
const ICONS = {
  home: Gauge,
  dashboard: LayoutDashboard,
  users: Users,
  campaigns: Megaphone,
  briefs: Briefcase,
  pipeline: KanbanSquare,
  inbox: Inbox,
  shield: ShieldCheck,
  team: UserCog,
  switch: ArrowLeftRight,
} satisfies Record<string, LucideIcon>;

export type ShellIcon = keyof typeof ICONS;

export type ShellNavItem = {
  href: string;
  label: string;
  icon?: ShellIcon;
  /** Group heading shown above the item (items with the same section are grouped in order). */
  section?: string;
  /** Only active on an exact path match (use for section roots such as /crm). */
  exact?: boolean;
  /** Extra path prefixes that should also mark this item active (e.g. /crm/briefs for Campaigns). */
  match?: string[];
  /** Small count pill (e.g. new enquiries). Hidden when 0/undefined. */
  badge?: number;
};


function isActive(pathname: string, item: ShellNavItem) {
  const prefixes = [item.href, ...(item.match ?? [])];
  if (item.exact) return pathname === item.href || (item.match ?? []).some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function groupNav(nav: ShellNavItem[]) {
  const groups: { section?: string; items: ShellNavItem[] }[] = [];
  for (const item of nav) {
    const last = groups[groups.length - 1];
    if (last && last.section === item.section) last.items.push(item);
    else groups.push({ section: item.section, items: [item] });
  }
  return groups;
}

/**
 * Workspace shell for the CRM and admin panel: collapsible icon sidebar (drawer on mobile),
 * grouped nav with active state, org/role indicator and an optional quick-search entry point.
 * Backward compatible with the original `{ area, orgName, email, nav, switchLinks }` props.
 */
export function AppShell({
  area, orgName, email, nav, children, switchLinks, role, searchAction, searchPlaceholder, defaultCollapsed = false,
}: {
  area: string;
  orgName: string;
  email?: string;
  nav: ShellNavItem[];
  switchLinks?: { href: string; label: string }[];
  children: ReactNode;
  /** Human-readable role in this org, e.g. "Owner". */
  role?: string;
  /** GET target for the quick search box (submits `?q=`). Omit to hide search. */
  searchAction?: string;
  searchPlaceholder?: string;
  /** Initial collapsed state (read from the `vtn_sb` cookie server-side to avoid layout shift). */
  defaultCollapsed?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [drawer, setDrawer] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const drawerId = useId();
  const reduce = useReducedMotion();

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }, []);

  // Close the drawer on navigation.
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawer(false);
        menuBtn.current?.focus();
      }
    };
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && setDrawer(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
      document.body.style.overflow = prev;
    };
  }, [drawer]);

  // "/" or ⌘K / Ctrl+K focuses quick search; "[" toggles the sidebar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
      if (searchAction && ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing))) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (e.key === "[" && !typing && !e.metaKey && !e.ctrlKey) {
        toggleCollapsed();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchAction, toggleCollapsed]);

  const groups = groupNav(nav);
  const homeHref = nav[0]?.href ?? "/";

  const navList = (mini: boolean) => (
    <nav aria-label={`${area} navigation`} className="flex-1 overflow-y-auto px-2 py-3">
      {groups.map((g, gi) => (
        <div key={gi} className={clsx(gi > 0 && "mt-4")}>
          {g.section && (
            mini
              ? <div aria-hidden className="mx-3 mb-2 h-px bg-line" />
              : <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-mute/80">{g.section}</div>
          )}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = ICONS[item.icon ?? "dashboard"];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={mini ? item.label : undefined}
                    className={clsx(
                      "group relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
                      mini && "justify-center px-0",
                      active ? "bg-ink-3 text-fog" : "text-mute hover:bg-ink-3/60 hover:text-fog",
                    )}
                  >
                    {active && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand" />}
                    <Icon aria-hidden className={clsx("h-[18px] w-[18px] shrink-0", active ? "text-brand" : "text-mute group-hover:text-fog")} />
                    {!mini && <span className="flex-1 truncate">{item.label}</span>}
                    {!!item.badge && (
                      mini
                        ? <span aria-label={`${item.badge} new`} className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand" />
                        : <span className="rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-brand">{item.badge > 99 ? "99+" : item.badge}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const orgBlock = (mini: boolean) => (
    <div className={clsx("mx-2 flex items-center gap-2.5 rounded-xl border border-line bg-ink/60 p-2", mini && "justify-center")} title={mini ? `${orgName} · ${area}${role ? ` · ${role}` : ""}` : undefined}>
      <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/15 font-display text-sm font-bold text-brand">
        {orgName.trim()[0]?.toUpperCase() ?? "V"}
      </span>
      {!mini && (
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight">{orgName}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-mute">
            <span className="rounded bg-brand/15 px-1.5 py-px font-semibold uppercase tracking-wider text-brand">{area}</span>
            {role && <span className="truncate capitalize">{role}</span>}
          </div>
        </div>
      )}
    </div>
  );

  const footer = (mini: boolean) => (
    <div className="space-y-1 border-t border-line p-2 text-sm">
      {switchLinks?.map((s) => (
        <Link key={s.href} href={s.href} title={mini ? s.label : undefined}
          className={clsx("flex min-h-10 items-center gap-3 rounded-lg px-3 text-mute hover:bg-ink-3/60 hover:text-fog", mini && "justify-center px-0")}>
          <ArrowLeftRight aria-hidden className="h-4 w-4 shrink-0" />
          {!mini && <span className="truncate">{s.label}</span>}
        </Link>
      ))}
      <form action={signOut}>
        <button title={mini ? `Sign out${email ? ` (${email})` : ""}` : undefined}
          className={clsx("flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-mute hover:bg-ink-3/60 hover:text-fog", mini && "justify-center px-0")}>
          <LogOut aria-hidden className="h-4 w-4 shrink-0" />
          {!mini && (
            <span className="min-w-0 flex-1">
              <span className="block">Sign out</span>
              {email && <span className="block truncate text-[11px] text-mute/80">{email}</span>}
            </span>
          )}
        </button>
      </form>
    </div>
  );

  const searchBox = searchAction ? (
    <form action={searchAction} role="search" className="relative w-full max-w-md">
      <label htmlFor="shell-search" className="sr-only">{searchPlaceholder ?? "Search"}</label>
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
      <input
        ref={searchRef}
        id="shell-search"
        name="q"
        type="search"
        autoComplete="off"
        placeholder={searchPlaceholder ?? "Search…"}
        className="h-10 w-full rounded-xl border border-line bg-ink-2 pl-9 pr-12 text-sm text-fog outline-none transition-[border-color,box-shadow] placeholder:text-mute/70 focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
      <kbd aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-ink-3 px-1.5 py-px font-sans text-[10px] text-mute sm:block">/</kbd>
    </form>
  ) : null;

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside
        className={clsx(
          // Below lg the sidebar is moved off-screen and made invisible rather than display:none, so the
          // logo's SVG gradient (referenced by id from later logo instances) still resolves.
          "flex h-dvh shrink-0 flex-col border-r border-line bg-ink-2 transition-[width] duration-200 ease-out",
          "max-lg:invisible max-lg:fixed max-lg:-left-[9999px] max-lg:top-0 lg:sticky lg:top-0",
          collapsed ? "w-[68px]" : "w-[248px]",
        )}
      >
        <div className={clsx("flex h-14 items-center border-b border-line px-3", collapsed ? "justify-center" : "justify-between")}>
          {collapsed ? (
            <Link href={homeHref} aria-label="Home"><LogoMark className="h-8 w-8" /></Link>
          ) : (
            <Logo href={homeHref} />
          )}
        </div>
        <div className="pt-3">{orgBlock(collapsed)}</div>
        {navList(collapsed)}
        {footer(collapsed)}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={`${collapsed ? "Expand" : "Collapse"} sidebar ( [ )`}
          className="flex h-10 items-center justify-center gap-2 border-t border-line text-xs text-mute hover:bg-ink-3/60 hover:text-fog"
        >
          {collapsed ? <ChevronsRight aria-hidden className="h-4 w-4" /> : <><ChevronsLeft aria-hidden className="h-4 w-4" /> Collapse</>}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-line bg-ink/80 backdrop-blur-xl backdrop-saturate-150">
          <div className="flex h-14 items-center gap-3 px-3 sm:px-6 lg:px-8">
            <button
              ref={menuBtn}
              type="button"
              className="btn-ghost h-11 w-11 shrink-0 p-0 lg:hidden"
              aria-expanded={drawer}
              aria-controls={drawerId}
              aria-label="Open navigation"
              onClick={() => setDrawer(true)}
            >
              <Menu aria-hidden className="h-5 w-5" />
            </button>
            <div className="flex shrink-0 items-center gap-2 lg:hidden">
              <Link href={homeHref} aria-label="Home"><LogoMark className="h-7 w-7" /></Link>
              <span className="rounded bg-brand/15 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-brand">{area}</span>
            </div>
            <div className="flex min-w-0 flex-1 justify-end lg:justify-start">{searchBox}</div>
            <div className="hidden min-w-0 items-center gap-2 text-xs text-mute xl:flex">
              <span className="truncate">{email}</span>
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto w-full min-w-0 max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              key="scrim"
              aria-hidden
              className="absolute inset-0 bg-ink/75 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              key="drawer"
              id={drawerId}
              role="dialog"
              aria-modal="true"
              aria-label={`${area} navigation`}
              className="absolute inset-y-0 left-0 flex w-[84vw] max-w-[300px] flex-col border-r border-line bg-ink-2 shadow-2xl"
              initial={reduce ? { opacity: 0 } : { x: "-100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="flex h-14 items-center justify-between border-b border-line px-3">
                <Logo href={homeHref} />
                <button type="button" autoFocus className="btn-quiet h-11 w-11 p-0" aria-label="Close navigation" onClick={() => setDrawer(false)}>
                  <X aria-hidden className="h-5 w-5" />
                </button>
              </div>
              <div className="pt-3">{orgBlock(false)}</div>
              {navList(false)}
              {footer(false)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
