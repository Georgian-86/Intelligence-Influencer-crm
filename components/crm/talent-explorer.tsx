"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDown, ArrowUp, BadgeCheck, Bookmark, Check, ChevronDown, Download, Eye, LayoutGrid, Plus, Rows3, Search, SearchX, X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Avatar, MediaTile, Sparkline, km } from "@/components/kit";
import { WhatsAppIcon } from "@/components/brand/icons";
import { FOLLOWER_TIERS } from "@/lib/constants";
import { addTalentToBrief } from "@/app/crm/actions";
import { eligible, matchScore } from "./match-score";
import { Kbd, RankBadge } from "./ui";
import { toast } from "./toast";
import type { BriefCriteriaVM, TalentRow } from "./types";

type Filters = { q: string; city: string; campus: boolean; niche: string; tier: string; er: string; rank: string; verified: boolean; avail: string };
type SortKey = "match" | "followers" | "er" | "avgViews" | "rate" | "name";
const EMPTY: Filters = { q: "", city: "", campus: false, niche: "", tier: "", er: "", rank: "", verified: false, avail: "" };
const RANK_ORDER = ["bronze", "silver", "gold", "platinum"];
const AVAIL = { available: { label: "Available", dot: "bg-ok" }, busy: { label: "Busy", dot: "bg-warn" }, away: { label: "Away", dot: "bg-faint" } } as const;

function parse(qs: string): { f: Filters; sort: SortKey; dir: "asc" | "desc"; view: "table" | "grid"; brief: string | null } {
  const p = new URLSearchParams(qs);
  return {
    f: { q: p.get("q") ?? "", city: p.get("city") ?? "", campus: p.get("campus") === "1", niche: p.get("niche") ?? "", tier: p.get("tier") ?? "", er: p.get("er") ?? "", rank: p.get("rank") ?? "", verified: p.get("verified") === "1", avail: p.get("avail") ?? "" },
    sort: (p.get("sort") as SortKey) || "match", dir: p.get("dir") === "asc" ? "asc" : "desc", view: p.get("view") === "grid" ? "grid" : "table", brief: p.get("brief"),
  };
}

function toQuery(f: Filters) {
  const p = new URLSearchParams();
  (Object.keys(f) as (keyof Filters)[]).forEach((k) => {
    const v = f[k];
    if (v === true) p.set(k, "1");
    else if (typeof v === "string" && v) p.set(k, v);
  });
  return p;
}

function apply(rows: TalentRow[], f: Filters) {
  const q = f.q.trim().toLowerCase().replace(/^@/, "");
  const tier = FOLLOWER_TIERS.find((t) => t.key === f.tier);
  const er = f.er ? Number(f.er) : null;
  return rows.filter((r) => {
    if (q && ![r.name, r.handle, r.college, r.city, ...r.categories].some((v) => v?.toLowerCase().includes(q))) return false;
    if (f.city && r.city !== f.city) return false;
    if (f.campus && !r.campus) return false;
    if (f.niche && !r.categories.includes(f.niche)) return false;
    if (tier && (r.followers == null || r.followers < tier.min || (tier.max != null && r.followers >= tier.max))) return false;
    if (er != null && (r.er ?? 0) < er) return false;
    if (f.rank) {
      const min = f.rank.endsWith("+") ? RANK_ORDER.indexOf(f.rank.slice(0, -1)) : -1;
      if (min >= 0 ? RANK_ORDER.indexOf(r.rank) < min : r.rank !== f.rank) return false;
    }
    if (f.verified && !r.verified) return false;
    if (f.avail && r.availability !== f.avail) return false;
    return true;
  });
}

const chipLabel: Record<keyof Filters, (v: string) => string> = {
  q: (v) => `“${v}”`, city: (v) => v, campus: () => "Campus only", niche: (v) => v, tier: (v) => FOLLOWER_TIERS.find((t) => t.key === v)?.label ?? v,
  er: (v) => `ER ${v}%+`, rank: (v) => (v.endsWith("+") ? `${v.slice(0, -1)} & up` : v), verified: () => "Verified insights", avail: (v) => AVAIL[v as keyof typeof AVAIL]?.label ?? v,
};

