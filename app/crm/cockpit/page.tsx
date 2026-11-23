import { clsx } from "clsx";
import { Clock, Info, TriangleAlert, Wallet } from "lucide-react";
import { Avatar, Delta } from "@/components/kit";
import { CountUp } from "@/components/motion/reveal";
import { Columns, GapHeatmap, Legend, StackedColumns, TableView } from "@/components/cockpit/charts";
import { SERIES, fmt } from "@/components/cockpit/format";
import { requireAgency } from "@/lib/session";
import { DEAL_STAGES } from "@/lib/demo/portal";
import { getCockpit } from "./data";

export const metadata = { title: "Founder cockpit" };

const L = (n: number) => `₹${fmt("compact", n)}`;
const pct = (n: number) => `${Math.round(n)}%`;
const ratio = (a: number, b: number) => (b ? a / b : 0);

export default async function Cockpit() {
  const { orgId } = await requireAgency();
  const d = await getCockpit(orgId);
  const { deals: DEALS, payouts: PAYOUTS, sla: SLA, weekly: WEEKLY, supplyDemand: SUPPLY_DEMAND, teamLoad: TEAM_LOAD, revenueMonths: REVENUE_MONTHS, monthlyTarget: MONTHLY_TARGET } = d;

  const open = DEALS.filter((d) => d.stage !== "Won");
  const pipeline = open.reduce((a, d) => a + d.value, 0);
  const weighted = open.reduce((a, d) => a + d.value * d.prob, 0);
  const rows = d.rows.map((r) => {
    const margin = r.budget - r.creator_cost;
    return { ...r, margin, marginPct: ratio(margin, r.budget) * 100 };
  });
  const revenue = rows.reduce((a, r) => a + r.budget, 0);
  const grossMargin = rows.reduce((a, r) => a + r.margin, 0);
  const invoiced = rows.reduce((a, r) => a + r.invoiced, 0);
  const collected = rows.reduce((a, r) => a + r.collected, 0);
  const lateReviews = SLA.reviews.filter((r) => r.waiting_hours > SLA.review_hours);
  const latePayouts = PAYOUTS.filter((p) => p.status === "late");
  const breaches = lateReviews.length + latePayouts.length;
  const maxBudget = Math.max(1, ...rows.map((r) => r.budget));
  const wk = (a: number[]) => Math.round(ratio(a.at(-1)! - a.at(-2)!, a.at(-2)!) * 100);
  const nextMonth = REVENUE_MONTHS[d.forecastFrom + 1] ?? REVENUE_MONTHS.at(-1)!;
  const nextTotal = nextMonth.won + nextMonth.weighted;
  const weekLabel = new Date(d.now).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const kpis = [
    { label: "Open pipeline", value: <CountUp to={pipeline / 1e5} decimals={1} prefix="₹" suffix="L" />, hint: `${L(weighted)} weighted by stage` },
    { label: "Booked revenue", value: <CountUp to={revenue / 1e5} decimals={1} prefix="₹" suffix="L" />, hint: `${rows.length} campaigns with a budget` },
    { label: "Gross margin", value: <CountUp to={ratio(grossMargin, revenue) * 100} decimals={1} suffix="%" />, hint: `${L(grossMargin)} after creator cost` },
    { label: "Collected", value: <CountUp to={collected / 1e5} decimals={1} prefix="₹" suffix="L" />, hint: `${pct(ratio(collected, invoiced) * 100)} of ${L(invoiced)} invoiced` },
    { label: "Payouts due", value: <CountUp to={d.payoutsDueTotal / 1e5} decimals={1} prefix="₹" suffix="L" />, hint: `${latePayouts.length} late, next 7 days` },
    { label: "SLA breaches", value: <CountUp to={breaches} />, hint: `${lateReviews.length} reviews > 24h · ${latePayouts.length} payouts late`, alert: breaches > 0 },
  ];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 text-[13px] font-medium text-mute">{weekLabel}</div>
          <h1 className="text-[24px] leading-tight sm:text-[26px]">Founder cockpit</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-mute">Money, delivery and capacity on one page. Red means someone needs a nudge today.</p>
        </div>
      </div>

      {rows.length === 0 && DEALS.length === 0 && (
        <p className="mb-6 flex items-center gap-2 rounded-[14px] bg-info-bg px-4 py-3 text-[13.5px] text-info" role="status">
          <Info className="h-4 w-4 shrink-0" /> Nothing to chart yet. Set a budget on a campaign (Plan &amp; billing tab) and log brand enquiries to fill this page.
        </p>
      )}

      <section aria-label="Headline numbers" className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line shadow-sm md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface p-5">
            <div className={clsx("flex items-center gap-1.5 text-[12.5px]", k.alert ? "font-semibold text-bad" : "text-mute")}>{k.alert && <TriangleAlert className="h-3.5 w-3.5" />}{k.label}</div>
            <div className={clsx("mt-2 font-display text-[28px] font-bold leading-none tracking-[-0.035em] tabular-nums", k.alert && "text-bad")}>{k.value}</div>
            <div className="mt-2 text-[12px] leading-snug text-mute">{k.hint}</div>
          </div>
        ))}
      </section>

      {/* Revenue & pipeline */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-labelledby="rev" className="card p-6">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="rev" className="text-[16px] font-semibold">Revenue and forecast</h2>
            {MONTHLY_TARGET ? <span className="text-[12.5px] text-mute">Monthly target {L(MONTHLY_TARGET)}</span> : null}
          </div>
          <p className="mb-4 text-[12.5px] text-mute">{nextMonth.m} is {L(nextTotal)} if weighted deals close{MONTHLY_TARGET ? `, ${pct(ratio(nextTotal, MONTHLY_TARGET) * 100)} of target` : ""}.</p>
          <StackedColumns data={REVENUE_MONTHS.map((m) => ({ label: m.m, a: m.won, b: m.weighted }))} series={["Booked", "Weighted pipeline"]} target={MONTHLY_TARGET ?? undefined} targetLabel="Monthly target" forecastFrom={d.forecastFrom} ariaLabel="Monthly booked revenue and weighted pipeline against target" height={240} />
          <TableView columns={["Month", "Booked", "Weighted pipeline"]} rows={REVENUE_MONTHS.map((m) => [m.m, fmt("inr", m.won), fmt("inr", m.weighted)])} />
        </section>

        <section aria-labelledby="pipe" className="card p-6">
          <h2 id="pipe" className="mb-4 text-[16px] font-semibold">Pipeline by stage</h2>
          <ul className="space-y-4">
            {DEAL_STAGES.map((s) => {
              const ds = DEALS.filter((d) => d.stage === s);
              const v = ds.reduce((a, d) => a + d.value, 0);
              return (
                <li key={s}>
                  <div className="flex items-baseline justify-between text-[13px]"><span className="font-medium">{s} <span className="font-normal text-mute">· {ds.length}</span></span><span className="font-semibold tabular-nums">{L(v)}</span></div>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {ds.map((d) => <li key={d.id} className="rounded-full bg-canvas px-2.5 py-1 text-[12px] text-ink-2">{d.company} <span className="tabular-nums text-mute">{L(d.value)}{s !== "Won" ? ` · ${Math.round(d.prob * 100)}%` : ""}</span></li>)}
                  </ul>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Margin by campaign */}
      <section aria-labelledby="margin" className="card mt-6 p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="margin" className="text-[16px] font-semibold">Margin by campaign</h2>
          <Legend items={[{ label: "Creator cost", color: SERIES.a }, { label: "Agency margin", color: SERIES.b }]} />
        </div>
        <ul className="divide-y divide-line">
          {rows.map((r) => {
            const low = r.marginPct < 25;
            return (
              <li key={r.id} className="grid gap-2 py-3 md:grid-cols-[220px_minmax(0,1fr)_120px] md:items-center md:gap-5">
                <div className="min-w-0"><div className="truncate text-[14px] font-medium">{r.name}</div><div className="text-[12px] text-mute">{r.brand_name} · {r.status}</div></div>
                <div className="flex h-4 w-full gap-[2px]" role="img" aria-label={`${r.name}: budget ${fmt("inr", r.budget)}, creator cost ${fmt("inr", r.creator_cost)}, margin ${fmt("inr", r.margin)}`}>
                  <span className="h-full rounded-l-[4px]" style={{ width: `${(r.creator_cost / maxBudget) * 100}%`, background: SERIES.a }} />
                  <span className="h-full rounded-r-[4px]" style={{ width: `${(r.margin / maxBudget) * 100}%`, background: SERIES.b }} />
                  <span className="ml-2 self-center whitespace-nowrap text-[12px] tabular-nums text-mute">{L(r.budget)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 md:justify-end">
                  <span className={clsx("inline-flex items-center gap-1 font-display text-[18px] font-bold tabular-nums", low && "text-bad")}>{low && <TriangleAlert className="h-4 w-4" aria-label="Below 25% floor" />}{r.marginPct.toFixed(1)}%</span>
                </div>
              </li>
            );
          })}
        </ul>
        <TableView columns={["Campaign", "Budget", "Creator cost", "Margin", "Margin %"]} rows={rows.map((r) => [r.name, fmt("inr", r.budget), fmt("inr", r.creator_cost), fmt("inr", r.margin), `${r.marginPct.toFixed(1)}%`])} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Cash */}
        <section aria-labelledby="cash" className="card p-6">
          <h2 id="cash" className="mb-4 flex items-center gap-2 text-[16px] font-semibold"><Wallet className="h-4 w-4" /> Cash</h2>
          <dl className="grid grid-cols-3 gap-4">
            <div><dt className="text-[12.5px] text-mute">Invoiced</dt><dd className="font-display text-[22px] font-bold tabular-nums">{L(invoiced)}</dd></div>
            <div><dt className="text-[12.5px] text-mute">Collected</dt><dd className="font-display text-[22px] font-bold tabular-nums">{L(collected)}</dd></div>
            <div><dt className="text-[12.5px] text-mute">Outstanding</dt><dd className="font-display text-[22px] font-bold tabular-nums">{L(invoiced - collected)}</dd></div>
          </dl>
          <div className="mt-3 flex h-3 gap-[2px]" aria-hidden>
            <span className="rounded-l-[4px]" style={{ width: `${ratio(collected, invoiced) * 100}%`, background: SERIES.a }} />
            <span className="rounded-r-[4px] bg-canvas-2" style={{ width: `${ratio(invoiced - collected, invoiced) * 100}%` }} />
          </div>
          <div className="mt-1.5 text-[12px] tabular-nums text-mute">{pct(ratio(collected, invoiced) * 100)} collected</div>
          <h3 className="mt-6 mb-2 text-[13px] font-semibold text-ink-2">Creator payouts due</h3>
          <ul className="divide-y divide-line text-[13.5px]">
            {PAYOUTS.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1 truncate"><span className="font-medium">{p.creator}</span> <span className="text-mute">· {p.campaign}</span></span>
                <span className="font-semibold tabular-nums">{fmt("inr", p.amount)}</span>
                <span className={clsx("w-24 rounded-full px-2 py-0.5 text-center text-[12px] font-medium tabular-nums", p.status === "late" ? "bg-bad-bg text-bad" : "bg-canvas-2 text-ink-2")}>
                  {p.status === "late" ? `${Math.round((d.now - Date.parse(p.due)) / 864e5)}d late` : `due ${new Date(p.due + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })}`}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* SLA */}
        <section aria-labelledby="sla" className="card p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="sla" className="flex items-center gap-2 text-[16px] font-semibold"><Clock className="h-4 w-4" /> SLA breaches</h2>
            <span className="text-[12.5px] text-mute">Review target 24h</span>
          </div>
          <ul className="space-y-2">
            {[...SLA.reviews].sort((a, b) => b.waiting_hours - a.waiting_hours).map((r) => {
              const late = r.waiting_hours > SLA.review_hours;
              return (
                <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_140px] items-center gap-4 text-[13.5px]">
                  <div className="min-w-0"><div className="truncate"><span className="font-medium">@{r.handle}</span> <span className="text-mute">· {r.campaign}</span></div><div className="text-[12px] text-mute">Owner {r.owner}</div></div>
                  <div>
                    <div className={clsx("mb-1 flex items-center justify-end gap-1 text-[12px] font-semibold tabular-nums", late ? "text-bad" : "text-ink-2")}>{late && <TriangleAlert className="h-3 w-3" />}{r.waiting_hours}h waiting</div>
                    <div className="relative h-1.5 rounded-full bg-canvas-2">
                      <span className={clsx("absolute inset-y-0 left-0 rounded-full", late ? "bg-bad" : "bg-cobalt")} style={{ width: `${Math.min(100, (r.waiting_hours / 48) * 100)}%` }} />
                      <span className="absolute -top-1 -bottom-1 left-1/2 w-[2px] bg-ink" aria-hidden />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {SLA.reviews.length === 0 && <p className="text-[13px] text-mute">No drafts waiting for review.</p>}
          {latePayouts.length > 0 && (
            <div className="mt-5 rounded-[14px] bg-bad-bg px-4 py-3 text-[13px] text-bad">
              <b className="font-semibold">{latePayouts.length} payouts late</b> totalling {fmt("inr", latePayouts.reduce((a, p) => a + p.amount, 0))}. Creators on {[...new Set(latePayouts.map((p) => p.campaign))].join(", ")} are waiting.
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Supply vs demand */}
        <section aria-labelledby="gap" className="card p-6">
          <h2 id="gap" className="text-[16px] font-semibold">Creator supply vs brief demand</h2>
          <p className="mb-4 mt-0.5 text-[12.5px] text-mute">Approved creators per open brief slot. Orange cells are where to recruit next; blue is where to sell.</p>
          <GapHeatmap rows={SUPPLY_DEMAND.cities} cols={SUPPLY_DEMAND.niches} supply={SUPPLY_DEMAND.supply} demand={SUPPLY_DEMAND.demand} />
        </section>

        {/* Team load */}
        <section aria-labelledby="load" className="card p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="load" className="text-[16px] font-semibold">Team load</h2>
            <span className="text-[12.5px] text-mute">Line at 85% capacity</span>
          </div>
          <ul className="space-y-3.5">
            {TEAM_LOAD.map((m) => {
              const over = m.load > 0.85;
              return (
                <li key={m.id} className="grid grid-cols-[minmax(0,190px)_minmax(0,1fr)_48px] items-center gap-3">
                  <div className="flex min-w-0 items-center gap-2"><Avatar name={m.name} hue={m.hue} size={28} /><div className="min-w-0"><div className="truncate text-[13px] font-medium">{m.name}</div><div className="truncate text-[11.5px] text-mute">{m.campaigns} campaigns · {m.tasks} tasks</div></div></div>
                  <div className="relative h-3 rounded-full bg-canvas-2">
                    <span className={clsx("absolute inset-y-0 left-0 rounded-full", over ? "bg-bad" : "bg-cobalt")} style={{ width: `${m.load * 100}%` }} />
                    <span className="absolute -top-1 -bottom-1 w-[2px] bg-ink" style={{ left: "85%" }} aria-hidden />
                  </div>
                  <span className={clsx("flex items-center justify-end gap-0.5 text-[13px] font-semibold tabular-nums", over && "text-bad")}>{over && <TriangleAlert className="h-3 w-3" aria-label="Over capacity" />}{Math.round(m.load * 100)}%</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Weekly growth */}
      <section aria-labelledby="growth" className="card mt-6 p-6">
        <h2 id="growth" className="mb-4 text-[16px] font-semibold">Weekly growth</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {([["Creator signups", WEEKLY.creators, "num"], ["New brands", WEEKLY.brands, "num"], ["Revenue booked", WEEKLY.revenue, "inr"]] as const).map(([label, data, f]) => (
            <div key={label} className="min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] text-mute">{label}</span>
                <span className="flex items-center gap-2"><span className="font-display text-[22px] font-bold tabular-nums">{f === "inr" ? L(data.at(-1)!) : data.at(-1)!.toLocaleString("en-IN")}</span><Delta value={wk([...data])} /></span>
              </div>
              <Columns data={data.map((v, i) => ({ label: WEEKLY.labels[i], value: v }))} format={f} height={140} ariaLabel={`${label} per week, last 8 weeks`} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
