import Link from "next/link";
import { Plus, Rocket } from "lucide-react";
import { EmptyState, Progress, Segmented, km } from "@/components/kit";
import { BrandTile, BurnMeter, HealthBadge, PageHeader } from "@/components/crm/ui";
import { daysUntil, lakh, shortDate } from "@/components/crm/format";
import { can, requireAgency } from "@/lib/session";
import { createCampaign } from "../actions";
import { crmNow, listCampaigns } from "../_lib/data";

const STATUSES = ["all", "active", "planning", "completed"] as const;

export default async function Campaigns({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const agency = await requireAgency();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number]) ? sp.status! : "all";
  const all = await listCampaigns(agency.orgId);
  const now = crmNow();
  const list = all.filter((c) => status === "all" || c.status === status);
  const count = (s: string) => (s === "all" ? all.length : all.filter((c) => c.status === s).length);

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle={`${count("active")} active · ${lakh(all.reduce((s, c) => s + (c.budget ?? 0), 0) || null)} under management`}
        actions={can(agency, "campaign.manage") && (
          <details className="group relative">
            <summary className="btn-primary list-none [&::-webkit-details-marker]:hidden"><Plus className="h-4 w-4" /> New campaign</summary>
            <form action={createCampaign} className="panel absolute right-0 top-12 z-30 w-[min(92vw,380px)] space-y-3 p-5">
              <h2 className="font-display text-[17px] font-semibold">New campaign</h2>
              {sp.error && <p className="rounded-[10px] bg-bad-bg px-3 py-2 text-[13px] text-bad">{sp.error}</p>}
              <div><label className="label" htmlFor="c-name">Campaign name</label><input id="c-name" name="name" required className="input" placeholder="Domino's Campus Fest 2026" /></div>
              <div><label className="label" htmlFor="c-brand">Brand</label><input id="c-brand" name="brand_name" className="input" placeholder="Domino's" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label" htmlFor="c-s">Start</label><input id="c-s" type="date" name="start_date" className="input" /></div>
                <div><label className="label" htmlFor="c-e">End</label><input id="c-e" type="date" name="end_date" className="input" /></div>
              </div>
              <button className="btn-primary w-full">Create campaign</button>
            </form>
          </details>
        )}
      />
      <div className="mb-5">
        <Segmented active={`/crm/campaigns${status === "all" ? "" : `?status=${status}`}`} items={STATUSES.map((s) => ({ href: `/crm/campaigns${s === "all" ? "" : `?status=${s}`}`, label: s[0].toUpperCase() + s.slice(1), count: count(s) }))} />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Rocket className="h-5 w-5" />} title={status === "all" ? "No campaigns yet" : `No ${status} campaigns`} body="A campaign groups a brand's briefs, creators, deliverables and report in one workspace." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const total = c.start && c.end ? (new Date(c.end).getTime() - new Date(c.start).getTime()) / 86400000 : null;
            const left = daysUntil(c.end, now);
            const elapsed = total && left != null ? Math.min(1, Math.max(0, (total - left) / total)) : null;
            const burn = c.budget ? Math.round((c.spent / c.budget) * 100) : null;
            return (
              <li key={c.id}>
                <Link href={`/crm/campaigns/${c.id}`} className="card card-hover group flex h-full flex-col p-5">
                  <div className="flex items-start gap-3">
                    <BrandTile name={c.brand} hue={c.hue} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-medium text-mute">{c.brand}</div>
                      <div className="font-display text-[17px] font-semibold leading-tight tracking-[-0.02em] group-hover:text-cobalt-700">{c.name}</div>
                    </div>
                    {c.status === "completed" ? <span className="chip">Completed</span> : c.status === "planning" ? <span className="chip border-cobalt-200 bg-cobalt-50 text-cobalt-700">Planning</span> : <HealthBadge health={c.health} />}
                  </div>
                  <div className="mt-3 text-[12.5px] tabular-nums text-mute">
                    {shortDate(c.start)} → {shortDate(c.end)}
                    {left != null && c.status !== "completed" && <> · <span className={left < 7 ? "font-semibold text-flame-700" : ""}>{left >= 0 ? `${left} days left` : "ended"}</span></>}
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-[2.7em] text-[13px] leading-[1.35] text-ink-2">{c.reason}</p>

                  <div className="mt-4 space-y-3.5 border-t border-line pt-4">
                    <div>
                      <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
                        <span className="text-mute">Budget burn</span>
                        <span className="tabular-nums"><strong className="font-semibold text-ink">{lakh(c.spent)}</strong><span className="text-mute"> / {lakh(c.budget)}{burn != null && ` · ${burn}%`}</span></span>
                      </div>
                      <BurnMeter spent={c.spent} budget={c.budget} elapsed={c.status === "completed" ? 1 : elapsed} />
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
                        <span className="text-mute">Deliverables live</span>
                        <span className="font-semibold tabular-nums">{c.live}<span className="font-normal text-mute"> / {c.deliverables}</span></span>
                      </div>
                      <Progress value={c.deliverables ? (c.live / c.deliverables) * 100 : 0} tone={c.status === "completed" ? "ok" : "cobalt"} label="Deliverables live" />
                    </div>
                  </div>
                  <dl className="mt-auto grid grid-cols-3 gap-2 pt-4 text-[12px]">
                    <div><dt className="text-mute">Creators</dt><dd className="mt-0.5 text-[14px] font-semibold tabular-nums">{c.confirmed}{c.target ? <span className="font-normal text-mute">/{c.target}</span> : null}</dd></div>
                    <div><dt className="text-mute">Reach</dt><dd className="mt-0.5 text-[14px] font-semibold tabular-nums">{c.reach ? km(c.reach) : "—"}</dd></div>
                    <div><dt className="text-mute">Owner</dt><dd className="mt-0.5 truncate text-[14px] font-semibold">{c.owner?.split(" ")[0] ?? "—"}</dd></div>
                  </dl>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-[12px] text-mute">The dark tick on each budget bar marks time elapsed — spend running ahead of it turns flame.</p>
    </>
  );
}
