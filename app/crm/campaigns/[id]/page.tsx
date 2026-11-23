import Link from "next/link";
import { notFound } from "next/navigation";
import { clsx } from "clsx";
import { BadgeCheck, Clapperboard, ExternalLink, Plus } from "lucide-react";
import { Avatar, EmptyState, Metric, km } from "@/components/kit";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { ExportButton } from "@/components/crm/export-button";
import { AreaChart, BarList } from "@/components/crm/charts";
import { BrandTile, BurnMeter, DeliverablePill, HealthBadge, LinkTabs } from "@/components/crm/ui";
import { DELIVERABLE_LABEL, daysUntil, dueLabel, lakh, shortDate } from "@/components/crm/format";
import { can, requireAgency } from "@/lib/session";
import type { DeliverableRow } from "@/components/crm/types";
import { isDemo } from "@/lib/demo";
import { Notice } from "@/components/ui";
import { RefreshMetricsButton, ShareShortlistButton } from "@/components/crm/campaign-actions";
import { addDeliverable, setCampaignStatus, updateDeliverable } from "../../actions";
import { crmNow, getCampaignWorkspace, type CampaignWorkspace, getReport, getSubmissions } from "../../_lib/data";
import { MoneyTab } from "./money";

const TABS = ["pipeline", "deliverables", "report", "money"] as const;

