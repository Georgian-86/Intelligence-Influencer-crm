"use client";

/**
 * Pure-SVG/HTML chart primitives for the brand portal, admin and founder cockpit.
 * Follows the dataviz skill: thin marks (≤24px), 4px rounded data-ends square at the baseline,
 * 2px surface gaps between touching fills, hairline solid gridlines, text in ink tokens (never
 * series colour), a hover tooltip on every mark, and a table view for every chart.
 * Categorical pair (light surface): cobalt #2B4BFF + cobalt-300 #8EA2FF (one hue, two weights — calmer than
 * cobalt + flame; series are also separated by position and legend, never by colour alone).
 */
import { clsx } from "clsx";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { SERIES, fmt, niceTicks, type Fmt } from "./format";
export type { Fmt };

/** Column path: square at the baseline, 4px rounded data-end. */
function colPath(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0) return "";
  const rr = Math.min(r, h, w / 2);
  return `M${x} ${y + h}V${y + rr}Q${x} ${y} ${x + rr} ${y}H${x + w - rr}Q${x + w} ${y} ${x + w} ${y + rr}V${y + h}Z`;
}

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setM(true)); return () => cancelAnimationFrame(t); }, []);
  return m;
}

function useWidth<T extends HTMLElement>(initial = 640) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(initial);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function Tip({ x, y, children, align = "center" }: { x: number | string; y: number; children: ReactNode; align?: "center" | "left" | "right" }) {
  return (
    <div role="status" className="pointer-events-none absolute z-20 whitespace-nowrap rounded-[10px] border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink shadow-md"
      style={{ left: x, top: y, transform: `translate(${align === "center" ? "-50%" : align === "right" ? "-100%" : "0"}, calc(-100% - 8px))` }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table view (accessibility + exact numbers)                           */
/* ------------------------------------------------------------------ */
export function TableView({ columns, rows, summary = "View as table" }: { columns: string[]; rows: (string | number)[][]; summary?: string }) {
  return (
    <details className="group mt-3 text-[12.5px]">
      <summary className="inline-flex h-8 items-center gap-1.5 rounded-full px-2 font-medium text-mute hover:text-ink">
        <svg viewBox="0 0 12 12" className="h-3 w-3 transition-transform group-open:rotate-90" aria-hidden><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
        {summary}
      </summary>
      <div className="mt-2 overflow-x-auto rounded-[12px] border border-line">
        <table className="w-full tabular-nums">
          <thead><tr>{columns.map((c, i) => <th key={c} className={clsx("bg-canvas-2/70 px-3 py-2 text-[11px] font-semibold text-mute", i ? "text-right" : "text-left")}>{c}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-line">{r.map((v, j) => <td key={j} className={clsx("border-t border-line px-3 py-1.5", j ? "text-right" : "text-left")}>{v}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/* Horizontal bar list — magnitude by category                          */
/* ------------------------------------------------------------------ */
export function BarList({ data, format = "compact", color = SERIES.a, ariaLabel, total, labelWidth = 104 }: {
  data: { label: string; value: number; note?: string }[]; format?: Fmt; color?: string; ariaLabel: string; total?: number; labelWidth?: number;
}) {
  const mounted = useMounted();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const sum = total ?? data.reduce((a, d) => a + d.value, 0);
  return (
    <div role="img" aria-label={ariaLabel}>
      <ul className="space-y-1">
        {data.map((d, i) => (
          <li key={d.label} className="relative grid items-center gap-3 rounded-[8px] py-1" style={{ gridTemplateColumns: `${labelWidth}px 1fr` }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="truncate text-[13px] text-ink-2" title={d.label}>{d.label}</span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="relative h-3.5 min-w-0 flex-1">
                <span className="absolute inset-y-0 left-0 rounded-r-[4px] transition-[transform,opacity] duration-700 ease-out-expo"
                  style={{ width: `${(d.value / max) * 100}%`, background: color, transform: `scaleX(${mounted ? 1 : 0})`, transformOrigin: "left", opacity: hover == null || hover === i ? 1 : 0.45, transitionDelay: `${i * 40}ms` }} />
              </span>
              <span className="w-14 shrink-0 text-right text-[13px] font-semibold tabular-nums text-ink">{fmt(format, d.value)}</span>
            </span>
            {hover === i && (
              <Tip x={labelWidth + 12} y={2} align="left">
                <span className="font-semibold">{d.label}</span> <span className="tabular-nums">{fmt(format === "compact" || format === "km" ? "num" : format, d.value)}</span>
                <span className="text-mute"> · {Math.round((d.value / sum) * 100)}% of total</span>{d.note && <span className="text-mute"> · {d.note}</span>}
              </Tip>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Column chart — change over a few periods, optional target line       */
/* ------------------------------------------------------------------ */
export function Columns({ data, format = "num", height = 180, target, targetLabel, ariaLabel, highlightLast = true, color = SERIES.a }: {
  data: { label: string; value: number }[]; format?: Fmt; height?: number; target?: number; targetLabel?: string; ariaLabel: string; highlightLast?: boolean; color?: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const mounted = useMounted();
  const [hover, setHover] = useState<number | null>(null);
  const ticks = niceTicks(Math.max(...data.map((d) => d.value), target ?? 0));
  const top = ticks.at(-1)!;
  const padL = 40, padB = 22, padT = 10, ih = height - padB - padT, iw = w - padL - 4;
  const band = iw / data.length, bw = Math.min(24, band * 0.56);
  const y = (v: number) => padT + ih - (v / top) * ih;
  return (
    <div ref={ref} className="relative" role="img" aria-label={ariaLabel}>
      <svg width={w} height={height} className="block overflow-visible">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={w} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#D3D0C5" : SERIES.grid} strokeWidth="1" />
            <text x={padL - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill={SERIES.axis} className="tabular-nums">{fmt(format === "inr" ? "inrc" : format === "num" ? "compact" : format, t)}</text>
          </g>
        ))}
        {target != null && (
          <g>
            <line x1={padL} x2={w} y1={y(target)} y2={y(target)} stroke="#0B1533" strokeWidth="1.5" />
            <text x={w} y={y(target) - 6} textAnchor="end" fontSize="11" fontWeight="600" fill="#0B1533">{targetLabel ?? "Target"} {fmt(format === "inr" ? "inrc" : format, target)}</text>
          </g>
        )}
        {data.map((d, i) => {
          const x = padL + band * i + (band - bw) / 2, h = (d.value / top) * ih;
          const on = hover === i || (hover == null && highlightLast && i === data.length - 1);
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + band * i} y={padT} width={band} height={ih + padB} fill="transparent" />
              <path d={colPath(x, y(d.value), bw, h)} fill={color} opacity={on || hover == null ? 1 : 0.4}
                style={{ transform: `scaleY(${mounted ? 1 : 0})`, transformBox: "fill-box", transformOrigin: "bottom", transition: `transform 700ms var(--ease-out-expo) ${i * 40}ms, opacity 150ms` }} />
              {on && hover == null && <text x={x + bw / 2} y={y(d.value) - 6} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#0B1533" className="tabular-nums">{fmt(format === "inr" ? "inrc" : format, d.value)}</text>}
              <text x={x + bw / 2} y={height - 6} textAnchor="middle" fontSize="11" fill={SERIES.axis}>{d.label}</text>
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <Tip x={padL + band * hover + band / 2} y={y(data[hover].value)}>
          <span className="text-mute">{data[hover].label}</span> <span className="font-semibold tabular-nums">{fmt(format, data[hover].value)}</span>
          {hover > 0 && data[hover - 1].value > 0 && <span className="text-mute tabular-nums"> · {data[hover].value >= data[hover - 1].value ? "+" : ""}{Math.round(((data[hover].value - data[hover - 1].value) / data[hover - 1].value) * 100)}% vs prior</span>}
        </Tip>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stacked columns — two series (won + weighted pipeline)               */
/* ------------------------------------------------------------------ */
export function StackedColumns({ data, series, format = "inr", height = 220, target, targetLabel, forecastFrom, ariaLabel }: {
  data: { label: string; a: number; b: number }[]; series: [string, string]; format?: Fmt; height?: number; target?: number; targetLabel?: string; forecastFrom?: number; ariaLabel: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const mounted = useMounted();
  const [hover, setHover] = useState<number | null>(null);
  const ticks = niceTicks(Math.max(...data.map((d) => d.a + d.b), target ?? 0));
  const top = ticks.at(-1)!;
  const padL = 44, padB = 22, padT = 18, ih = height - padB - padT, iw = w - padL - 4;
  const band = iw / data.length, bw = Math.min(24, band * 0.56);
  const y = (v: number) => padT + ih - (v / top) * ih;
  const axisFmt: Fmt = format === "inr" ? "inrc" : format;
  return (
    <div ref={ref} className="relative" role="img" aria-label={ariaLabel}>
      <Legend items={[{ label: series[0], color: SERIES.a }, { label: series[1], color: SERIES.b }, ...(target ? [{ label: targetLabel ?? "Target", color: "#0B1533", line: true }] : [])]} className="mb-2" />
      <svg width={w} height={height} className="block overflow-visible">
        {forecastFrom != null && (
          <g>
            <rect x={padL + band * forecastFrom} y={padT - 14} width={iw - band * forecastFrom + 4} height={ih + 14} fill="#F3F4F7" />
            <text x={padL + band * forecastFrom + 6} y={padT - 4} fontSize="10.5" fontWeight="600" fill={SERIES.axis}>FORECAST</text>
          </g>
        )}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={w} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#D3D0C5" : SERIES.grid} strokeWidth="1" />
            <text x={padL - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill={SERIES.axis} className="tabular-nums">{fmt(axisFmt, t)}</text>
          </g>
        ))}
        {target != null && <line x1={padL} x2={w} y1={y(target)} y2={y(target)} stroke="#0B1533" strokeWidth="1.5" />}
        {data.map((d, i) => {
          const x = padL + band * i + (band - bw) / 2;
          const ha = (d.a / top) * ih, hb = (d.b / top) * ih;
          const dim = hover != null && hover !== i ? 0.4 : 1;
          const style = { transform: `scaleY(${mounted ? 1 : 0})`, transformBox: "view-box" as const, transformOrigin: `0 ${padT + ih}px`, transition: `transform 700ms var(--ease-out-expo) ${i * 40}ms, opacity 150ms` };
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={style} opacity={dim}>
              <rect x={padL + band * i} y={padT} width={band} height={ih + padB} fill="transparent" />
              {hb > 0
                ? <><rect x={x} y={y(d.a)} width={bw} height={ha} fill={SERIES.a} /><path d={colPath(x, y(d.a + d.b), bw, Math.max(0, hb - 2))} fill={SERIES.b} /></>
                : <path d={colPath(x, y(d.a), bw, ha)} fill={SERIES.a} />}
            </g>
          );
        })}
        {data.map((d, i) => <text key={d.label} x={padL + band * i + band / 2} y={height - 6} textAnchor="middle" fontSize="11" fill={SERIES.axis}>{d.label}</text>)}
      </svg>
      {hover != null && (
        <Tip x={padL + band * hover + band / 2} y={y(data[hover].a + data[hover].b)}>
          <div className="mb-0.5 font-semibold">{data[hover].label}</div>
          <div className="flex items-center gap-1.5 tabular-nums"><Swatch color={SERIES.a} />{series[0]} <b className="ml-auto pl-3">{fmt(format, data[hover].a)}</b></div>
          {data[hover].b > 0 && <div className="flex items-center gap-1.5 tabular-nums"><Swatch color={SERIES.b} />{series[1]} <b className="ml-auto pl-3">{fmt(format, data[hover].b)}</b></div>}
        </Tip>
      )}
    </div>
  );
}

export function Swatch({ color, line = false }: { color: string; line?: boolean }) {
  return <span aria-hidden className={clsx("inline-block shrink-0", line ? "h-[2px] w-3" : "h-2.5 w-2.5 rounded-[3px]")} style={{ background: color }} />;
}
export function Legend({ items, className }: { items: { label: string; color: string; line?: boolean }[]; className?: string }) {
  return (
    <ul className={clsx("flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-2", className)}>
      {items.map((i) => <li key={i.label} className="inline-flex items-center gap-1.5"><Swatch color={i.color} line={i.line} />{i.label}</li>)}
    </ul>
  );
}

/** Show ~6 evenly spaced x labels plus the last, skipping one that would crowd the last. */
function labelAt(i: number, n: number) {
  const st = Math.ceil(n / 6), last = n - 1;
  if (i === last) return true;
  return i % st === 0 && last - i >= Math.ceil(st / 2) + 1;
}

/* ------------------------------------------------------------------ */
/* Area line — daily trend with crosshair                               */
/* ------------------------------------------------------------------ */
export function AreaLine({ data, format = "compact", height = 200, ariaLabel }: { data: { label: string; value: number }[]; format?: Fmt; height?: number; ariaLabel: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const ticks = niceTicks(Math.max(...data.map((d) => d.value)));
  const top = ticks.at(-1)!;
  const padL = 40, padB = 22, padT = 12, ih = height - padB - padT, iw = w - padL - 10;
  const x = (i: number) => padL + (i / (data.length - 1)) * iw;
  const y = (v: number) => padT + ih - (v / top) * ih;
  const d = data.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join("");
  const peak = data.reduce((m, p, i) => (p.value > data[m].value ? i : m), 0);
  const show = hover ?? peak;
  return (
    <div ref={ref} className="relative" role="img" aria-label={ariaLabel}
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const i = Math.round(((e.clientX - r.left - padL) / iw) * (data.length - 1)); setHover(Math.max(0, Math.min(data.length - 1, i))); }}
      onMouseLeave={() => setHover(null)}>
      <svg width={w} height={height} className="block overflow-visible">
        <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={SERIES.a} stopOpacity=".14" /><stop offset="1" stopColor={SERIES.a} stopOpacity="0" /></linearGradient></defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={w} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#D3D0C5" : SERIES.grid} />
            <text x={padL - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill={SERIES.axis}>{fmt(format, t)}</text>
          </g>
        ))}
        <path d={`${d}L${x(data.length - 1)} ${y(0)}L${x(0)} ${y(0)}Z`} fill={`url(#${gid})`} />
        <path d={d} fill="none" stroke={SERIES.a} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="[stroke-dasharray:2000] [stroke-dashoffset:2000] animate-[draw_1.2s_var(--ease-out-expo)_forwards]" />
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + ih} stroke="#8B90A3" strokeWidth="1" />}
        <circle cx={x(show)} cy={y(data[show].value)} r="4.5" fill={SERIES.a} stroke="#fff" strokeWidth="2" />
        {data.map((p, i) => labelAt(i, data.length) && <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="11" fill={SERIES.axis}>{p.label}</text>)}
      </svg>
      <Tip x={x(show)} y={y(data[show].value)} align={show > data.length * 0.8 ? "right" : show < data.length * 0.15 ? "left" : "center"}>
        <span className="text-mute">{hover == null ? "Peak · " : ""}{data[show].label}</span> <span className="font-semibold tabular-nums">{fmt(format === "compact" || format === "km" ? "num" : format, data[show].value)}</span>
      </Tip>
      <style>{`@keyframes draw { to { stroke-dashoffset: 0; } }`}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bullet — one KPI vs a target or benchmark                            */
/* ------------------------------------------------------------------ */
export function Bullet({ value, target, max, format = "compact", lowerIsBetter = false, targetLabel = "Target", label }: {
  value: number; target: number; max?: number; format?: Fmt; lowerIsBetter?: boolean; targetLabel?: string; label: string;
}) {
  const mounted = useMounted();
  const [hover, setHover] = useState(false);
  const m = max ?? Math.max(value, target) * 1.15;
  const good = lowerIsBetter ? value <= target : value >= target;
  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="relative h-3 rounded-full bg-canvas-2" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={m} aria-label={`${label}: ${fmt(format, value)}, ${targetLabel.toLowerCase()} ${fmt(format, target)}`}>
        <div className="absolute inset-y-0 left-0 rounded-full bg-cobalt transition-transform duration-700 ease-out-expo" style={{ width: `${Math.min(100, (value / m) * 100)}%`, transform: `scaleX(${mounted ? 1 : 0})`, transformOrigin: "left" }} />
        <div className="absolute -top-1 -bottom-1 w-[3px] rounded-full bg-ink ring-2 ring-surface" style={{ left: `calc(${Math.min(100, (target / m) * 100)}% - 1.5px)` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[12px] text-mute tabular-nums">
        <span className={clsx("inline-flex items-center gap-1 font-medium", good ? "text-ok" : "text-warn")}>
          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>{good ? <path d="M2.5 6.2 5 8.6l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M6 2.5v4M6 9h0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}</svg>
          {good ? (lowerIsBetter ? "Better than" : "Ahead of") : (lowerIsBetter ? "Above" : "Behind")} {targetLabel.toLowerCase()}
        </span>
        <span>{targetLabel} {fmt(format, target)}</span>
      </div>
      {hover && <Tip x={`${(Math.min(value, m) / m) * 100}%`} y={0} align="center"><span className="font-semibold tabular-nums">{fmt(format, value)}</span><span className="text-mute tabular-nums"> · {Math.round((value / target) * 100)}% of {targetLabel.toLowerCase()}</span></Tip>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Diverging heatmap — supply ÷ demand                                  */
/* ------------------------------------------------------------------ */
const DIV = { short3: "#C2412A", short2: "#F19A84", short1: "#FBD9CF", even: "#EEF0F4", over1: "#DCE3FF", over2: "#B9C6FF", over3: "#5E78FF" };
export function ratioColor(r: number) {
  if (r < 1.5) return DIV.short3;
  if (r < 2.5) return DIV.short2;
  if (r < 3.5) return DIV.short1;
  if (r < 5) return DIV.even;
  if (r < 8) return DIV.over1;
  if (r < 12) return DIV.over2;
  return DIV.over3;
}
const darkCell = (c: string) => [DIV.short3, DIV.over3].includes(c);

export function GapHeatmap({ rows, cols, supply, demand }: { rows: string[]; cols: string[]; supply: number[][]; demand: number[][] }) {
  const [hover, setHover] = useState<[number, number] | null>(null);
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-[2px] tabular-nums" aria-label="Creator supply per open brief slot, by city and niche">
          <thead>
            <tr>
              <th className="w-24" />
              {cols.map((c) => <th key={c} scope="col" className="px-1 pb-1 text-center text-[11.5px] font-medium text-mute">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r}>
                <th scope="row" className="pr-2 text-left text-[12.5px] font-medium text-ink-2">{r}</th>
                {cols.map((c, j) => {
                  const ratio = demand[i][j] ? supply[i][j] / demand[i][j] : 99;
                  const bg = ratioColor(ratio), on = hover && hover[0] === i && hover[1] === j;
                  return (
                    <td key={c} className="relative p-0" onMouseEnter={() => setHover([i, j])} onMouseLeave={() => setHover(null)}>
                      <div className={clsx("grid h-11 place-items-center rounded-[6px] text-[12px] font-semibold transition-transform duration-150", on && "scale-[1.06]")}
                        style={{ background: bg, color: darkCell(bg) ? "#fff" : "#0B1533" }}>
                        {ratio >= 99 ? "—" : `${ratio.toFixed(1)}×`}
                      </div>
                      {on && (
                        <Tip x={0} y={0} align={j > cols.length / 2 ? "right" : "left"}>
                          <div className="font-semibold">{r} · {c}</div>
                          <div className="tabular-nums text-ink-2">{supply[i][j]} approved creators · {demand[i][j]} open slots</div>
                          <div className="text-mute">{ratio < 2.5 ? "Shortage: recruit here" : ratio < 5 ? "Balanced" : "Surplus: pitch brands here"}</div>
                        </Tip>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11.5px] text-mute">
        <span className="font-medium text-ink-2">Creators per open slot</span>
        <span className="inline-flex overflow-hidden rounded-full">
          {[DIV.short3, DIV.short2, DIV.short1, DIV.even, DIV.over1, DIV.over2, DIV.over3].map((c) => <span key={c} className="h-2.5 w-6" style={{ background: c }} />)}
        </span>
        <span className="tabular-nums">&lt;1.5× shortage</span><span aria-hidden>·</span><span className="tabular-nums">3.5–5× balanced</span><span aria-hidden>·</span><span className="tabular-nums">12×+ surplus</span>
      </div>
    </div>
  );
}
