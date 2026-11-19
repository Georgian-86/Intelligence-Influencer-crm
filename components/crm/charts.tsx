/**
 * Pure-SVG/HTML charts for CRM reports (server-safe, no chart library).
 * Shapes live in a stretched SVG; text and markers are HTML so they never distort.
 * One series = one cobalt hue; values carry direct labels; gridlines are hairlines.
 */
import { clsx } from "clsx";

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

export function AreaChart({ data, labels, format, height = 200, className, label }: { data: number[]; labels: string[]; format: (n: number) => string; height?: number; className?: string; label: string }) {
  if (data.length < 2) return null;
  const max = niceMax(Math.max(...data));
  const W = 600, H = 100;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * W, H - (v / max) * H] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const peak = data.indexOf(Math.max(...data));
  const last = pts.at(-1)!;
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  return (
    <figure className={clsx("relative", className)} aria-label={label}>
      <div className="flex gap-3">
        <div className="relative w-10 shrink-0 text-right text-[11px] tabular-nums text-mute" style={{ height }}>
          {ticks.map((t) => <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - t) * 100}%` }}>{format(max * t)}</span>)}
        </div>
        <div className="relative flex-1" style={{ height }}>
          {ticks.map((t) => <span key={t} className={clsx("absolute inset-x-0 h-px", t === 0 ? "bg-line-2" : "bg-line/70")} style={{ top: `${(1 - t) * 100}%` }} />)}
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <defs>
              <linearGradient id="crm-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-cobalt)" stopOpacity=".2" />
                <stop offset="1" stopColor="var(--color-cobalt)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${line} L${W} ${H} L0 ${H} Z`} fill="url(#crm-area)" />
            <path d={line} fill="none" stroke="var(--color-cobalt)" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-cobalt shadow-sm" style={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%` }} />
          <span className={clsx("absolute -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-md bg-night px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white",
            peak / (data.length - 1) > 0.8 ? "-translate-x-[calc(100%-6px)]" : peak / (data.length - 1) < 0.2 ? "-translate-x-1.5" : "-translate-x-1/2")}
            style={{ left: `${(pts[peak][0] / W) * 100}%`, top: `${(pts[peak][1] / H) * 100}%` }}>
            Peak {format(data[peak])}
          </span>
        </div>
      </div>
      <div className="ml-[52px] mt-2 flex justify-between text-[11px] tabular-nums text-mute">
        {labels.map((l, i) => <span key={i} className={clsx(i % 2 && labels.length > 8 && "hidden sm:inline")}>{l}</span>)}
      </div>
      <figcaption className="sr-only">{label}: {data.map((v, i) => `${labels[i]} ${format(v)}`).join(", ")}</figcaption>
    </figure>
  );
}

export function BarList({ items, format, className }: { items: { label: string; value: number; sub?: string }[]; format: (n: number) => string; className?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className={clsx("space-y-2.5", className)}>
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
          <span className="truncate text-[13px] font-medium text-ink-2">{i.label}{i.sub && <span className="ml-1.5 font-normal text-mute">{i.sub}</span>}</span>
          <span className="text-right text-[13px] font-semibold tabular-nums">{format(i.value)}</span>
          <span className="col-span-2 h-2 overflow-hidden rounded-full bg-canvas-2">
            <span className="block h-full rounded-full bg-cobalt" style={{ width: `${(i.value / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ColumnChart({ data, labels, format, height = 140, highlightLast = true }: { data: number[]; labels: string[]; format: (n: number) => string; height?: number; highlightLast?: boolean }) {
  const max = niceMax(Math.max(...data, 1));
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((v, i) => (
          <div key={i} className="group relative flex h-full flex-1 items-end">
            <div className={clsx("w-full rounded-t-[4px] transition-colors", highlightLast && i === data.length - 1 ? "bg-cobalt" : "bg-cobalt-200 group-hover:bg-cobalt-300")} style={{ height: `${(v / max) * 100}%` }} />
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-night px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums text-white opacity-0 transition-opacity group-hover:opacity-100">{format(v)}</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 text-[10.5px] tabular-nums text-mute">
        {labels.map((l, i) => <span key={i} className="flex-1 text-center">{l}</span>)}
      </div>
    </div>
  );
}
