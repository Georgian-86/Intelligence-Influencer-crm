import Link from "next/link";
import { clsx } from "clsx";
import { Building2, CircleCheck, ClipboardPaste, IndianRupee, KanbanSquare, RefreshCw, Users } from "lucide-react";
import { Metric, Progress, km } from "@/components/kit";
import { WhatsAppIcon } from "@/components/brand/icons";
import { NeedsQueue } from "@/components/crm/needs-queue";
import { BrandTile, HealthBadge, SectionTitle } from "@/components/crm/ui";
import { daysUntil, istHour, lakh, longDay } from "@/components/crm/format";
import { getUser, requireAgency } from "@/lib/session";
import { isDemo } from "@/lib/demo";
import { crmNow, getToday } from "./_lib/data";

const ACT_ICON: Record<string, { Icon: (p: { className?: string }) => React.ReactNode; cls: string }> = {
  approve: { Icon: CircleCheck, cls: "bg-ok-bg text-ok" },
  brand: { Icon: Building2, cls: "bg-cobalt-50 text-cobalt" },
  whatsapp: { Icon: WhatsAppIcon, cls: "bg-[#e4f6ea] text-[#128C4B]" },
  pipeline: { Icon: KanbanSquare, cls: "bg-lilac/40 text-[#4b36b8]" },
  system: { Icon: RefreshCw, cls: "bg-canvas-2 text-ink-2" },
  money: { Icon: IndianRupee, cls: "bg-warn-bg text-warn" },
};

const growth = (s: number[]) => (s.length > 4 ? Math.round(((s.at(-1)! - s.at(-5)!) / Math.max(1, s.at(-5)!)) * 100) : null);

