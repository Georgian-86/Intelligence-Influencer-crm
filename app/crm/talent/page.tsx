import Link from "next/link";
import { Download, MapPin, SearchX } from "lucide-react";
import { Badge, fmtNum } from "@/components/ui";
import { Avatar, EmptyState, ScreenHeader, TagList } from "@/components/crm/primitives";
import { ActiveFilters, POOL_FORM_ID, TalentFilters } from "@/components/crm/talent-filters";
import { AutoSubmitSelect } from "@/components/crm/auto-submit";
import { fmtEr } from "@/components/crm/format";
import { searchPool, type PoolFilters } from "@/lib/pool";
import { followerTier } from "@/lib/constants";
import { can, requireAgency } from "@/lib/session";

const kindLabel = (r: { is_influencer: boolean; is_event_talent: boolean }) =>
  [r.is_influencer && "Influencer", r.is_event_talent && "Event"].filter(Boolean).join(" · ");

export default async function TalentPool({ searchParams }: { searchParams: Promise<PoolFilters> }) {
  const agency = await requireAgency();
  const f = await searchParams;
  const rows = await searchPool(f);
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <ScreenHeader
        eyebrow="Workspace"
        title="Talent pool"
        subtitle={<><span className="tabular-nums text-fog">{rows.length.toLocaleString("en-IN")}</span> approved talent match{rows.length === 500 ? " (showing first 500)" : ""}</>}
        actions={can(agency, "export") ? (
          <a href={`/crm/talent/export${qs ? `?${qs}` : ""}`} className="btn-ghost"><Download aria-hidden className="h-4 w-4" /> Export CSV</a>
        ) : null}
      />

      <div className="grid gap-6 lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside aria-label="Filters"><TalentFilters f={f} /></aside>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ActiveFilters f={f} />
            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="pool-sort" className="text-xs text-mute">Sort</label>
              <AutoSubmitSelect id="pool-sort" name="sort" form={POOL_FORM_ID} defaultValue={f.sort ?? "newest"} className="input w-40 py-1.5 text-sm">
                <option value="newest">Newest</option>
                <option value="followers">Followers</option>
                <option value="engagement">Engagement</option>
                <option value="rating">Rating</option>
              </AutoSubmitSelect>
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState icon={<SearchX className="h-5 w-5" />} title="No talent matches these filters"
              action={<Link href="/crm/talent" className="btn-ghost">Clear filters</Link>}>
              Try widening the follower range or removing the city.
            </EmptyState>
          ) : (
            <>
              {/* Desktop table */}
              <div className="card hidden overflow-x-auto md:block">
                <table className="table w-full min-w-[860px]">
                  <thead>
                    <tr><th>Talent</th><th>City</th><th>Type</th><th className="text-right!">Followers</th><th className="text-right!">Eng.</th><th>Rank</th><th>Categories</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <Link href={`/crm/talent/${r.id}`} className="group flex items-center gap-3">
                            <Avatar src={r.ig?.profile_pic_url} name={r.display_name} size="sm" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium group-hover:text-brand">{r.display_name}</span>
                              <span className="block truncate text-xs text-mute">{r.ig ? `@${r.ig.handle}` : "No Instagram"}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="whitespace-nowrap">{r.city ?? "—"}</td>
                        <td className="whitespace-nowrap text-xs text-mute">{kindLabel(r)}</td>
                        <td className="text-right tabular-nums">
                          <div>{fmtNum(r.ig?.followers)}</div>
                          {followerTier(r.ig?.followers) && <div className="text-[11px] capitalize text-mute">{followerTier(r.ig?.followers)!.key}</div>}
                        </td>
                        <td className="text-right tabular-nums">{fmtEr(r.ig?.engagement_rate)}</td>
                        <td><Badge value={r.rank} /></td>
                        <td className="max-w-[240px]"><TagList items={r.categories} max={2} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="grid gap-2 md:hidden">
                {rows.map((r) => (
                  <li key={r.id}>
                    <Link href={`/crm/talent/${r.id}`} className="card flex items-center gap-3 p-3 active:bg-ink-3">
                      <Avatar src={r.ig?.profile_pic_url} name={r.display_name} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{r.display_name}</span>
                          <Badge value={r.rank} />
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-mute">
                          {r.ig ? `@${r.ig.handle}` : kindLabel(r)}
                          {r.city && <><span aria-hidden>·</span><MapPin aria-hidden className="h-3 w-3" />{r.city}</>}
                        </div>
                      </div>
                      <div className="text-right text-xs tabular-nums">
                        <div className="text-sm font-semibold">{fmtNum(r.ig?.followers)}</div>
                        <div className="text-mute">{fmtEr(r.ig?.engagement_rate)} ER</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}
