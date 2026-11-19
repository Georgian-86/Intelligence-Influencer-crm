import Link from "next/link";
import { ArrowLeft, ChartColumnBig, Eye, Bookmark } from "lucide-react";
import { EmptyState, MediaTile, km } from "@/components/kit";
import { CountUp } from "@/components/motion/reveal";
import { AreaLine, BarList, Bullet, TableView } from "@/components/cockpit/charts";
import { fmt } from "@/components/cockpit/format";
import { PageTitle, shortDate } from "@/components/brand-portal/parts";
import { DownloadPdf } from "@/components/brand-portal/download-pdf";
import { requireBrand } from "@/lib/brand-access";
import { getPortalCampaign, REPORTS } from "@/lib/demo/portal";

export const metadata = { title: "Campaign report" };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const brand = await requireBrand();
  const { id } = await params;
  const c = brand.demo ? getPortalCampaign(id) : undefined;
  const r = brand.demo ? REPORTS[id] : undefined;
  const back = <Link href="/brand" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-mute hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Overview</Link>;

  if (!c || !r) {
    return (
      <>
        {back}
        <PageTitle title="Campaign report" />
        <EmptyState icon={<ChartColumnBig className="h-5 w-5" />} title="Your report starts when content goes live"
          body="Reach, views and engagement update every few hours from Instagram once the first post is up."
          action={<Link href="/brand" className="btn-ghost">Back to overview</Link>} />
      </>
    );
  }

  const days = r.days.map((d) => ({ label: shortDate(d.date), value: d.views }));
  const kpis = [
    { label: "Reach", value: <CountUp to={c.reach / 1e6} decimals={2} suffix="M" />, sub: `${Math.round((c.reach / c.targets.reach) * 100)}% of ${km(c.targets.reach)} target` },
    { label: "Views", value: <CountUp to={c.views / 1e6} decimals={1} suffix="M" />, sub: `${Math.round((c.views / c.targets.views) * 100)}% of ${km(c.targets.views)} target` },
    { label: "Engagement rate", value: <CountUp to={c.er} decimals={1} suffix="%" />, sub: `Target ${c.targets.er}% · category avg 3.9%` },
    { label: "Content live", value: <><CountUp to={c.deliverables_live} /><span className="text-[20px] text-faint"> / {c.deliverables_total}</span></>, sub: `${c.creators_confirmed} creators across ${c.colleges} campuses` },
  ];

  return (
    <>
      {back}
      <PageTitle
        eyebrow={<span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ok" aria-hidden /> Live report · updated 12 min ago</span>}
        title={c.name}
        subtitle={`${shortDate(c.start_date)} – ${shortDate(c.end_date)} · ${c.cities.join(", ")}`}
        actions={<DownloadPdf email={brand.email} />}
      />

      <section aria-label="Headline results" className="grid gap-px overflow-hidden rounded-[20px] border border-line bg-line shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface p-5 sm:p-6">
            <div className="text-[13px] text-mute">{k.label}</div>
            <div className="mt-2 font-display text-[40px] font-bold leading-none tracking-[-0.04em] tabular-nums">{k.value}</div>
            <div className="mt-2 text-[12.5px] text-mute">{k.sub}</div>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="daily" className="card p-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="daily" className="text-[16px] font-semibold">Daily views</h2>
            <span className="text-[12.5px] text-mute">Peak on fest weekend, as planned</span>
          </div>
          <AreaLine format="km" data={days} ariaLabel="Daily views over the last 12 days" height={260} />
          <TableView columns={["Day", "Views"]} rows={days.map((d) => [d.label, fmt("num", d.value)])} />
        </section>

        <section aria-labelledby="eff" className="card p-6">
          <h2 id="eff" className="text-[16px] font-semibold">Cost efficiency</h2>
          <p className="mt-0.5 text-[12.5px] text-mute">Against the youth-QSR benchmark for Instagram in India</p>
          <div className="mt-5 space-y-6">
            <div>
              <div className="mb-2 flex items-baseline justify-between"><span className="text-[13px] text-ink-2">Cost per 1,000 views (CPM)</span><span className="font-display text-[24px] font-bold tabular-nums">₹{r.cpm}</span></div>
              <Bullet label="CPM" value={r.cpm} target={r.cpm_bench} lowerIsBetter format="inr" targetLabel="Benchmark" />
            </div>
            <div>
              <div className="mb-2 flex items-baseline justify-between"><span className="text-[13px] text-ink-2">Cost per engagement (CPE)</span><span className="font-display text-[24px] font-bold tabular-nums">₹{r.cpe.toFixed(2)}</span></div>
              <Bullet label="CPE" value={r.cpe} target={r.cpe_bench} lowerIsBetter format="inr2" targetLabel="Benchmark" max={5} />
            </div>
            <dl className="grid grid-cols-2 gap-4 border-t border-line pt-5">
              <div><dt className="text-[12.5px] text-mute">Link clicks</dt><dd className="font-display text-[22px] font-bold tabular-nums">{km(r.clicks)}</dd></div>
              <div><dt className="text-[12.5px] text-mute">CAMPUS30 redemptions</dt><dd className="font-display text-[22px] font-bold tabular-nums">{r.code_redemptions.toLocaleString("en-IN")}</dd></div>
            </dl>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="city" className="card p-6">
          <h2 id="city" className="mb-4 text-[16px] font-semibold">Reach by city</h2>
          <BarList format="km" data={r.by_city} ariaLabel="Reach by city" labelWidth={84} />
          <p className="mt-5 rounded-[14px] bg-canvas px-4 py-3 text-[13px] text-ink-2"><b className="font-semibold text-ink tabular-nums">{Math.round(((r.by_city[0].value + r.by_city[1].value + r.by_city[2].value) / c.reach) * 100)}%</b> of reach landed in your three target cities. Mumbai alone is {Math.round((r.by_city[0].value / c.reach) * 100)}%.</p>
          <TableView columns={["City", "Reach"]} rows={r.by_city.map((d) => [d.label, fmt("num", d.value)])} />
        </section>
        <section aria-labelledby="campus" className="card p-6">
          <h2 id="campus" className="mb-4 text-[16px] font-semibold">Reach by campus <span className="font-normal text-mute">· top 7 of {c.colleges}</span></h2>
          <BarList format="km" data={r.by_campus} ariaLabel="Reach by campus, top 7" labelWidth={84} total={c.reach} />
          <TableView columns={["Campus", "Reach"]} rows={r.by_campus.map((d) => [d.label, fmt("num", d.value)])} />
        </section>
      </div>

      <section aria-labelledby="top" className="mt-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="top" className="text-[18px] font-semibold">Top content</h2>
          <span className="text-[12.5px] text-mute">Ranked by views</span>
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {r.top.map((t, i) => (
            <li key={t.id} className="min-w-0">
              <div className="relative">
                <MediaTile hue={t.hue} type={t.kind === "Reel" ? "reel" : "post"} />
                <span className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-surface text-[12px] font-bold tabular-nums text-ink shadow-sm">{i + 1}</span>
              </div>
              <div className="mt-2 truncate text-[13px] font-medium">@{t.handle}</div>
              <div className="mt-0.5 flex flex-wrap gap-x-2 text-[12px] tabular-nums text-mute">
                <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{km(t.views)}</span>
                <span>{t.er}% ER</span>
                <span className="inline-flex items-center gap-1"><Bookmark className="h-3 w-3" />{km(t.saves)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
