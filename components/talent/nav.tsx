"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { House, Megaphone, ListChecks, UserRound } from "lucide-react";

export const TALENT_NAV = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/dashboard/briefs", label: "Briefs", icon: Megaphone },
  { href: "/dashboard/applications", label: "Applications", icon: ListChecks },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
] as const;

function useActive() {
  const path = usePathname() ?? "";
  return (href: string) => (href === "/dashboard" ? path === href : path === href || path.startsWith(`${href}/`));
}

/** Desktop sidebar links. */
export function SideNav({ badges }: { badges?: Partial<Record<string, number>> }) {
  const isActive = useActive();
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {TALENT_NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        const count = badges?.[href];
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150",
              active ? "bg-ink-3 text-fog" : "text-mute hover:bg-ink-3/60 hover:text-fog",
            )}
          >
            {active && <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-brand" />}
            <Icon className={clsx("h-[18px] w-[18px]", active ? "text-brand" : "text-mute group-hover:text-fog")} aria-hidden />
            <span className="flex-1">{label}</span>
            {!!count && (
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-brand-2">{count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile bottom tab bar (thumb zone). Fixed, glass, respects the iOS home-indicator inset. */
export function TabBar({ badges }: { badges?: Partial<Record<string, number>> }) {
  const isActive = useActive();
  return (
    <nav
      aria-label="Dashboard"
      className="glass fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TALENT_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const count = badges?.[href];
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150",
                  active ? "text-fog" : "text-mute hover:text-fog",
                )}
              >
                {active && <span aria-hidden className="absolute top-0 h-[3px] w-8 rounded-b-full bg-brand" />}
                <span className="relative">
                  <Icon className={clsx("h-[22px] w-[22px]", active && "text-brand")} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                  {!!count && (
                    <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-brand px-1 text-center text-[10px] font-bold leading-[18px] text-black">
                      {count > 9 ? "9+" : count}
                      <span className="sr-only"> new</span>
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
