import { clsx } from "clsx";

/** Circular profile-strength meter (pure SVG, server-safe). */
export function StrengthRing({ value, size = 112, stroke = 10, className, onDark = false }: { value: number; size?: number; stroke?: number; className?: string; onDark?: boolean }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={clsx("relative shrink-0", className)} style={{ width: size, height: size }} role="img" aria-label={`Profile strength ${v}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={onDark ? "rgb(255 255 255 / .14)" : "var(--color-canvas-2)"} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={onDark ? "#fff" : "url(#ring-g)"} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
        <defs>
          <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--color-cobalt-400)" /><stop offset="1" stopColor="var(--color-cobalt-700)" /></linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display font-bold leading-none tracking-[-0.04em] tabular-nums" style={{ fontSize: size * 0.27 }}>{v}<span style={{ fontSize: size * 0.14 }}>%</span></div>
          <div className={clsx("mt-1 text-[11px] font-medium", onDark ? "text-white/60" : "text-mute")}>strength</div>
        </div>
      </div>
    </div>
  );
}
