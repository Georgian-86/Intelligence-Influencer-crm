import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, ChevronRight, GraduationCap } from "lucide-react";
import { Avatar, km } from "@/components/kit";
import type { DemoCreator } from "@/lib/demo/fixtures";

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-mute">
        {items.map((it, i) => (
          <li key={it.name} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
            {it.href ? <Link href={it.href} className="rounded px-0.5 hover:text-ink hover:underline">{it.name}</Link> : <span aria-current="page" className="font-medium text-ink-2">{it.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function StatRow({ stats }: { stats: { value: ReactNode; label: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-surface p-5 sm:p-6">
          <dt className="text-[13px] text-mute">{s.label}</dt>
          <dd className="mt-2 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-none tracking-[-0.04em] text-ink tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CreatorTile({ c }: { c: DemoCreator }) {
  return (
    <li className="rounded-[24px] border border-line bg-surface p-5 shadow-xs">
      <div className="flex items-center gap-3">
        <Avatar name={c.display_name} hue={c.hue} size={44} />
        <div className="min-w-0">
          <div className="flex items-center gap-1 truncate text-[15px] font-semibold text-ink">{c.display_name}{c.verified_insights && <BadgeCheck className="h-4 w-4 shrink-0 text-cobalt" aria-label="Verified insights" />}</div>
          <div className="truncate text-[13px] text-mute">@{c.handle}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {c.categories.slice(0, 2).map((x) => <span key={x} className="chip">{x}</span>)}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-[12px]">
        <div><dt className="text-mute">Followers</dt><dd className="mt-0.5 font-display text-[17px] font-bold text-ink tabular-nums">{km(c.followers)}</dd></div>
        <div><dt className="text-mute">Eng. rate</dt><dd className="mt-0.5 font-display text-[17px] font-bold text-ink tabular-nums">{c.engagement_rate.toFixed(1)}%</dd></div>
        <div><dt className="text-mute">Avg views</dt><dd className="mt-0.5 font-display text-[17px] font-bold text-ink tabular-nums">{km(c.avg_views)}</dd></div>
      </dl>
      {c.college_name && (
        <p className="mt-3 flex items-center gap-1.5 truncate text-[12.5px] text-ink-2"><GraduationCap className="h-3.5 w-3.5 shrink-0 text-cobalt" aria-hidden />{c.college_name}</p>
      )}
    </li>
  );
}

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  return <h2 id={id} className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1] tracking-[-0.04em] text-ink">{children}</h2>;
}
