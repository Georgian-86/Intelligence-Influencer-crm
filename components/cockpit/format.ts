/** Number formatting + tick helpers shared by server and client chart code. */
export type Fmt = "km" | "inr" | "inr2" | "inrc" | "compact" | "pct" | "num" | "x";

export const SERIES = { a: "#2B4BFF", b: "#8EA2FF", grid: "#ECEEF2", axis: "#596075", track: "#EEF0F4" } as const;

export function fmt(kind: Fmt, v: number): string {
  switch (kind) {
    case "inr": return `₹${Math.round(v).toLocaleString("en-IN")}`;
    case "km": return v >= 1e6 ? `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M` : v >= 1e3 ? `${Math.round(v / 1e3)}K` : String(Math.round(v));
    case "inr2": return `₹${v.toFixed(2)}`;
    case "inrc": return `₹${short(v)}`;
    case "compact": return short(v);
    case "pct": return `${(Math.round(v * 10) / 10).toLocaleString("en-IN")}%`;
    case "x": return `${(Math.round(v * 100) / 100).toFixed(2)}×`;
    default: return Math.round(v).toLocaleString("en-IN");
  }
}
function short(n: number) {
  const a = Math.abs(n);
  if (a >= 10_000_000) return `${(n / 10_000_000).toFixed(a >= 100_000_000 ? 0 : 2).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")}Cr`;
  if (a >= 100_000) return `${(n / 100_000).toFixed(a >= 1_000_000 ? 1 : 2).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")}L`;
  if (a >= 1_000) return `${(n / 1_000).toFixed(a >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}

/** Clean 0-based ticks (1/2/2.5/5 × 10ⁿ). */
export function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count, pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

