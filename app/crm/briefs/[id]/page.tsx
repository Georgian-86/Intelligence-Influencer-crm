import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { Avatar, km } from "@/components/kit";
import { BroadcastPanel } from "@/components/crm/broadcast-panel";
import { MatchBar } from "@/components/crm/talent-explorer";
import { PageHeader, RankBadge, StagePill } from "@/components/crm/ui";
import { STAGE_LABEL, shortDate } from "@/components/crm/format";
import { eligible, matchScore } from "@/components/crm/match-score";
import { can, requireAgency } from "@/lib/session";
import { WA_COST_PER_CONVERSATION } from "@/lib/demo/crm";
import { inviteTalent, setBriefStatus } from "../../actions";
import { getBriefDetail, listTalent } from "../../_lib/data";

const FUNNEL = ["interested", "shortlisted", "contacted", "negotiating", "confirmed", "delivered"] as const;

export default async function BriefDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const agency = await requireAgency();
  const { id } = await params;
  const sp = await searchParams;
  const [d, pool] = await Promise.all([getBriefDetail(id, agency.orgId), listTalent()]);
  if (!d) notFound();
  const b = d.brief;
  const inPipe = new Map(d.cards.map((c) => [c.talentId, c]));
  const matched = pool.filter((t) => eligible(b, t).length === 0).map((t) => ({ t, m: matchScore(b, t), card: inPipe.get(t.id) })).sort((x, y) => y.m - x.m);
  const fresh = matched.filter((x) => !x.card);
  const manage = can(agency, "pipeline.manage");
  const budget = b.budget_min || b.budget_max ? `₹${(b.budget_min ?? 0).toLocaleString("en-IN")}–${(b.budget_max ?? 0).toLocaleString("en-IN")}` : "Budget on request";
  const criteria = [
    b.talent_kind === "any" ? "Anyone" : b.talent_kind === "event" ? "Event talent" : "Influencers",
    b.cities.length ? b.cities.join(", ") : "All cities",
    b.colleges_only && "College students",
    b.categories.length ? b.categories.join(", ") : null,
    (b.min_followers || b.max_followers) && `${km(b.min_followers)}–${km(b.max_followers)} followers`,
    b.min_engagement && `ER ${b.min_engagement}%+`,
  ].filter(Boolean) as string[];

  return (
    <>
      <PageHeader
        back={d.campaign ? { href: `/crm/campaigns/${d.campaign.id}`, label: d.campaign.name } : { href: "/crm/briefs", label: "Briefs" }}
        title={b.title}
        subtitle={<>{b.brand} · {b.deliverables ?? "Deliverables TBC"} · {budget}{b.apply_by && <> · apply by {shortDate(b.apply_by)}</>}</>}
        meta={<><span className={`chip capitalize ${b.status === "open" ? "border-ok/30 bg-ok-bg text-ok" : ""}`}>{b.status}</span>{criteria.map((c) => <span key={c} className="chip">{c}</span>)}</>}
        actions={can(agency, "brief.manage") && (
          <form action={setBriefStatus}>
            <input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value={b.status === "open" ? "closed" : "open"} />
            <button className={b.status === "open" ? "btn-ghost" : "btn-primary"}>{b.status === "open" ? "Close brief" : "Publish brief"}</button>
          </form>
        )}
      />
      {sp.created && <p className="mb-5 flex items-center gap-2 rounded-[14px] bg-ok-bg px-4 py-3 text-[13.5px] font-medium text-ok"><CircleCheck className="h-4 w-4" /> Brief published. {matched.length} matching creators can see it now.</p>}

      <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {FUNNEL.map((s) => (
          <div key={s} className="card px-3 py-2.5">
            <div className="text-[11.5px] text-mute">{STAGE_LABEL[s]}</div>
            <div className="font-display text-[22px] font-semibold tabular-nums">{d.cards.filter((c) => c.stage === s).length}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <form action={inviteTalent} className="card overflow-hidden lg:col-span-8">
          <input type="hidden" name="brief_id" value={b.id} /><input type="hidden" name="back" value={`/crm/briefs/${b.id}`} />
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <div>
              <h2 className="font-display text-[16px] font-semibold">Matched creators <span className="ml-1 font-sans text-[13px] font-semibold tabular-nums text-mute">{matched.length}</span></h2>
              <p className="text-[12.5px] text-mute">Meet every criterion · {fresh.length} not in the pipeline yet</p>
            </div>
            {manage && fresh.length > 0 && <button className="btn-primary btn-sm">Shortlist selected</button>}
          </header>
          {matched.length === 0 ? <p className="p-5 text-[13.5px] text-mute">Nobody meets every criterion yet. Widen the cities or follower range.</p> : (
            <div className="max-h-[620px] overflow-auto">
              <table className="w-full min-w-[640px] text-[13.5px] [&_td]:border-t [&_td]:border-line [&_td]:px-4 [&_td]:py-2.5 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-canvas-2/95 [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-mute">
                <thead><tr><th className="w-10"><span className="sr-only">Select</span></th><th>Creator</th><th className="!text-right">Followers</th><th className="!text-right">ER</th><th>Rank</th><th>Match</th><th>Pipeline</th></tr></thead>
                <tbody>
                  {matched.map(({ t, m, card }) => (
                    <tr key={t.id} className="hover:bg-canvas/60">
                      <td>{manage && !card && <input type="checkbox" name="talent_id" value={t.id} aria-label={`Select ${t.name}`} className="h-4 w-4 accent-[var(--color-cobalt)]" />}</td>
                      <td><Link href={`/crm/talent/${t.id}`} className="flex items-center gap-2.5"><Avatar name={t.name} hue={t.hue} size={28} /><span className="min-w-0 leading-tight"><span className="block font-semibold hover:text-cobalt-700">{t.name}</span><span className="block max-w-[220px] truncate text-[12px] text-mute">{t.city}{t.college ? ` · ${t.college}` : ""}</span></span></Link></td>
                      <td className="text-right font-semibold tabular-nums">{km(t.followers)}</td>
                      <td className="text-right tabular-nums text-ink-2">{t.er?.toFixed(1)}%</td>
                      <td><RankBadge rank={t.rank} /></td>
                      <td><MatchBar value={card?.match ?? m} /></td>
                      <td>{card ? <StagePill stage={card.stage} /> : <span className="text-[12px] text-faint">Not invited</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </form>

        <aside className="min-w-0 space-y-6 lg:col-span-4">
          <BroadcastPanel briefId={b.id} brand={b.brand} title={b.title} deliverables={b.deliverables ?? ""} budget={budget} applyBy={b.apply_by ? shortDate(b.apply_by) : "soon"} costPer={WA_COST_PER_CONVERSATION}
            audiences={[
              { key: "fresh", label: "Matched, not yet contacted", ids: fresh.map((x) => x.t.id) },
              { key: "all", label: "All matched creators", ids: matched.map((x) => x.t.id) },
              { key: "short", label: "Shortlisted only", ids: d.cards.filter((c) => c.stage === "shortlisted").map((c) => c.talentId) },
            ]} />
          {b.description && (
            <section className="card p-5">
              <h2 className="mb-2 font-display text-[16px] font-semibold">What creators see</h2>
              <p className="text-[13.5px] leading-[1.55] text-ink-2">{b.description}</p>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