export function TalentExplorer({ rows, briefs, initialQuery, savedViews, canExport, canManage }: {
  rows: TalentRow[]; briefs: BriefCriteriaVM[]; initialQuery: string; savedViews: { id: string; name: string; query: string }[]; canExport: boolean; canManage: boolean;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const init = useMemo(() => parse(initialQuery), [initialQuery]);
  const [f, setF] = useState<Filters>(init.f);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: init.sort, dir: init.dir });
  const [view, setView] = useState<"table" | "grid">(init.view);
  const [briefId, setBriefId] = useState<string>(init.brief ?? briefs[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState(0);
  const [peek, setPeek] = useState<string | null>(null);
  const [custom, setCustom] = useState<{ id: string; name: string; query: string }[]>([]);
  const [bulkBrief, setBulkBrief] = useState<string>(briefs[0]?.id ?? "");
  const [pending, start] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const brief = briefs.find((b) => b.id === briefId) ?? null;
  const cities = useMemo(() => Array.from(new Set(rows.map((r) => r.city).filter(Boolean) as string[])).sort(), [rows]);
  const niches = useMemo(() => Array.from(new Set(rows.flatMap((r) => r.categories))).sort(), [rows]);

  const scored = useMemo(() => rows.map((r) => ({ r, m: matchScore(brief, r) })), [rows, brief]);
  const list = useMemo(() => {
    const ok = new Set(apply(rows, f).map((r) => r.id));
    const val = (x: { r: TalentRow; m: number }) => (sort.key === "match" ? x.m : sort.key === "name" ? 0 : (x.r[sort.key] ?? -1));
    const out = scored.filter((x) => ok.has(x.r.id));
    out.sort((a, b) => (sort.key === "name" ? a.r.name.localeCompare(b.r.name) : val(b) - val(a)) * (sort.dir === "asc" ? -1 : 1));
    return out;
  }, [rows, f, scored, sort]);

  useEffect(() => {
    try { setCustom(JSON.parse(localStorage.getItem("crm.talentViews") ?? "[]")); } catch { /* ignore */ }
  }, []);

  // keep the URL shareable without a navigation
  useEffect(() => {
    const p = toQuery(f);
    if (sort.key !== "match") p.set("sort", sort.key);
    if (sort.dir === "asc") p.set("dir", "asc");
    if (view === "grid") p.set("view", "grid");
    if (briefId && briefId !== briefs[0]?.id) p.set("brief", briefId);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [f, sort, view, briefId, briefs]);

  useEffect(() => setActive((a) => Math.min(a, Math.max(0, list.length - 1))), [list.length]);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((s) => ({ ...s, [k]: v }));
  const toggleSel = useCallback((id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const allOn = list.length > 0 && list.every((x) => selected.has(x.r.id));

  // j/k row navigation, x select, o quick view, enter open, / search
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) {
        if (e.key === "Escape" && el === searchRef.current) searchRef.current?.blur();
        return;
      }
      const cur = list[active]?.r;
      if (e.key === "j" || e.key === "ArrowDown") { e.preventDefault(); setActive((a) => { const n = Math.min(list.length - 1, a + 1); if (peek) setPeek(list[n]?.r.id ?? null); return n; }); }
      else if (e.key === "k" || e.key === "ArrowUp") { e.preventDefault(); setActive((a) => { const n = Math.max(0, a - 1); if (peek) setPeek(list[n]?.r.id ?? null); return n; }); }
      else if (e.key === "x" && cur) toggleSel(cur.id);
      else if ((e.key === "o" || e.key === " ") && cur) { e.preventDefault(); setPeek((p) => (p === cur.id ? null : cur.id)); }
      else if (e.key === "Enter" && cur) router.push(`/crm/talent/${cur.id}`);
      else if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === "Escape") setPeek(null);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [list, active, peek, router, toggleSel]);

  useEffect(() => {
    document.querySelector(`[data-row-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const chips = (Object.keys(f) as (keyof Filters)[]).filter((k) => f[k]);
  const applyView = (q: string) => { setF(parse(q).f); setSelected(new Set()); };
  const currentQ = toQuery(f).toString();
  const saveView = () => {
    if (!chips.length) return;
    const name = chips.map((k) => chipLabel[k](String(f[k]))).slice(0, 3).join(" · ");
    const next = [...custom, { id: `v${Date.now()}`, name, query: currentQ }];
    setCustom(next);
    localStorage.setItem("crm.talentViews", JSON.stringify(next));
    toast(`Saved view “${name}”`);
  };
  const removeView = (id: string) => { const next = custom.filter((v) => v.id !== id); setCustom(next); localStorage.setItem("crm.talentViews", JSON.stringify(next)); };

  const exportHref = (ids?: string[]) => {
    const p = new URLSearchParams();
    if (ids?.length) p.set("ids", ids.join(","));
    else {
      if (f.q) p.set("q", f.q);
      if (f.city) p.set("city", f.city);
      if (f.niche) p.set("category", f.niche);
      const tier = FOLLOWER_TIERS.find((t) => t.key === f.tier);
      if (tier) { p.set("min_followers", String(tier.min)); if (tier.max) p.set("max_followers", String(tier.max)); }
      if (f.er) p.set("min_er", f.er);
      if (f.rank && !f.rank.endsWith("+")) p.set("rank", f.rank);
    }
    return `/crm/talent/export?${p}`;
  };

  const addSelected = () => {
    const ids = [...selected];
    const b = briefs.find((x) => x.id === bulkBrief);
    start(async () => {
      const res = await addTalentToBrief(bulkBrief, ids);
      if (res.ok) { toast(`Added ${res.added} creator${res.added > 1 ? "s" : ""} to ${b?.title ?? "brief"}`, { action: { label: "Open brief", href: `/crm/briefs/${bulkBrief}` } }); setSelected(new Set()); }
      else toast(res.error ?? "Couldn't add to brief", { tone: "error" });
    });
  };

  const onRowEnter = (id: string, i: number) => {
    if (!peek) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => { setPeek(id); setActive(i); }, 140);
  };

  const peekRow = rows.find((r) => r.id === peek) ?? null;
  const SortTh = ({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) => (
    <th aria-sort={sort.key === k ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={className}>
      <button onClick={() => setSort((s) => ({ key: k, dir: s.key === k && s.dir === "desc" ? "asc" : "desc" }))}
        className={clsx("inline-flex items-center gap-1 uppercase tracking-[0.08em] hover:text-ink", sort.key === k && "text-ink")}>
        {children}
        {sort.key === k ? (sort.dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ArrowDown className="h-3 w-3 opacity-0" />}
      </button>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* saved views */}
      <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5" role="list" aria-label="Saved views">
        <Bookmark className="mr-1 h-4 w-4 shrink-0 text-faint" aria-hidden />
        {[...savedViews, ...custom].map((v) => {
          const on = v.query === currentQ;
          const isCustom = custom.some((c) => c.id === v.id);
          return (
            <span key={v.id} role="listitem" className={clsx("group inline-flex h-8 shrink-0 items-center rounded-full border text-[13px] font-medium transition-colors",
              on ? "border-cobalt-200 bg-cobalt-50 text-cobalt-700" : "border-line bg-surface text-ink-2 hover:border-line-2")}>
              <button onClick={() => applyView(v.query)} className={clsx("h-full pl-3", isCustom ? "pr-1" : "pr-3")} aria-pressed={on}>{v.name}</button>
              {isCustom && <button onClick={() => removeView(v.id)} className="mr-1 grid h-6 w-6 place-items-center rounded-full text-faint hover:bg-canvas-2 hover:text-ink" aria-label={`Delete view ${v.name}`}><X className="h-3 w-3" /></button>}
            </span>
          );
        })}
        <button onClick={saveView} disabled={!chips.length} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] font-semibold text-cobalt transition-colors hover:bg-cobalt-50 disabled:text-faint disabled:hover:bg-transparent">
          <Plus className="h-3.5 w-3.5" /> Save view
        </button>
      </div>

      {/* filter bar */}
      <div className="card p-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <label className="relative md:min-w-[200px] md:flex-1">
            <span className="sr-only">Search creators</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input ref={searchRef} value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Search name, @handle, college"
              className="h-10 w-full rounded-full border border-line bg-canvas/60 pl-9 pr-10 text-[14px] outline-none transition-[border-color,box-shadow] placeholder:text-faint hover:border-line-2 focus:border-cobalt focus:bg-surface focus:ring-4 focus:ring-cobalt/12" />
            <Kbd className="absolute right-3 top-1/2 -translate-y-1/2">/</Kbd>
          </label>
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-0.5 md:mx-0 md:overflow-visible md:px-0 md:pb-0">
            <Select label="City" value={f.city} onChange={(v) => set("city", v)} options={cities.map((c) => [c, c])} />
            <Select label="Niche" value={f.niche} onChange={(v) => set("niche", v)} options={niches.map((c) => [c, c])} />
            <Select label="Followers" value={f.tier} onChange={(v) => set("tier", v)} options={FOLLOWER_TIERS.map((t) => [t.key, t.label])} />
            <Select label="ER" value={f.er} onChange={(v) => set("er", v)} options={[["2", "2%+"], ["3", "3%+"], ["4", "4%+"], ["5", "5%+"], ["7", "7%+"]]} />
            <Select label="Rank" value={f.rank} onChange={(v) => set("rank", v)} options={[["silver+", "Silver & up"], ["gold+", "Gold & up"], ["platinum", "Platinum"], ["bronze", "Bronze"]]} />
            <Select label="Availability" value={f.avail} onChange={(v) => set("avail", v)} options={[["available", "Available"], ["busy", "Busy"], ["away", "Away"]]} />
            <span className="contents md:hidden">
              <Toggle on={f.campus} onClick={() => set("campus", !f.campus)}>Campus only</Toggle>
              <Toggle on={f.verified} onClick={() => set("verified", !f.verified)}>Verified insights</Toggle>
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="hidden gap-2 md:flex">
            <Toggle on={f.campus} onClick={() => set("campus", !f.campus)} small>Campus only</Toggle>
            <Toggle on={f.verified} onClick={() => set("verified", !f.verified)} small>Verified insights</Toggle>
            <span className="mx-1 h-5 w-px self-center bg-line" aria-hidden />
          </span>
          <span className="mr-1 text-[13px] text-mute" aria-live="polite"><strong className="font-semibold tabular-nums text-ink">{list.length}</strong> of {rows.length} creators</span>
          {chips.map((k) => (
            <button key={k} onClick={() => set(k, (typeof f[k] === "boolean" ? false : "") as never)}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-cobalt-50 pl-2.5 pr-1.5 text-[12.5px] font-medium capitalize text-cobalt-700 hover:bg-cobalt-100" aria-label={`Remove filter ${chipLabel[k](String(f[k]))}`}>
              {chipLabel[k](String(f[k]))} <X className="h-3 w-3" />
            </button>
          ))}
          {chips.length > 0 && <button onClick={() => setF(EMPTY)} className="h-7 px-2 text-[12.5px] font-semibold text-mute hover:text-ink">Clear all</button>}
          <div className="ml-auto flex items-center gap-2">
            {briefs.length > 0 && (
              <label className="inline-flex items-center gap-2 text-[12.5px] text-mute">
                <span className="hidden sm:inline">Match vs</span>
                <span className="relative">
                  <select value={briefId} onChange={(e) => setBriefId(e.target.value)} className="h-8 max-w-[200px] appearance-none truncate rounded-full border border-line bg-surface pl-3 pr-7 text-[12.5px] font-medium text-ink outline-none hover:border-line-2 focus:border-cobalt">
                    <option value="">No brief (overall fit)</option>
                    {briefs.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute" />
                </span>
              </label>
            )}
            <div className="hidden rounded-full border border-line bg-canvas-2/70 p-0.5 md:inline-flex" role="group" aria-label="Layout">
              {(["table", "grid"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} aria-pressed={view === v} aria-label={`${v} view`}
                  className={clsx("grid h-7 w-8 place-items-center rounded-full transition-colors", view === v ? "bg-surface text-ink shadow-xs" : "text-mute hover:text-ink")}>
                  {v === "table" ? <Rows3 className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                </button>
              ))}
            </div>
            {canExport && <a href={exportHref()} className="btn-ghost btn-sm hidden sm:inline-flex"><Download className="h-3.5 w-3.5" /> Export CSV</a>}
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-line-2 bg-surface/60 px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-cobalt-50 text-cobalt"><SearchX className="h-5 w-5" /></span>
          <div className="font-display text-[17px] font-semibold">No creators match these filters</div>
          <p className="max-w-sm text-[14px] text-mute">Loosen the follower range or ER floor, or clear filters to see the whole pool.</p>
          <button onClick={() => setF(EMPTY)} className="btn-ghost btn-sm">Clear filters</button>
        </div>
      ) : view === "table" ? (
        <>
          {/* desktop table */}
          <div className="card hidden overflow-hidden md:block">
            <div className="max-h-[calc(100dvh-340px)] min-h-[420px] overflow-auto overscroll-contain">
              <table className="w-full min-w-[980px] border-separate border-spacing-0 text-[13.5px]">
                <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:h-10 [&_th]:border-b [&_th]:border-line [&_th]:bg-canvas-2/90 [&_th]:px-3 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:whitespace-nowrap [&_th]:text-mute [&_th]:backdrop-blur">
                  <tr>
                    <th className="w-11 !pl-4">
                      <input type="checkbox" checked={allOn} onChange={() => setSelected(allOn ? new Set() : new Set(list.map((x) => x.r.id)))} aria-label="Select all" className="h-4 w-4 accent-[var(--color-cobalt)]" />
                    </th>
                    <SortTh k="name">Creator</SortTh>
                    <th>City</th>
                    <th className="hidden xl:table-cell">College</th>
                    <SortTh k="followers" className="text-right [&>button]:flex-row-reverse">Followers</SortTh>
                    <SortTh k="er" className="text-right [&>button]:flex-row-reverse">ER</SortTh>
                    <SortTh k="avgViews" className="text-right [&>button]:flex-row-reverse">Avg views</SortTh>
                    <th>Rank</th>
                    <SortTh k="rate" className="text-right [&>button]:flex-row-reverse">Rate</SortTh>
                    <SortTh k="match">Match</SortTh>
                    <th className="w-12"><span className="sr-only">Quick view</span></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(({ r, m }, i) => {
                    const sel = selected.has(r.id), act = i === active, pk = peek === r.id;
                    return (
                      <tr key={r.id} data-row-index={i} onMouseEnter={() => onRowEnter(r.id, i)} onClick={(e) => { if ((e.target as HTMLElement).closest("a,button,input")) return; setActive(i); setPeek(r.id); }}
                        className={clsx("group h-[52px] cursor-default transition-colors [&>td]:border-b [&>td]:border-line [&>td]:px-3",
                          sel ? "bg-cobalt-50/70" : pk ? "bg-cobalt-50/40" : "hover:bg-canvas/70", act && "shadow-[inset_3px_0_0_var(--color-cobalt)]")}>
                        <td className="!pl-4"><input type="checkbox" checked={sel} onChange={() => toggleSel(r.id)} aria-label={`Select ${r.name}`} className="h-4 w-4 accent-[var(--color-cobalt)]" /></td>
                        <td>
                          <Link href={`/crm/talent/${r.id}`} className="flex min-w-0 items-center gap-2.5">
                            <span className="relative">
                              <Avatar name={r.name} hue={r.hue} size={32} />
                              <span className={clsx("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface", AVAIL[r.availability].dot)} title={AVAIL[r.availability].label} />
                            </span>
                            <span className="min-w-0 leading-tight">
                              <span className="flex items-center gap-1 truncate font-semibold text-ink group-hover:text-cobalt-700">{r.name}{r.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-cobalt" aria-label="Verified insights" />}</span>
                              <span className="block truncate text-[12px] text-mute">{r.handle ? `@${r.handle}` : "No Instagram"}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="whitespace-nowrap text-ink-2">{r.city ?? "—"}</td>
                        <td className="hidden max-w-[220px] truncate text-ink-2 xl:table-cell" title={r.college ?? undefined}>{r.college ?? <span className="text-faint">—</span>}</td>
                        <td className="text-right font-semibold tabular-nums">{km(r.followers)}</td>
                        <td className={clsx("text-right tabular-nums", (r.er ?? 0) >= 6 ? "font-semibold text-ok" : "text-ink-2")}>{r.er != null ? `${r.er.toFixed(1)}%` : "—"}</td>
                        <td className="text-right tabular-nums text-ink-2">{km(r.avgViews)}</td>
                        <td><RankBadge rank={r.rank} /></td>
                        <td className="whitespace-nowrap text-right tabular-nums text-ink-2">{r.rate ? `₹${(r.rate / 1000).toFixed(r.rate % 1000 ? 1 : 0)}K` : "—"}</td>
                        <td><MatchBar value={m} /></td>
                        <td>
                          <button onClick={() => { setActive(i); setPeek(pk ? null : r.id); }} aria-label={`Quick view ${r.name}`} aria-expanded={pk}
                            className={clsx("grid h-8 w-8 place-items-center rounded-full transition-[opacity,background-color]", pk ? "bg-cobalt text-white" : "text-mute opacity-0 hover:bg-canvas-2 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100")}>
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-canvas/60 px-4 py-2 text-[12px] text-mute">
              <span className="inline-flex items-center gap-1"><Kbd>j</Kbd><Kbd>k</Kbd> move</span>
              <span className="inline-flex items-center gap-1"><Kbd>x</Kbd> select</span>
              <span className="inline-flex items-center gap-1"><Kbd>o</Kbd> quick view</span>
              <span className="inline-flex items-center gap-1"><Kbd>↵</Kbd> open profile</span>
              <span className="inline-flex items-center gap-1"><Kbd>/</Kbd> search</span>
              <span className="ml-auto hidden lg:inline">Hover rows while quick view is open to compare</span>
            </div>
          </div>

          {/* mobile cards */}
          <ul className="space-y-2 md:hidden">
            {list.map(({ r, m }) => <MobileCard key={r.id} r={r} m={m} sel={selected.has(r.id)} onSel={() => toggleSel(r.id)} />)}
          </ul>
        </>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {list.map(({ r, m }) => {
            const sel = selected.has(r.id);
            return (
              <li key={r.id} className={clsx("card card-hover relative overflow-hidden p-3", sel && "border-cobalt ring-2 ring-cobalt/20")}>
                <div className="grid grid-cols-3 gap-1">
                  {[0, 1, 2].map((k) => <MediaTile key={k} hue={(r.hue + k * 31) % 360} type={k === 0 ? "reel" : undefined} className="rounded-[10px]" />)}
                </div>
                <input type="checkbox" checked={sel} onChange={() => toggleSel(r.id)} aria-label={`Select ${r.name}`} className="absolute left-5 top-5 h-4 w-4 accent-[var(--color-cobalt)]" />
                <div className="mt-3 flex items-center gap-2.5">
                  <Avatar name={r.name} hue={r.hue} size={36} />
                  <Link href={`/crm/talent/${r.id}`} className="min-w-0 flex-1 leading-tight">
                    <span className="flex items-center gap-1 truncate text-[14px] font-semibold hover:text-cobalt-700">{r.name}{r.verified && <BadgeCheck className="h-3.5 w-3.5 text-cobalt" />}</span>
                    <span className="block truncate text-[12px] text-mute">{r.city}{r.college ? ` · ${r.college}` : ""}</span>
                  </Link>
                  <span className="rounded-full bg-cobalt-50 px-2 py-0.5 text-[12px] font-bold tabular-nums text-cobalt-700">{m}%</span>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                  {[["Followers", km(r.followers)], ["ER", r.er != null ? `${r.er.toFixed(1)}%` : "—"], ["Rate", r.rate ? `₹${km(r.rate)}` : "—"]].map(([l, v]) => (
                    <div key={l}><dt className="text-[11px] text-mute">{l}</dt><dd className="text-[14px] font-semibold tabular-nums">{v}</dd></div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ul>
      )}

      {/* quick view */}
      <AnimatePresence>
        {peekRow && (
          <motion.aside key="peek" initial={reduce ? { opacity: 0 } : { x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={reduce ? { opacity: 0 } : { x: 24, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }} aria-label={`${peekRow.name} quick view`}
            className="fixed bottom-3 right-3 top-[68px] z-40 hidden w-[380px] flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-lg md:flex">
            <QuickView r={peekRow} brief={brief} onClose={() => setPeek(null)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* bulk bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={clsx("fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-[680px] flex-wrap items-center gap-2 rounded-[14px] bg-night p-2 pl-4 text-white shadow-lg lg:bottom-6 lg:left-[256px]", peekRow && "md:right-[400px]")} role="region" aria-label="Bulk actions">
            <span className="text-[13.5px] font-semibold tabular-nums">{selected.size} selected</span>
            <button onClick={() => setSelected(new Set())} className="text-[12.5px] text-white/60 hover:text-white">Clear</button>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {canManage && briefs.length > 0 && (
                <>
                  <span className="relative">
                    <select value={bulkBrief} onChange={(e) => setBulkBrief(e.target.value)} aria-label="Brief to add to"
                      className="h-9 max-w-[190px] appearance-none truncate rounded-full border border-white/15 bg-white/8 pl-3 pr-8 text-[13px] text-white outline-none focus:border-white/40 [&>option]:text-ink">
                      {briefs.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/60" />
                  </span>
                  <button onClick={addSelected} disabled={pending} className="btn btn-sm bg-white text-night hover:bg-cobalt-50">
                    <Plus className="h-3.5 w-3.5" /> {pending ? "Adding…" : "Add to brief"}
                  </button>
                </>
              )}
              {canExport && <a href={exportHref([...selected])} className="btn btn-sm border border-white/15 text-white hover:bg-white/10"><Download className="h-3.5 w-3.5" /> CSV</a>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="relative inline-flex shrink-0">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={clsx("h-10 max-w-[170px] shrink-0 appearance-none truncate rounded-full border pl-3.5 pr-8 text-[13.5px] font-medium outline-none transition-colors focus:border-cobalt focus:ring-4 focus:ring-cobalt/12",
          value ? "border-cobalt-200 bg-cobalt-50 text-cobalt-700" : "border-line bg-surface text-ink-2 hover:border-line-2")}>
        <option value="">{label}</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown className={clsx("pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2", value ? "text-cobalt" : "text-mute")} />
    </label>
  );
}

function Toggle({ on, onClick, children, small }: { on: boolean; onClick: () => void; children: React.ReactNode; small?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={clsx("inline-flex shrink-0 items-center gap-2 rounded-full border font-medium transition-colors", small ? "h-8 px-3 text-[12.5px]" : "h-10 px-3.5 text-[13.5px]",
        on ? "border-cobalt-200 bg-cobalt-50 text-cobalt-700" : "border-line bg-surface text-ink-2 hover:border-line-2")}>
      <span className={clsx("grid h-4 w-4 place-items-center rounded-[5px] border transition-colors", on ? "border-cobalt bg-cobalt text-white" : "border-line-2 bg-surface")}>
        {on && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      {children}
    </button>
  );
}

export function MatchBar({ value }: { value: number }) {
  const tone = value >= 85 ? "bg-cobalt" : value >= 70 ? "bg-cobalt-300" : "bg-line-2";
  return (
    <span className="flex items-center gap-2" title={`${value}% match`}>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-canvas-2"><span className={clsx("block h-full rounded-full", tone)} style={{ width: `${value}%` }} /></span>
      <span className={clsx("w-8 text-[12.5px] font-semibold tabular-nums", value >= 70 ? "text-ink" : "text-mute")}>{value}%</span>
    </span>
  );
}

function MobileCard({ r, m, sel, onSel }: { r: TalentRow; m: number; sel: boolean; onSel: () => void }) {
  return (
    <li className={clsx("card flex items-center gap-3 p-3", sel && "border-cobalt ring-2 ring-cobalt/15")}>
      <input type="checkbox" checked={sel} onChange={onSel} aria-label={`Select ${r.name}`} className="h-5 w-5 shrink-0 accent-[var(--color-cobalt)]" />
      <Avatar name={r.name} hue={r.hue} size={40} />
      <Link href={`/crm/talent/${r.id}`} className="min-w-0 flex-1 leading-tight">
        <span className="flex items-center gap-1 truncate text-[14.5px] font-semibold">{r.name}{r.verified && <BadgeCheck className="h-3.5 w-3.5 text-cobalt" />}</span>
        <span className="block truncate text-[12.5px] text-mute">{r.city}{r.college ? ` · ${r.college}` : ""}</span>
        <span className="mt-1 flex items-center gap-2 text-[12.5px] tabular-nums text-ink-2">
          <strong className="font-semibold text-ink">{km(r.followers)}</strong> · {r.er?.toFixed(1)}% ER · {r.rate ? `₹${km(r.rate)}` : "—"}
        </span>
      </Link>
      <div className="flex flex-col items-end gap-1.5">
        <span className="rounded-full bg-cobalt-50 px-2 py-0.5 text-[12px] font-bold tabular-nums text-cobalt-700">{m}%</span>
        <RankBadge rank={r.rank} compact />
      </div>
    </li>
  );
}

function QuickView({ r, brief, onClose }: { r: TalentRow; brief: BriefCriteriaVM | null; onClose: () => void }) {
  const miss = brief ? eligible(brief, r) : [];
  const m = matchScore(brief, r);
  const g = r.growth.length > 4 ? ((r.growth.at(-1)! - r.growth.at(-5)!) / r.growth.at(-5)!) * 100 : null;
  return (
    <>
      <div className="flex items-start gap-3 border-b border-line p-4">
        <Avatar name={r.name} hue={r.hue} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 truncate font-display text-[18px] font-semibold tracking-[-0.02em]">{r.name}{r.verified && <BadgeCheck className="h-4 w-4 text-cobalt" />}</div>
          <div className="truncate text-[13px] text-mute">{r.handle ? `@${r.handle}` : "No Instagram"} · {r.city}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <RankBadge rank={r.rank} />
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-2"><span className={clsx("h-2 w-2 rounded-full", AVAIL[r.availability].dot)} />{AVAIL[r.availability].label}</span>
          </div>
        </div>
        <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-mute hover:bg-canvas-2 hover:text-ink" aria-label="Close quick view"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {r.college && <p className="text-[13px] text-ink-2">{r.college}</p>}
        <dl className="grid grid-cols-2 gap-2">
          {[["Followers", km(r.followers)], ["Engagement", r.er != null ? `${r.er.toFixed(2)}%` : "—"], ["Avg views", km(r.avgViews)], ["Rate / post", r.rate ? `₹${r.rate.toLocaleString("en-IN")}` : "—"]].map(([l, v]) => (
            <div key={l} className="rounded-[12px] bg-canvas px-3 py-2.5"><dt className="text-[11.5px] text-mute">{l}</dt><dd className="font-display text-[18px] font-semibold tabular-nums tracking-[-0.02em]">{v}</dd></div>
          ))}
        </dl>
        {r.growth.length > 1 && (
          <div>
            <div className="flex items-baseline justify-between text-[12px] text-mute"><span>Followers · 12 weeks</span>{g != null && <span className="font-semibold tabular-nums text-ok">+{g.toFixed(1)}% / 4w</span>}</div>
            <Sparkline data={r.growth} className="mt-1 h-12" height={48} />
          </div>
        )}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[12px] text-mute"><span>{brief ? `Fit for “${brief.title}”` : "Overall fit"}</span><span className="text-[13px] font-bold tabular-nums text-ink">{m}%</span></div>
          {brief && (
            <ul className="space-y-1 text-[12.5px]">
              {miss.length === 0 ? <li className="flex items-center gap-1.5 text-ok"><Check className="h-3.5 w-3.5" strokeWidth={2.6} /> Meets every brief criterion</li>
                : miss.map((x) => <li key={x} className="flex items-center gap-1.5 text-bad"><X className="h-3.5 w-3.5" strokeWidth={2.6} /> {x}</li>)}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">{r.categories.map((c) => <span key={c} className="chip">{c}</span>)}</div>
        <div className="grid grid-cols-3 gap-1.5">{[0, 1, 2].map((k) => <MediaTile key={k} hue={(r.hue + k * 31) % 360} type={k ? undefined : "reel"} views={r.avgViews ? Math.round(r.avgViews * (1.3 - k * 0.25)) : undefined} className="rounded-[10px]" />)}</div>
      </div>
      <div className="flex gap-2 border-t border-line p-3">
        <Link href={`/crm/talent/${r.id}`} className="btn-primary btn-sm flex-1">Open profile</Link>
        <a href={`https://wa.me/?text=${encodeURIComponent(`Hi ${r.name.split(" ")[0]}! Vigor here — we have a brief that fits you.`)}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm" aria-label={`Message ${r.name} on WhatsApp`}>
          <WhatsAppIcon className="h-4 w-4 text-[#128C4B]" /> WhatsApp
        </a>
      </div>
    </>
  );
}
