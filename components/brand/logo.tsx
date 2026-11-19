import Link from "next/link";
import { clsx } from "clsx";

/**
 * Vigor Launchpad mark — a "V" whose right stroke launches into a rocket.
 * PLACEHOLDER drawn from the brief ("the V with rocket"). Replace the <svg> below with the
 * official Vigor Launchpad logo file when available; every logo in the app renders from here.
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Vigor Launchpad">
      <defs>
        <linearGradient id="vlp-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8A3D" />
          <stop offset="1" stopColor="#FF4D00" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#vlp-g)" />
      {/* V */}
      <path d="M6.5 8.5 L13 24.5 L17.6 13.2" fill="none" stroke="#0A0A0B" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* exhaust trail */}
      <path d="M17.6 13.2 L19.4 11.4" stroke="#0A0A0B" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.1 2.4" />
      {/* rocket (body tilted 45°) */}
      <g transform="translate(19.2 3.2) scale(0.5)">
        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" fill="#0A0A0B" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" fill="#0A0A0B" />
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill="#FFE2CC" />
      </g>
    </svg>
  );
}

export function Logo({ href = "/", className, compact = false }: { href?: string; className?: string; compact?: boolean }) {
  return (
    <Link href={href} className={clsx("group inline-flex items-center gap-2.5 font-display font-bold tracking-tight", className)} aria-label="Vigor Talent Network home">
      <LogoMark className="h-8 w-8 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px]">Vigor <span className="text-brand">Talent Network</span></span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-mute">by Vigor Launchpad</span>
        </span>
      )}
    </Link>
  );
}
