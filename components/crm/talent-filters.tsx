import Link from "next/link";
import { clsx } from "clsx";
import { SlidersHorizontal, X } from "lucide-react";
import type { PoolFilters } from "@/lib/pool";
import { CITIES, EVENT_CATEGORIES, FOLLOWER_TIERS, INFLUENCER_NICHES, RANKS } from "@/lib/constants";
import { fmtNum } from "@/components/ui";
import { MobileDisclosure } from "@/components/crm/disclosure";

export const POOL_FORM_ID = "pool-filters";

const KINDS = [
  { v: "", l: "All" },
  { v: "influencer", l: "Influencers" },
  { v: "event", l: "Event talent" },
];

const RANK_TONE: Record<string, string> = {
  bronze: "peer-checked:border-bronze/60 peer-checked:bg-bronze/10 peer-checked:text-bronze",
  silver: "peer-checked:border-silver/50 peer-checked:bg-silver/10 peer-checked:text-silver",
  gold: "peer-checked:border-gold/60 peer-checked:bg-gold/10 peer-checked:text-gold",
  platinum: "peer-checked:border-platinum/60 peer-checked:bg-platinum/10 peer-checked:text-platinum",
};

function qs(f: PoolFilters, patch: Partial<PoolFilters>) {
  const merged = { ...f, ...patch } as Record<string, string | undefined>;
  const p = new URLSearchParams(Object.entries(merged).filter(([, v]) => v) as [string, string][]);
  const s = p.toString();
  return s ? `/crm/talent?${s}` : "/crm/talent";
}

/** Active filters as removable chips (links). */
export function activeFilterChips(f: PoolFilters) {
  const chips: { key: string; label: string; href: string }[] = [];
  if (f.q) chips.push({ key: "q", label: `“${f.q}”`, href: qs(f, { q: undefined }) });
  if (f.kind) chips.push({ key: "kind", label: f.kind === "event" ? "Event talent" : "Influencers", href: qs(f, { kind: undefined }) });
  if (f.city) chips.push({ key: "city", label: f.city, href: qs(f, { city: undefined }) });
  if (f.category) chips.push({ key: "category", label: f.category, href: qs(f, { category: undefined }) });
  if (f.rank) chips.push({ key: "rank", label: `${f.rank[0].toUpperCase()}${f.rank.slice(1)} rank`, href: qs(f, { rank: undefined }) });
  if (f.min_followers || f.max_followers) {
    const label = `${f.min_followers ? fmtNum(Number(f.min_followers)) : "0"}–${f.max_followers ? fmtNum(Number(f.max_followers)) : "∞"} followers`;
    chips.push({ key: "followers", label, href: qs(f, { min_followers: undefined, max_followers: undefined }) });
  }
  if (f.min_er) chips.push({ key: "er", label: `≥ ${f.min_er}% ER`, href: qs(f, { min_er: undefined }) });
  return chips;
}

export function ActiveFilters({ f }: { f: PoolFilters }) {
  const chips = activeFilterChips(f);
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <Link key={c.key} href={c.href} className="inline-flex min-h-8 items-center gap-1 rounded-full border border-brand/40 bg-brand/10 pl-3 pr-2 text-xs font-medium text-brand hover:bg-brand/20">
          {c.label} <X aria-label="Remove filter" className="h-3.5 w-3.5" />
        </Link>
      ))}
      <Link href="/crm/talent" className="min-h-8 px-2 text-xs leading-8 text-mute hover:text-fog">Clear all</Link>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-mute">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Talent pool filter panel. Plain GET form so it works without JS and URLs are shareable. */
