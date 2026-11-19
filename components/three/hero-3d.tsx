"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false, loading: () => null });

/** CSS-only still of the 3D object: shown first, kept under reduced motion / no WebGL / low memory. */
export function HeroPoster({ className }: { className?: string }) {
  return (
    <div aria-hidden className={clsx("pointer-events-none absolute inset-0 grid place-items-center [perspective:900px]", className)}>
      <div className="relative aspect-square w-[46%]">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_28%,#a9b8ff_0%,#5e78ff_22%,#2b4bff_48%,#1c2f8f_78%,#15226a_100%)] shadow-[0_40px_80px_-30px_rgb(43_75_255/.55)]" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_78%_80%,rgb(124_243_214/.55),transparent_40%)] mix-blend-screen" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_18%_78%,rgb(195_181_255/.5),transparent_38%)] mix-blend-screen" />
      </div>
      <div className="absolute aspect-square w-[84%] rounded-full border-[3px] border-ice/90 [transform:rotateX(72deg)_rotateZ(-24deg)]" />
      <div className="absolute aspect-square w-[108%] rounded-full border border-lilac/60 [transform:rotateX(80deg)_rotateZ(28deg)]" />
      <div className="absolute right-[6%] top-[38%] h-[7%] w-[7%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,#dce5ff_45%,#8ea2ff)]" />
      <div className="absolute left-[14%] top-[16%] h-[4%] w-[4%] rounded-full bg-mint" />
    </div>
  );
}

/**
 * Lazy WebGL hero. Mount order: poster (SSR) → after load + idle, the three.js chunk → fade in on
 * first frame. Rendering pauses when off-screen or the tab is hidden. Skipped entirely under
 * prefers-reduced-motion, without WebGL, or on devices reporting < 4GB memory.
 */
export function Hero3D({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch { webgl = false; }
    if (reduce || !webgl || (mem !== undefined && mem < 4)) return;

    let idle: number | undefined;
    const start = () => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      idle = ric ? ric(() => setEnabled(true), { timeout: 1200 }) : window.setTimeout(() => setEnabled(true), 300);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      if (idle !== undefined) {
        const cic = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
        if (cic) cic(idle); else clearTimeout(idle);
      }
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  return (
    <div ref={ref} className={clsx("relative", className)} aria-hidden>
      <HeroPoster className={clsx("transition-opacity duration-700", ready ? "opacity-0" : "opacity-100")} />
      {enabled && (
        <div className={clsx("absolute inset-0 transition-opacity duration-1000 ease-out-expo", ready ? "opacity-100" : "opacity-0")}>
          <HeroScene active={visible && pageVisible} onReady={() => setReady(true)} />
        </div>
      )}
    </div>
  );
}
