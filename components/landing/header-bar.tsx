"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { clsx } from "clsx";
import { Logo } from "@/components/brand/logo";

const NAV = [
  { href: "/#audiences", label: "Who it's for" },
  { href: "/#how", label: "How it works" },
  { href: "/#campuses", label: "Campuses" },
  { href: "/brands", label: "For brands" },
];

export function HeaderBar({ loggedIn }: { loggedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => mq.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40">
      {/* Glass layer fades in on scroll (opacity only — no layout or colour transitions). */}
      <div
        aria-hidden="true"
        className={clsx(
          "pointer-events-none absolute inset-0 border-b border-white/[0.07] bg-ink/75 backdrop-blur-xl backdrop-saturate-150 transition-opacity duration-300",
          scrolled || open ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="btn-quiet min-h-11 px-3 font-medium">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {loggedIn ? (
            <Link href="/dashboard" className="btn-primary min-h-11 px-4">
              Dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-quiet hidden min-h-11 px-3 font-medium sm:inline-flex">
                Log in
              </Link>
              <Link href="/join" className="btn-primary min-h-11 px-4">
                Join
              </Link>
            </>
          )}
          <button
            ref={btnRef}
            type="button"
            className="btn-ghost h-11 w-11 p-0 md:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              aria-hidden="true"
              className="fixed inset-x-0 bottom-0 top-16 bg-ink/70 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={close}
            />
            <motion.div
              key="panel"
              id={panelId}
              className="absolute inset-x-0 top-16 border-b border-white/[0.07] bg-ink/95 backdrop-blur-xl md:hidden"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <nav aria-label="Mobile" className="mx-auto max-w-6xl px-4 pb-5 pt-2">
                <ul className="divide-y divide-line">
                  {NAV.map((n) => (
                    <li key={n.href}>
                      <Link
                        href={n.href}
                        onClick={close}
                        className="flex min-h-12 items-center justify-between py-3 text-base font-medium text-fog"
                      >
                        {n.label}
                        <ArrowRight className="h-4 w-4 text-mute" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {!loggedIn && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={close} className="btn-ghost min-h-12">Log in</Link>
                    <Link href="/join" onClick={close} className="btn-primary min-h-12">Join the network</Link>
                  </div>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
