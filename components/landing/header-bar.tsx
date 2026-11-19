"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const LINKS = [
  { href: "/#audiences", label: "Creators" },
  { href: "/brands", label: "Brands" },
  { href: "/#campuses", label: "Campuses" },
  { href: "/#how", label: "How it works" },
];

/**
 * Floating glass nav. Condenses after 24px of scroll (glass layer fades in, bar lifts) using
 * transform/opacity only. Mobile: a sheet with Escape-to-close and focus return.
 */
export function HeaderBar({ loggedIn = false }: { loggedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // On /join itself, "Join free" would link to the page you're already on and do nothing.
  const onJoin = pathname === "/join";
  const joinHref = onJoin ? "/register?type=influencer" : "/join";
  const joinLabel = onJoin ? "Sign up free" : "Join free";
  const btnRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open]);

  const condensed = scrolled || open;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={clsx(
          "relative mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 rounded-full pl-4 pr-2 transition-transform duration-500 ease-out-expo sm:pl-5",
          condensed && "-translate-y-1",
        )}
      >
        {/* glass layer: opacity + scale only */}
        <span
          aria-hidden
          className={clsx(
            "glass pointer-events-none absolute inset-0 rounded-full shadow-md transition-[opacity,transform] duration-500 ease-out-expo",
            condensed ? "scale-100 opacity-100" : "scale-[1.015] opacity-0",
          )}
        />
        <Logo className="relative" />

        <nav aria-label="Main" className="relative hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3.5 py-2 text-[14px] font-medium text-ink-2 transition-colors duration-150 hover:bg-ink/5 hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="relative flex items-center gap-1.5">
          <Link href={loggedIn ? "/dashboard" : "/login"} className="btn-quiet hidden sm:inline-flex">
            {loggedIn ? "Dashboard" : "Log in"}
          </Link>
          <Link href={joinHref} className="btn-primary hidden sm:inline-flex">
            {joinLabel} <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
          <button
            ref={btnRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-sheet"
            className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-ink/5 lg:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      <div
        id="mobile-sheet"
        ref={sheetRef}
        hidden={!open}
        className="glass mx-auto mt-2 max-w-[1240px] origin-top rounded-[28px] p-3 shadow-lg lg:hidden"
      >
        <nav aria-label="Mobile" className="grid">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center justify-between rounded-2xl px-4 font-display text-[20px] font-semibold tracking-[-0.02em] text-ink hover:bg-ink/5">
              {l.label} <ArrowUpRight className="h-4 w-4 text-mute" aria-hidden />
            </Link>
          ))}
        </nav>
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line/70 pt-3">
          <Link href={loggedIn ? "/dashboard" : "/login"} onClick={() => setOpen(false)} className="btn-ghost h-12">{loggedIn ? "Dashboard" : "Log in"}</Link>
          <Link href={joinHref} onClick={() => setOpen(false)} className="btn-primary h-12">{joinLabel}</Link>
        </div>
      </div>
    </header>
  );
}