export default async function CrmToday() {
  const agency = await requireAgency();
  const user = await getUser();
  const now = crmNow();
  const d = await getToday(agency.orgId);
  const first = isDemo() ? "Kunal" : (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const h = istHour(now);
  const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const blocked = d.campaigns.filter((c) => c.health === "blocked");
  const risky = d.campaigns.filter((c) => c.health === "at_risk");
  const budgetPct = d.kpis.budget ? Math.round((d.kpis.spent / d.kpis.budget) * 100) : null;
  const maxLoad = Math.max(1, ...d.team.map((t) => t.load));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-mute">{longDay(now)}</p>
          <h1 className="mt-1 font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.04em] sm:text-[36px]">
            {greet}, <span className="font-serif text-[1.08em] font-normal italic tracking-[-0.01em]">{first}</span>.
          </h1>
          <p className="mt-2 max-w-[60ch] text-[14.5px] text-ink-2">
            {d.queue.length ? <><strong className="font-semibold text-ink">{d.queue.length} things</strong> need you</> : "Your queue is clear"}
            {blocked.length > 0 && <>, and <Link href={`/crm/campaigns/${blocked[0].id}`} className="font-semibold text-bad underline decoration-bad/30 underline-offset-2 hover:decoration-bad">{blocked[0].name}</Link> is blocked</>}
            {risky.length > 0 && <>; {risky.length} campaign{risky.length > 1 ? "s are" : " is"} at risk</>}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm/talent" className="btn-ghost"><Users className="h-4 w-4" /> Find talent</Link>
          <Link href="/crm/briefs/new" className="btn-primary"><ClipboardPaste className="h-4 w-4" /> Paste a brief</Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label={isDemo() ? "Reach · 30 days" : "Views on live posts"} value={d.kpis.reach != null ? km(d.kpis.reach) : "—"} delta={growth(d.kpis.reachSeries)} spark={d.kpis.reachSeries.length ? d.kpis.reachSeries : undefined} hint={d.kpis.reach == null ? "Add live post links to track views" : d.kpis.reachSeries.length ? "vs. 4 weeks ago" : "All campaigns"} />
        <Metric label="Live deliverables" value={d.kpis.live} delta={growth(d.kpis.liveSeries)} spark={d.kpis.liveSeries.length ? d.kpis.liveSeries : undefined} hint="Across active campaigns" />
        <Metric label="Confirmed creators" value={d.kpis.confirmed} delta={growth(d.kpis.confirmedSeries)} spark={d.kpis.confirmedSeries.length ? d.kpis.confirmedSeries : undefined} hint={`${d.campaigns.reduce((s, c) => s + (c.target ?? 0), 0) || "—"} slots planned`} />
        <Metric label="Spend vs budget" value={lakh(d.kpis.spent)} spark={d.kpis.spendSeries.length ? d.kpis.spendSeries : undefined}
          hint={d.kpis.budget ? <><span className="tabular-nums">{budgetPct}%</span> of {lakh(d.kpis.budget)} committed</> : "Agreed fees on confirmed creators"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          <NeedsQueue items={d.queue} />

          <section aria-labelledby="health-h">
            <SectionTitle action={<Link href="/crm/campaigns" className="text-[13px] font-semibold text-cobalt hover:text-cobalt-700">All campaigns</Link>}>
              <span id="health-h">Campaign health</span>
            </SectionTitle>
            {d.campaigns.length === 0 ? (
              <div className="card p-6 text-[14px] text-mute">No active campaigns. <Link href="/crm/campaigns" className="font-semibold text-cobalt">Create one</Link> to start tracking health.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {d.campaigns.map((c) => {
                  const left = daysUntil(c.end, now);
                  return (
                    <Link key={c.id} href={`/crm/campaigns/${c.id}`} className={clsx("card card-hover group block p-4", c.health === "blocked" && "border-bad/30")}>
                      <div className="flex items-start gap-3">
                        <BrandTile name={c.brand} hue={c.hue} size={36} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-semibold text-ink group-hover:text-cobalt-700">{c.name}</div>
                          <div className="text-[12.5px] text-mute">{c.brand}{left != null && <> · {left >= 0 ? `${left}d left` : "ended"}</>}</div>
                        </div>
                        <HealthBadge health={c.health} />
                      </div>
                      <p className="mt-3 line-clamp-2 min-h-[2.6em] text-[13px] leading-[1.3] text-ink-2">{c.reason}</p>
                      <div className="mt-3 flex items-center justify-between text-[12px] text-mute">
                        <span>Deliverables live</span>
                        <span className="font-semibold tabular-nums text-ink">{c.live}/{c.deliverables || "—"}</span>
                      </div>
                      <Progress value={c.deliverables ? (c.live / c.deliverables) * 100 : 0} className="mt-1.5" tone={c.health === "blocked" ? "bad" : c.health === "at_risk" ? "warn" : "cobalt"} label={`${c.name} deliverables live`} />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-6 lg:col-span-4">
          <section className="card p-5" aria-labelledby="team-h">
            <SectionTitle><span id="team-h">Team load</span></SectionTitle>
            {d.team.length === 0 ? <p className="text-[13px] text-mute">Workload appears once teammates own campaigns.</p> : (
              <ul className="space-y-3.5">
                {d.team.map((t) => {
                  const over = t.load >= 0.85;
                  return (
                    <li key={t.name}>
                      <div className="flex items-baseline justify-between gap-2 text-[13px]">
                        <span className="truncate font-medium text-ink">{t.name} <span className="font-normal text-mute">· {t.role}</span></span>
                        <span className={clsx("shrink-0 font-semibold tabular-nums", over ? "text-flame-700" : "text-ink-2")}>{Math.round(t.load * 100)}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas-2" role="meter" aria-valuenow={Math.round(t.load * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${t.name} load`}>
                        <div className={clsx("h-full rounded-full", over ? "bg-flame" : "bg-cobalt")} style={{ width: `${(t.load / maxLoad) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {d.team.some((t) => t.load >= 0.85) && <p className="mt-4 rounded-[12px] bg-flame-50 px-3 py-2 text-[12.5px] text-flame-700">{d.team.filter((t) => t.load >= 0.85).map((t) => t.name.split(" ")[0]).join(" and ")} are over 85% — reassign before taking new briefs.</p>}
          </section>

          <section className="card p-5" aria-labelledby="act-h">
            <SectionTitle><span id="act-h">Activity</span></SectionTitle>
            {d.activity.length === 0 ? <p className="text-[13px] text-mute">Pipeline moves, approvals and WhatsApp replies show up here.</p> : (
              <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-line">
                {d.activity.map((a, i) => {
                  const k = ACT_ICON[a.kind] ?? ACT_ICON.system;
                  return (
                    <li key={i} className="relative flex gap-3">
                      <span className={clsx("relative z-[1] grid h-7 w-7 shrink-0 place-items-center rounded-full ring-4 ring-surface", k.cls)}><k.Icon className="h-3.5 w-3.5" /></span>
                      <p className="min-w-0 flex-1 pt-0.5 text-[13px] leading-[1.45] text-ink-2">
                        <span className="font-semibold text-ink">{a.who}</span> {a.what} <span className="font-medium text-ink">{a.target}</span>
                        <span className="ml-1.5 text-[12px] tabular-nums text-faint">{a.when}</span>
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
