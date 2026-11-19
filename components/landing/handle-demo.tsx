"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { BadgeCheck, GraduationCap, LoaderCircle, Sparkles } from "lucide-react";
import { Avatar, Sparkline, km } from "@/components/kit";
import { InstagramIcon } from "@/components/brand/icons";

export type DemoProfile = {
  handle: string; name: string; hue: number; followers: number; er: number; views: number;
  college: string; city: string; growth: number[];
};

type Phase = "typing" | "fetching" | "filled";

/**
 * "Handle → auto-filled profile" micro-demo. Types an @handle, shows exact-geometry skeletons
 * while "fetching", then fills real-looking stats. Loops only while on screen; static and filled
 * under reduced motion. Decorative for AT — a single sr-only sentence describes it.
 */
export function HandleDemo({ profiles, className }: { profiles: DemoProfile[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(profiles[0].handle.length);
  const [phase, setPhase] = useState<Phase>("filled");
  const [inView, setInView] = useState(false);
  const [reduce, setReduce] = useState(false);
  const p = profiles[idx];

  useEffect(() => setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || reduce) return;
    let t: number;
    if (phase === "filled") {
      t = window.setTimeout(() => {
        const next = (idx + 1) % profiles.length;
        setIdx(next); setChars(0); setPhase("typing");
      }, 4200);
    } else if (phase === "typing") {
      if (chars < p.handle.length) t = window.setTimeout(() => setChars((c) => c + 1), 70 + ((chars * 37) % 50));
      else t = window.setTimeout(() => setPhase("fetching"), 350);
    } else {
      t = window.setTimeout(() => setPhase("filled"), 1300);
    }
    return () => clearTimeout(t);
  }, [phase, chars, idx, inView, reduce, p.handle.length, profiles.length]);

  const loading = phase !== "filled";
  const typed = p.handle.slice(0, chars);

  return (
    <div ref={ref} className={clsx("panel w-full max-w-[360px] p-4", className)}>
      <p className="sr-only">Example: a creator types their Instagram handle and Vigor fills in followers, engagement rate, average views and college automatically.</p>
      <div aria-hidden>
        <div className="flex h-12 items-center gap-2 rounded-[14px] border border-line bg-canvas px-3">
          <InstagramIcon className="h-4 w-4 shrink-0 text-ink-2" />
          <span className="text-[14px] text-mute">instagram.com/</span>
          <span className="min-w-0 truncate text-[15px] font-semibold text-ink">
            {typed}
            {phase === "typing" && <span className="ml-px inline-block h-4 w-[2px] translate-y-[3px] animate-pulse bg-cobalt" />}
          </span>
          <span className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cobalt text-white">
            {phase === "fetching" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </span>
        </div>

        <div className="mt-3 rounded-[16px] border border-line bg-surface p-3.5">
          <div className="flex items-center gap-3">
            {loading ? <span className="skeleton h-11 w-11 shrink-0 rounded-full" /> : <Avatar name={p.name} hue={p.hue} size={44} />}
            <div className="min-w-0 flex-1">
              {loading ? (
                <><span className="skeleton block h-[15px] w-28" /><span className="skeleton mt-1.5 block h-[13px] w-20" /></>
              ) : (
                <>
                  <span className="flex h-[15px] items-center gap-1 text-[14px] font-semibold leading-none text-ink">{p.name} <BadgeCheck className="h-3.5 w-3.5 text-cobalt" /></span>
                  <span className="mt-1.5 block h-[13px] text-[12.5px] leading-none text-mute">@{p.handle}</span>
                </>
              )}
            </div>
            <span className={clsx("chip h-6 shrink-0 transition-opacity duration-300", loading ? "opacity-0" : "opacity-100", "border-ok/25 bg-ok-bg text-ok")}>Auto-filled</span>
          </div>

          <dl className="mt-3.5 grid grid-cols-3 gap-2">
            {[
              ["Followers", km(p.followers)],
              ["Eng. rate", `${p.er.toFixed(1)}%`],
              ["Avg views", km(p.views)],
            ].map(([k, v], i) => (
              <div key={k} className="rounded-[12px] bg-canvas px-2.5 py-2">
                <dt className="text-[11px] font-medium text-mute">{k}</dt>
                <dd className="mt-1 h-[20px]">
                  {loading ? <span className="skeleton block h-[18px] w-12" /> : (
                    <span className="block animate-[fadeUp_.45s_var(--ease-out-expo)_both] font-display text-[18px] font-bold leading-[20px] tracking-[-0.03em] tabular-nums text-ink" style={{ animationDelay: `${i * 60}ms` }}>{v}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-3 flex h-6 items-center justify-between gap-2">
            {loading ? <span className="skeleton block h-5 w-40" /> : (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-2">
                <GraduationCap className="h-4 w-4 text-cobalt" /> {p.college} · {p.city}
              </span>
            )}
          </div>
          <div className="mt-2 h-9">
            {loading ? <span className="skeleton block h-9 w-full" /> : <Sparkline data={p.growth} />}
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