export function TalentFilters({ f }: { f: PoolFilters }) {
  const active = activeFilterChips(f).length;
  const body = (
    <div className="space-y-5">
      <div>
        <label htmlFor="pool-q" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-mute">Search</label>
        <input id="pool-q" name="q" defaultValue={f.q} placeholder="Name or @handle" className="input py-2 text-sm" />
      </div>

      <Group title="Type">
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-ink p-1">
          {KINDS.map((k) => (
            <label key={k.v} className="relative">
              <input type="radio" name="kind" value={k.v} defaultChecked={(f.kind ?? "") === k.v} className="peer sr-only" />
              <span className="flex min-h-9 items-center justify-center rounded-lg px-1 text-center text-xs font-medium text-mute transition-colors peer-checked:bg-ink-3 peer-checked:text-fog peer-focus-visible:ring-2 peer-focus-visible:ring-brand">
                {k.l}
              </span>
            </label>
          ))}
        </div>
      </Group>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <label htmlFor="pool-city" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-mute">City</label>
          <select id="pool-city" name="city" defaultValue={f.city ?? ""} className="input py-2 text-sm">
            <option value="">All cities</option>{CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pool-cat" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-mute">Category</label>
          <select id="pool-cat" name="category" defaultValue={f.category ?? ""} className="input py-2 text-sm">
            <option value="">All categories</option>
            <optgroup label="Influencer niches">{INFLUENCER_NICHES.map((c) => <option key={c}>{c}</option>)}</optgroup>
            <optgroup label="Event talent">{EVENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</optgroup>
          </select>
        </div>
      </div>

      <Group title="Rank">
        <div className="flex flex-wrap gap-1.5">
          <label>
            <input type="radio" name="rank" value="" defaultChecked={!f.rank} className="peer sr-only" />
            <span className="chip min-h-8 px-3 text-mute peer-checked:border-fog/40 peer-checked:text-fog peer-focus-visible:ring-2 peer-focus-visible:ring-brand">Any</span>
          </label>
          {RANKS.map((r) => (
            <label key={r}>
              <input type="radio" name="rank" value={r} defaultChecked={f.rank === r} className="peer sr-only" />
              <span className={clsx("chip min-h-8 px-3 capitalize text-mute peer-focus-visible:ring-2 peer-focus-visible:ring-brand", RANK_TONE[r])}>{r}</span>
            </label>
          ))}
        </div>
      </Group>

      <Group title="Followers">
        <div className="flex flex-wrap gap-1.5">
          {FOLLOWER_TIERS.map((t) => {
            const on = f.min_followers === String(t.min) && (f.max_followers ?? "") === (t.max ? String(t.max) : "");
            return (
              <Link key={t.key} href={qs(f, { min_followers: String(t.min), max_followers: t.max ? String(t.max) : undefined })}
                aria-current={on ? "true" : undefined}
                className={clsx("chip min-h-8 px-3 capitalize", on ? "border-brand/50 bg-brand/10 text-brand" : "text-mute hover:text-fog")}>
                {t.key}
              </Link>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block"><span className="sr-only">Minimum followers</span>
            <input name="min_followers" defaultValue={f.min_followers} inputMode="numeric" placeholder="Min" className="input py-2 text-sm" /></label>
          <label className="block"><span className="sr-only">Maximum followers</span>
            <input name="max_followers" defaultValue={f.max_followers} inputMode="numeric" placeholder="Max" className="input py-2 text-sm" /></label>
        </div>
      </Group>

      <div>
        <label htmlFor="pool-er" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-mute">Min engagement %</label>
        <input id="pool-er" name="min_er" defaultValue={f.min_er} inputMode="decimal" placeholder="e.g. 2.5" className="input py-2 text-sm" />
      </div>

      <div className="flex gap-2 pt-1">
        <button className="btn-primary flex-1">Apply filters</button>
        <Link href="/crm/talent" className="btn-ghost">Reset</Link>
      </div>
    </div>
  );

  return (
    <form id={POOL_FORM_ID} action="/crm/talent" className="lg:sticky lg:top-20">
      {/* The sort <select> lives in the results toolbar and joins this form via form="pool-filters". */}
      <MobileDisclosure
        className="card"
        summary={<><SlidersHorizontal aria-hidden className="h-4 w-4 text-mute" /> Filters</>}
        badge={active > 0 ? <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs text-brand">{active} active</span> : null}
      >
        <div className="p-4">
          <div className="mb-4 hidden items-center gap-2 text-sm font-semibold lg:flex"><SlidersHorizontal aria-hidden className="h-4 w-4 text-mute" /> Filters</div>
          {body}
        </div>
      </MobileDisclosure>
    </form>
  );
}
