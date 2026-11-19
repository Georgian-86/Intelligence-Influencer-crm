import Link from "next/link";
import { clsx } from "clsx";
import { useId } from "react";

/**
 * Vigor Launchpad mark — the "V" whose right stroke is a rocket lifting off a puff of exhaust.
 * Redrawn as a vector from the Vigor Launchpad logo (public/brand/vigor-mark.svg is the same art).
 * `tone="mono"` renders single-colour (for night backgrounds use `tone="light"`).
 */
export function LogoMark({ className = "h-8 w-8", tone = "color" }: { className?: string; tone?: "color" | "mono" | "light" }) {
  const id = useId().replace(/:/g, "");
  const a = tone === "color" ? `url(#${id}a)` : tone === "light" ? "#fff" : "currentColor";
  const b = tone === "color" ? `url(#${id}b)` : tone === "light" ? "#fff" : "currentColor";
  const deep = tone === "color" ? "#1C2F8F" : tone === "light" ? "rgb(255 255 255 / .7)" : "currentColor";
  const puff = tone === "color" ? "#2B4BFF" : tone === "light" ? "#fff" : "currentColor";
  const win = tone === "light" ? "#0B1533" : "#F5F4EF";
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Vigor Launchpad">
      {tone === "color" && (
        <defs>
          <linearGradient id={`${id}a`} x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stopColor="#4C6BFF" /><stop offset="1" stopColor="#1C2F8F" /></linearGradient>
          <linearGradient id={`${id}b`} x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0" stopColor="#6A86FF" /><stop offset="1" stopColor="#2B4BFF" /></linearGradient>
        </defs>
      )}
      <path d="M4 27 H16.5 L28 51 L22.5 60 Z" fill={a} />
      <g transform="translate(-9 9) rotate(28 40 40)">
        <path d="M40 3 C47 10 48.5 22 46.5 36 L33.5 36 C31.5 22 33 10 40 3 Z" fill={b} />
        <path d="M33.6 27 L28.5 37.5 L34 37 Z M46.4 27 L51.5 37.5 L46 37 Z" fill={deep} />
        <path d="M35.5 36 H44.5 L42.8 40 H37.2 Z" fill={deep} />
        <circle cx="40" cy="16" r="3.4" fill={win} />
      </g>
      <g fill={puff}>
        <circle cx="25" cy="53.5" r="3.9" /><circle cx="29.6" cy="49.2" r="3.3" /><circle cx="21.4" cy="49.4" r="2.4" /><circle cx="30.4" cy="55.2" r="2.2" />
      </g>
    </svg>
  );
}

/** Full lockup: mark + "Vigor Talent Network" wordmark with "by Vigor Launchpad" endorsement. */
export function Logo({
  href = "/", className, compact = false, tone = "color",
}: { href?: string; className?: string; compact?: boolean; tone?: "color" | "light" }) {
  return (
    <Link
      href={href}
      className={clsx("group inline-flex items-center gap-2.5", tone === "light" ? "text-white" : "text-ink", className)}
      aria-label="Vigor Talent Network — home"
    >
      <LogoMark tone={tone === "light" ? "light" : "color"} className="h-9 w-9 shrink-0 transition-transform duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:rotate-[-4deg]" />
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[17px] font-bold tracking-[-0.03em]">
            Vigor<span className={tone === "light" ? "text-cobalt-300" : "text-cobalt"}>.</span>
            <span className="ml-1 font-semibold">Talent</span>
          </span>
          <span className={clsx("mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em]", tone === "light" ? "text-white/55" : "text-mute")}>
            by Vigor Launchpad
          </span>
        </span>
      )}
    </Link>
  );
}
