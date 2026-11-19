import Link from "next/link";
import { redirect } from "next/navigation";
import { clsx } from "clsx";
import { Hourglass, Lock, SearchX } from "lucide-react";
import { EmptyState } from "@/components/kit";
import { MatchCard } from "@/components/creator/match-card";
import { BrandTile } from "@/components/creator/bits";
import { getBriefs, getCreator } from "../_lib/data";
import { daysUntil } from "../_lib/score";

const FILTERS = [
  { key: "all", label: "Best match" },
  { key: "closing", label: "Closing soon" },
  { key: "campus", label: "On campus" },
  { key: "event", label: "Events" },
  { key: "applied", label: "Applied" },
] as const;

export default async function Briefs({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const sp = await searchParams;
  const f = FILTERS.some((x) => x.key === sp.f) ? sp.f! : "all";
  const c = await getCreator();
  if (!c) redirect("/onboarding");
  const all = (await getBriefs(c)).filter((b) => b.status === "open");
  const eligible = all.filter((b) => b.eligible);
  const other = all.filter((b) => !b.eligible);
  const list = eligible
    .filter((b) => f === "all" || (f === "closing" ? (daysUntil(b.applyBy) ?? 99) <= 5 : f === "campus" ? b.collegesOnly : f === "event" ? b.talentKind !== "influencer" : !!b.applied))
    .sort((a, b) => (f === "closing" ? (daysUntil(a.applyBy) ?? 99) - (daysUntil(b.applyBy) ?? 99) : b.match - a.match));
  const count = (k: string) => eligible.filter((b) => k === "all" || (k === "closing" ? (daysUntil(b.applyBy) ?? 99) <= 5 : k === "campus" ? b.collegesOnly : k === "event" ? b.talentKind !== "influencer" : !!b.applied)).length;

  if (c.status !== "approved") {
    return (
      <>
        <Header n={0} />
        <EmptyState title="Briefs unlock after approval" body="The Vigor team reviews every new profile, usually within 24 hours. We'll WhatsApp you when you're in." icon={<Hourglass className="h-5 w-5" />} />
      </>
    );
  }

  return (
    <>
      <Header n={eligible.filter((b) => !b.applied).length} />
      <nav aria-label="Filter briefs" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((x) => {
          const on = x.key === f;
          return (
            <Link key={x.key} href={x.key === "all" ? "/dashboard/briefs" : `/dashboard/briefs?f=${x.key}`} aria-current={on ? "page" : undefined}
              className={clsx("inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors",
                on ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2 hover:border-line-2")}>
              {x.label}<span className={clsx("tabular-nums text-[12.5px]", on ? "text-white/60" : "text-faint")}>{count(x.key)}</span>
            </Link>
          );
        })}
      </nav>

      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map((b) => <MatchCard key={b.id} b={b} />)}</div>
      ) : (
        <EmptyState title="Nothing here yet" body="Try another filter — or check back soon, new briefs drop every week." icon={<SearchX className="h-5 w-5" />} action={<Link href="/dashboard/briefs" className="btn-ghost">Show best matches</Link>} />
      )}

      {other.length > 0 && f === "all" && (
        <section className="mt-12" aria-labelledby="other-h">
          <h2 id="other-h" className="font-display text-[18px] font-semibold tracking-[-0.02em]">Not a fit yet</h2>
          <p className="mt-0.5 text-[13.5px] text-mute">Open briefs you don&apos;t qualify for, and why. Update your profile if something&apos;s changed.</p>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
            {other.map((b) => (
              <li key={b.id}>
                <Link href={`/dashboard/briefs/${b.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-canvas/70">
                  <BrandTile name={b.brand} hue={b.hue} size={36} className="opacity-70" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-medium">{b.title}</div>
                    <div className="truncate text-[12.5px] text-mute">{b.checks.filter((x) => !x.ok).map((x) => x.label).join(" · ")}</div>
                  </div>
                  <Lock className="h-4 w-4 shrink-0 text-faint" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Header({ n }: { n: number }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[34px] font-bold leading-tight tracking-[-0.04em] sm:text-[40px]">Briefs</h1>
      <p className="mt-1 text-[15px] text-mute">{n ? `${n} open brief${n === 1 ? "" : "s"} match your profile.` : "Live campaigns from Vigor's brands."}</p>
    </div>
  );
}