export default async function CampaignWorkspace({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; ds?: string; error?: string; saved?: string }> }) {
  const agency = await requireAgency();
  const { id } = await params;
  const sp = await searchParams;
  const tab = TABS.includes(sp.tab as (typeof TABS)[number]) ? (sp.tab as (typeof TABS)[number]) : "pipeline";
  const ws = await getCampaignWorkspace(id, agency.orgId);
  if (!ws) notFound();
  const { campaign: c, cards, deliverables } = ws;
  const now = crmNow();
  const inReview = (await getSubmissions(id, c.brand)).filter((s) => s.status === "draft_submitted").length;
  const toShare = cards.filter((k) => ["shortlisted", "contacted", "negotiating", "confirmed"].includes(k.stage) && !k.sharedWithBrand).length;
  const canPipe = can(agency, "pipeline.manage");
  const total = c.start && c.end ? (new Date(c.end).getTime() - new Date(c.start).getTime()) / 86400000 : null;
  const left = daysUntil(c.end, now);
  const elapsed = total && left != null ? Math.min(1, Math.max(0, (total - left) / total)) : null;
  const base = `/crm/campaigns/${id}`;

  return (
    <div className="space-y-5">
      <Link href="/crm/campaigns" className="inline-flex h-7 items-center text-[13px] font-medium text-mute hover:text-ink">← Campaigns</Link>
      <header className="flex flex-wrap items-start gap-4">
        <BrandTile name={c.brand} hue={c.hue} size={52} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-mute">{c.brand}</div>
          <h1 className="text-[24px] leading-tight sm:text-[26px]">{c.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-mute">
            {c.status === "active" ? <HealthBadge health={c.health} /> : <span className="chip capitalize">{c.status}</span>}
            <span className="tabular-nums">{shortDate(c.start)} → {shortDate(c.end)}{left != null && left >= 0 && c.status !== "completed" ? ` · ${left} days left` : ""}</span>
            {c.owner && <span className="inline-flex items-center gap-1.5">· <Avatar name={c.owner} size={18} hue={12} /> {c.owner}</span>}
            {c.cities.length > 0 && <span>· {c.cities.join(", ")}</span>}
            {c.brandOrgName && <span className="inline-flex items-center gap-1 text-cobalt-700">· <BadgeCheck className="h-3.5 w-3.5" /> {c.brandOrgName} portal</span>}
          </div>
          {c.reason && <p className={clsx("mt-2 max-w-[70ch] text-[13.5px]", c.health === "blocked" ? "text-bad" : "text-ink-2")}>{c.reason}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can(agency, "campaign.manage") && (
            <form action={setCampaignStatus} className="flex items-center gap-1.5">
              <input type="hidden" name="id" value={c.id} />
              <label htmlFor="c-status" className="sr-only">Status</label>
              <select id="c-status" name="status" defaultValue={c.status} className="h-9 rounded-full border border-line bg-surface px-3 text-[13px] capitalize">
                {["planning", "active", "completed", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="btn-quiet btn-sm">Update</button>
            </form>
          )}
          {canPipe && <ShareShortlistButton campaignId={c.id} pending={isDemo() ? 3 : toShare} brand={c.brandOrgName ?? c.brand} linked={isDemo() || !!c.brandOrgId} />}
          <Link href={`${base}/review`} className="btn-ghost btn-sm"><Clapperboard className="h-3.5 w-3.5" /> Review room{inReview > 0 && <span className="rounded-full bg-flame px-1.5 text-[11px] font-bold text-night">{inReview}</span>}</Link>
          {can(agency, "brief.manage") && <Link href={`/crm/briefs/new?campaign=${c.id}`} className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> New brief</Link>}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-baseline justify-between text-[13px]"><span className="font-medium text-mute">Budget burn</span><span className="text-[12px] tabular-nums text-mute">{c.budget ? `${Math.round((c.spent / c.budget) * 100)}%` : ""}</span></div>
          <div className="mt-1.5 font-display text-[24px] font-semibold tabular-nums tracking-[-0.03em]">{lakh(c.spent)}<span className="text-[14px] font-medium text-mute"> / {lakh(c.budget)}</span></div>
          <BurnMeter className="mt-3" spent={c.spent} budget={c.budget} elapsed={c.status === "completed" ? 1 : elapsed} />
        </div>
        <Metric label="Creators confirmed" value={<>{c.confirmed}<span className="text-[15px] font-medium text-mute">{c.target ? ` / ${c.target}` : ""}</span></>} hint={`${cards.length} in pipeline`} />
        <Metric label="Deliverables live" value={<>{c.live}<span className="text-[15px] font-medium text-mute"> / {c.deliverables}</span></>} hint={`${deliverables.filter((d) => d.status === "overdue" || ((daysUntil(d.due, now) ?? 1) < 0 && !["live", "approved"].includes(d.status))).length} past due`} />
        <Metric label={c.reach ? "Reach" : "Views"} value={c.reach ? km(c.reach) : c.views ? km(c.views) : "—"} hint={c.er ? `${c.er}% avg engagement` : "Add live links to track"} />
      </div>

      <LinkTabs active={tab} items={[
        { key: "pipeline", label: "Pipeline", href: base, count: cards.length },
        { key: "deliverables", label: "Deliverables", href: `${base}?tab=deliverables`, count: deliverables.length },
        { key: "review", label: "Review room", href: `${base}/review`, count: inReview || undefined },
        { key: "report", label: "Report", href: `${base}?tab=report` },
        { key: "money", label: "Plan & billing", href: `${base}?tab=money` },
      ]} />

      {sp.error && <Notice kind="error">{sp.error}</Notice>}
      {sp.saved && <Notice kind="ok">Saved.</Notice>}
      {tab === "pipeline" && <PipelineBoard cards={cards} canManage={canPipe} />}
      {tab === "deliverables" && <Deliverables rows={deliverables} now={now} base={base} filter={sp.ds} canManage={canPipe && !isDemo()} bookings={cards.filter((k) => k.stage === "confirmed" || k.stage === "delivered").map((k) => ({ id: k.id, name: k.name, brief: k.brief }))} />}
      {tab === "report" && <Report id={id} ws={ws} canManage={canPipe && !isDemo()} />}
      {tab === "money" && <MoneyTab agency={agency} ws={ws} />}
    </div>
  );
}

function Deliverables({ rows, now, base, filter, canManage, bookings }: { rows: DeliverableRow[]; now: number; base: string; filter?: string; canManage: boolean; bookings: { id: string; name: string; brief: string }[] }) {
  const statuses = ["overdue", "draft_submitted", "changes_requested", "brief_sent", "approved", "live"].filter((s) => rows.some((r) => r.status === s));
  const shown = rows.filter((r) => !filter || r.status === filter).sort((a, b) => (a.due ?? "9").localeCompare(b.due ?? "9"));
  const back = `${base}?tab=deliverables${filter ? `&ds=${filter}` : ""}`;
  if (rows.length === 0) return <EmptyState title="No deliverables yet" body="Deliverables are created when creators are confirmed on a brief." />;
  return (
    <div className="space-y-3">
      {canManage && bookings.length > 0 && (
        <details className="card group p-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[13.5px] font-semibold"><Plus className="h-4 w-4 text-cobalt" /> Add a deliverable to a booking</summary>
          <form action={addDeliverable} className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_1fr_1.4fr_1fr_auto] sm:items-end">
            <input type="hidden" name="back" value={back} />
            <label className="text-[12.5px] font-medium text-ink-2">Creator<select name="intent_id" required className="input mt-1 h-10">{bookings.map((b) => <option key={b.id} value={b.id}>{b.name} · {b.brief}</option>)}</select></label>
            <label className="text-[12.5px] font-medium text-ink-2">Kind<select name="kind" className="input mt-1 h-10">{["Reel", "Story", "Post", "Carousel", "YouTube Short", "Event"].map((k) => <option key={k}>{k}</option>)}</select></label>
            <label className="text-[12.5px] font-medium text-ink-2">What exactly<input name="title" placeholder="e.g. 3 Stories with link sticker" className="input mt-1 h-10" /></label>
            <label className="text-[12.5px] font-medium text-ink-2">Due<input type="date" name="due_date" className="input mt-1 h-10" /></label>
            <button className="btn-primary h-10">Add</button>
          </form>
        </details>
      )}
      <div className="flex flex-wrap gap-1.5">
        <Link href={`${base}?tab=deliverables`} scroll={false} className={clsx("inline-flex h-8 items-center rounded-full px-3 text-[12.5px] font-medium", !filter ? "bg-night text-white" : "text-mute hover:bg-canvas-2")}>All {rows.length}</Link>
        {statuses.map((s) => (
          <Link key={s} href={`${base}?tab=deliverables&ds=${s}`} scroll={false} className={clsx("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium", filter === s ? "bg-night text-white" : "text-mute hover:bg-canvas-2")}>
            {DELIVERABLE_LABEL[s]} <span className="tabular-nums opacity-60">{rows.filter((r) => r.status === s).length}</span>
          </Link>
        ))}
      </div>
      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-[13.5px] [&_td]:border-t [&_td]:border-line [&_td]:px-4 [&_td]:py-2.5 [&_th]:sticky [&_th]:top-0 [&_th]:bg-canvas-2/90 [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-mute">
          <thead><tr><th>Creator</th><th>Kind</th><th>Due</th><th className="!text-right">Version</th><th>Status</th><th className="!text-right">Views</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {shown.map((d) => {
              const late = (daysUntil(d.due, now) ?? 1) < 0 && !["live", "approved"].includes(d.status);
              return (
                <tr key={d.id} className="hover:bg-canvas/60">
                  <td><Link href={`/crm/talent/${d.talentId}`} className="flex items-center gap-2.5"><Avatar name={d.name} hue={d.hue} size={28} /><span className="leading-tight"><span className="block font-semibold hover:text-cobalt-700">{d.name}</span><span className="text-[12px] text-mute">@{d.handle}</span></span></Link></td>
                  <td className="text-ink-2">{d.kind}</td>
                  <td className={clsx("tabular-nums", late ? "font-semibold text-bad" : "text-ink-2")}>{shortDate(d.due)} <span className="text-[12px] font-normal text-mute">· {dueLabel(d.due, now)}</span></td>
                  <td className="text-right tabular-nums text-ink-2">v{d.version}</td>
                  <td><DeliverablePill status={d.status} /></td>
                  <td className="text-right font-semibold tabular-nums">{km(d.views)}</td>
                  <td className="text-right">
                    <span className="inline-flex items-center gap-3">
                      {d.liveUrl && <a href={d.liveUrl} target="_blank" rel="noreferrer" className="text-[12.5px] font-semibold text-ink-2 hover:text-ink">Post</a>}
                      {["draft_submitted", "changes_requested", "approved", "live"].includes(d.status) && <Link href={`${base}/review?d=${d.id}`} className="text-[12.5px] font-semibold text-cobalt hover:text-cobalt-700">Open</Link>}
                      {canManage && <DeliverableEdit d={d} back={back} />}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 md:hidden">
        {shown.map((d) => (
          <li key={d.id} className="card flex items-center gap-3 p-3">
            <Avatar name={d.name} hue={d.hue} size={34} />
            <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-semibold">{d.name}</div><div className="text-[12px] text-mute">{d.kind} v{d.version} · {dueLabel(d.due, now)}</div></div>
            <DeliverablePill status={d.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeliverableEdit({ d, back }: { d: DeliverableRow; back: string }) {
  return (
    <details className="relative inline-block text-left">
      <summary className="cursor-pointer list-none text-[12.5px] font-semibold text-mute hover:text-ink">Edit</summary>
      <form action={updateDeliverable} className="absolute right-0 z-20 mt-2 grid w-72 gap-2.5 rounded-[12px] border border-line bg-surface p-4 shadow-lg">
        <input type="hidden" name="id" value={d.id} />
        <input type="hidden" name="back" value={back} />
        <label className="text-[12px] font-medium text-ink-2">Due date<input type="date" name="due_date" defaultValue={d.due ?? ""} className="input mt-1 h-9" /></label>
        {(d.status === "approved" || d.status === "live") && d.kind !== "Event" && (
          <label className="text-[12px] font-medium text-ink-2">Live post link<input name="live_url" defaultValue={d.liveUrl ?? ""} placeholder="https://instagram.com/reel/…" className="input mt-1 h-9" /></label>
        )}
        {d.status === "live" && (
          <div className="grid grid-cols-3 gap-2">
            <label className="text-[12px] font-medium text-ink-2">Views<input name="views" inputMode="numeric" defaultValue={d.views ?? ""} className="input mt-1 h-9" /></label>
            <label className="text-[12px] font-medium text-ink-2">Likes<input name="likes" inputMode="numeric" defaultValue={d.likes ?? ""} className="input mt-1 h-9" /></label>
            <label className="text-[12px] font-medium text-ink-2">Comments<input name="comments" inputMode="numeric" defaultValue={d.comments ?? ""} className="input mt-1 h-9" /></label>
          </div>
        )}
        {d.kind === "Event" && d.status !== "live" && (
          <label className="flex items-center gap-2 text-[12.5px] text-ink-2"><input type="checkbox" name="mark_done" value="1" /> Shift completed</label>
        )}
        <button className="btn-primary btn-sm">Save</button>
      </form>
    </details>
  );
}

async function Report({ id, ws, canManage }: { id: string; ws: CampaignWorkspace; canManage: boolean }) {
  const { daily, labels: dayKeys, cities } = await getReport(id);
  const c = ws.campaign;
  const top = ws.deliverables.filter((d) => d.views).sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 6);
  const labels = dayKeys ? dayKeys.map((d) => shortDate(d)) : daily.map((_, i) => shortDate(new Date(Date.UTC(2026, 10, 19) - (daily.length - 1 - i) * 86400000).toISOString().slice(0, 10)));
  const cpv = c.views ? c.spent / c.views : null;
  if (!c.views && !daily.length) return (
    <div className="space-y-3">
      {canManage && <div className="flex justify-end"><RefreshMetricsButton campaignId={id} /></div>}
      <EmptyState title="No results yet" body="Reports fill in as creators' live links come in. Views and engagement update when you refresh numbers." />
    </div>
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-mute">Live numbers from creators&apos; posts{canManage ? " · refresh to pull the latest from Instagram" : " · refreshed every 6 hours"}</p>
        <div className="flex gap-2">
          {canManage && <RefreshMetricsButton campaignId={id} />}
          <ExportButton filename={`${c.name.replace(/\W+/g, "-").toLowerCase()}-report.csv`} rows={[["Creator", "Handle", "Kind", "Status", "Views"], ...ws.deliverables.map((d) => [d.name, `@${d.handle}`, d.kind, DELIVERABLE_LABEL[d.status], d.views])]} />
          {c.brandOrgId || isDemo() ? <a href={`/brand/reports/${id}`} className="btn-ghost btn-sm"><ExternalLink className="h-3.5 w-3.5" /> Brand view</a> : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Reach" value={km(c.reach)} />
        <Metric label="Views" value={km(c.views)} />
        <Metric label="Engagement rate" value={c.er ? `${c.er}%` : "—"} />
        <Metric label="Cost per view" value={cpv ? `₹${cpv.toFixed(2)}` : "—"} hint="Spend ÷ views" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-display text-[16px] font-semibold">Daily views</h2>
          <p className="mb-5 text-[12.5px] text-mute">Last 14 days, all deliverables</p>
          {daily.length > 1 ? <AreaChart data={daily} labels={labels} format={(n) => km(n)} label="Daily views" /> : <p className="text-[13px] text-mute">Not enough data yet.</p>}
        </section>
        <section className="card p-5">
          <h2 className="font-display text-[16px] font-semibold">Reach by city</h2>
          <p className="mb-5 text-[12.5px] text-mute">Unique accounts reached</p>
          {cities.length ? <BarList items={cities} format={(n) => km(n)} /> : <p className="text-[13px] text-mute">City split appears with creator insights.</p>}
        </section>
      </div>
      <section className="card p-5">
        <h2 className="mb-4 font-display text-[16px] font-semibold">Top performers</h2>
        {top.length === 0 ? <p className="text-[13px] text-mute">No live deliverables with views yet.</p> : (
          <ol className="grid gap-x-8 gap-y-3 md:grid-cols-2">
            {top.map((d, i) => (
              <li key={d.id} className="flex items-center gap-3">
                <span className="w-5 text-right text-[13px] font-semibold tabular-nums text-faint">{i + 1}</span>
                <Avatar name={d.name} hue={d.hue} size={30} />
                <div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-semibold">{d.name}</div><div className="text-[12px] text-mute">{d.kind} · @{d.handle}</div></div>
                <span className="text-[14px] font-semibold tabular-nums">{km(d.views)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
