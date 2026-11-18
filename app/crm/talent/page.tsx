import Link from "next/link";
import { Badge, Empty, PageHeader, fmtNum, imgSrc } from "@/components/ui";
import { searchPool, type PoolFilters } from "@/lib/pool";
import { CITIES, EVENT_CATEGORIES, INFLUENCER_NICHES, RANKS } from "@/lib/constants";
import { can, requireAgency } from "@/lib/session";

export default async function TalentPool({ searchParams }: { searchParams: Promise<PoolFilters> }) {
  const agency = await requireAgency();
  const f = await searchParams;
  const rows = await searchPool(f);
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <PageHeader title="Talent pool" subtitle={`${rows.length} approved talent match`}
        actions={can(agency, "export") ? <a href={`/crm/talent/export?${qs}`} className="btn-ghost">Export CSV</a> : null} />
      <form className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input name="q" defaultValue={f.q} placeholder="Name or @handle" className="input lg:col-span-2" />
        <select name="kind" defaultValue={f.kind ?? ""} className="input">
          <option value="">All talent</option><option value="influencer">Influencers</option><option value="event">Event talent</option>
        </select>
        <select name="city" defaultValue={f.city ?? ""} className="input">
          <option value="">All cities</option>{CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select name="category" defaultValue={f.category ?? ""} className="input">
          <option value="">All categories</option>
          <optgroup label="Influencer niches">{INFLUENCER_NICHES.map((c) => <option key={c}>{c}</option>)}</optgroup>
          <optgroup label="Event talent">{EVENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</optgroup>
        </select>
        <input name="min_followers" defaultValue={f.min_followers} inputMode="numeric" placeholder="Min followers" className="input" />
        <input name="max_followers" defaultValue={f.max_followers} inputMode="numeric" placeholder="Max followers" className="input" />
        <input name="min_er" defaultValue={f.min_er} inputMode="decimal" placeholder="Min engagement %" className="input" />
        <select name="rank" defaultValue={f.rank ?? ""} className="input">
          <option value="">Any rank</option>{RANKS.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
        <div className="flex gap-2">
          <select name="sort" defaultValue={f.sort ?? "newest"} className="input">
            <option value="newest">Newest</option><option value="followers">Followers</option>
            <option value="engagement">Engagement</option><option value="rating">Rating</option>
          </select>
          <button className="btn-primary">Filter</button>
        </div>
      </form>

      {rows.length === 0 ? (
        <Empty title="No talent matches these filters"><Link href="/crm/talent" className="text-brand">Clear filters</Link></Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table w-full min-w-[820px]">
            <thead><tr><th>Talent</th><th>City</th><th>Type</th><th>Instagram</th><th>Followers</th><th>Eng.</th><th>Rank</th><th>Categories</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-ink-3/50">
                  <td>
                    <Link href={`/crm/talent/${r.id}`} className="flex items-center gap-2 font-medium hover:text-brand">
                      {r.ig?.profile_pic_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={imgSrc(r.ig.profile_pic_url)} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover" />
                        : <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-3 text-xs text-mute">{r.display_name[0]}</span>}
                      {r.display_name}
                    </Link>
                  </td>
                  <td>{r.city ?? "—"}</td>
                  <td className="text-xs text-mute">{[r.is_influencer && "Influencer", r.is_event_talent && "Event"].filter(Boolean).join(" · ")}</td>
                  <td className="text-mute">{r.ig ? `@${r.ig.handle}` : "—"}</td>
                  <td className="tabular-nums">{fmtNum(r.ig?.followers)}</td>
                  <td className="tabular-nums">{r.ig?.engagement_rate != null ? `${r.ig.engagement_rate}%` : "—"}</td>
                  <td><Badge value={r.rank} /></td>
                  <td className="max-w-[220px] text-xs text-mute">{r.categories.slice(0, 3).join(", ")}{r.categories.length > 3 ? "…" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
