import Link from "next/link";
import { clsx } from "clsx";
import { Check, ShieldCheck, X } from "lucide-react";
import { Avatar, EmptyState, km } from "@/components/kit";
import { CountUp } from "@/components/motion/reveal";
import { BarList, Columns, TableView } from "@/components/cockpit/charts";
import { ActionNotice, FlagChip } from "@/components/admin/ui";
import { STATUSES, daysAgoLabel, getPlatformOverview, getQueue, type Status } from "@/components/admin/data";
import { requirePlatform } from "@/lib/session";
import { RANKS, RANK_LABEL } from "@/lib/constants";
import { quickReview } from "./actions";

export const metadata = { title: "Screening" };
const DAYS = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string; saved?: string; error?: string; done?: string; demo?: string }> }) {
  await requirePlatform();
  const sp = await searchParams;
  const status = ((STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status : "pending") as Status;
  const kind = sp.kind === "influencer" || sp.kind === "event" ? sp.kind : "";
  const [{ rows, counts }, overview] = await Promise.all([getQueue(status, kind), getPlatformOverview()]);
  const back = `/admin?status=${status}${kind ? `&kind=${kind}` : ""}`;
  const flagged = rows.filter((r) => r.flags.length).length;
  const k = overview.kpis;
  const kpis = [
    { label: "Approved creators", value: k.creators },
    { label: "Campuses", value: k.campuses },
    { label: "Cities", value: k.cities },
    { label: "Brands", value: k.brands },
    { label: "Briefs live", value: k.briefs_live },
  ];
  const week = overview.signups.reduce((a, b) => a + b, 0);
  const funnelTop = overview.funnel[0]?.value || 1;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.035em] sm:text-[36px]">Screening</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-mute">Approve new creators within 24 hours of signup. Flagged profiles are sorted to the top.</p>
        </div>
        <div className="rounded-[16px] bg-night px-5 py-3 text-white">
          <div className="text-[12px] text-white/70">Waiting for review</div>
          <div className="font-display text-[28px] font-bold leading-none tabular-nums"><CountUp to={k.pending} /></div>
        </div>
      </div>

      <ActionNotice sp={sp} />

      <section aria-label="Platform totals" className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line shadow-sm sm:grid-cols-5">
        {kpis.map((m) => (
          <div key={m.label} className="bg-surface px-5 py-4">
            <div className="text-[12.5px] text-mute">{m.label}</div>
            <div className="mt-1 font-display text-[26px] font-bold leading-none tracking-[-0.03em] tabular-nums">{m.value == null ? "—" : <CountUp to={m.value} />}</div>
          </div>
        ))}
      </section>

      <section aria-labelledby="queue" className="card overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 id="queue" className="text-[16px] font-semibold">Queue</h2>
            <p className="text-[12.5px] text-mute">{rows.length} {status} · {flagged} with auto-flags</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <nav className="inline-flex rounded-full border border-line bg-canvas-2/70 p-1" aria-label="Status">
              {STATUSES.map((s) => (
                <Link key={s} href={`/admin?status=${s}${kind ? `&kind=${kind}` : ""}`} aria-current={s === status ? "page" : undefined}
                  className={clsx("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium capitalize transition-colors", s === status ? "bg-surface text-ink shadow-sm" : "text-mute hover:text-ink")}>
                  {s}<span className="tabular-nums text-faint">{counts[s]}</span>
                </Link>
              ))}
            </nav>
            <nav className="inline-flex rounded-full border border-line bg-canvas-2/70 p-1" aria-label="Talent type">
              {[["", "All"], ["influencer", "Influencers"], ["event", "Event"]].map(([v, l]) => (
                <Link key={v} href={`/admin?status=${status}${v ? `&kind=${v}` : ""}`} aria-current={kind === v ? "page" : undefined}
                  className={clsx("inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium", kind === v ? "bg-surface text-ink shadow-sm" : "text-mute hover:text-ink")}>{l}</Link>
              ))}
            </nav>
          </div>
        </header>

        {!rows.length ? (
          <div className="p-6"><EmptyState icon={<ShieldCheck className="h-5 w-5" />} title={`No ${status} creators`} body="New signups land here automatically. You're caught up." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="grid gap-3 px-5 py-4 transition-colors hover:bg-cobalt-50/40 lg:grid-cols-[minmax(0,1.3fr)_150px_minmax(0,1fr)_auto] lg:items-center lg:gap-5">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={r.name} hue={r.hue} size={40} />
                  <div className="min-w-0">
                    <Link href={`/admin/talent/${r.id}`} className="block truncate font-semibold hover:text-cobalt">{r.name}</Link>
                    <div className="truncate text-[12.5px] text-mute">{r.handle ? `@${r.handle}` : "No Instagram"} · {[r.city, r.college].filter(Boolean).join(" · ")}</div>
                    <div className="text-[12px] text-faint">{r.kinds.join(" + ")} · signed up {daysAgoLabel(r.created_at).toLowerCase()}</div>
                  </div>
                </div>
                <dl className="flex gap-5 text-[13px] lg:block lg:space-y-0.5">
                  <div className="flex gap-1.5"><dt className="text-mute">Followers</dt><dd className="font-semibold tabular-nums">{km(r.followers)}</dd></div>
                  <div className="flex gap-1.5"><dt className="text-mute">ER</dt><dd className={clsx("font-semibold tabular-nums", r.flags.some((f) => f.key === "fake") && "text-bad")}>{r.er != null ? `${r.er}%` : "—"}</dd></div>
                </dl>
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {r.flags.length ? r.flags.map((f) => <FlagChip key={f.key} flag={f} />) : <span className="inline-flex items-center gap-1 text-[12.5px] text-ok"><Check className="h-3.5 w-3.5" /> No flags</span>}
                </div>
                <form action={quickReview} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="name" value={r.name} />
                  <input type="hidden" name="back" value={back} />
                  <label className="sr-only" htmlFor={`rank-${r.id}`}>Rank for {r.name}</label>
                  <select id={`rank-${r.id}`} name="rank" defaultValue={r.rank} className="h-9 rounded-full border border-line bg-surface px-3 text-[13px] font-medium text-ink-2 outline-none hover:border-line-2 focus:border-cobalt">
                    {RANKS.map((x) => <option key={x} value={x}>{RANK_LABEL[x]}</option>)}
                  </select>
                  <button name="status" value="rejected" className="btn-danger btn-sm w-9 px-0" aria-label={`Reject ${r.name}`} title="Reject"><X className="h-4 w-4" /></button>
                  <button name="status" value="approved" className="btn-primary btn-sm" aria-label={`Approve ${r.name}`}><Check className="h-4 w-4" strokeWidth={2.6} /> Approve</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="signups" className="card p-6">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 id="signups" className="text-[16px] font-semibold">Signups, last 7 days</h2>
            <span className="text-[13px] text-mute"><b className="font-semibold text-ink tabular-nums">{week.toLocaleString("en-IN")}</b> this week</span>
          </div>
          <Columns data={overview.signups.map((v, i) => ({ label: DAYS[i], value: v }))} ariaLabel="Creator signups per day, last 7 days" height={200} />
          <TableView columns={["Day", "Signups"]} rows={overview.signups.map((v, i) => [DAYS[i], v])} />
        </section>
        <section aria-labelledby="funnel" className="card p-6">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 id="funnel" className="text-[16px] font-semibold">Signup funnel, last 30 days</h2>
            <span className="text-[13px] text-mute"><b className="font-semibold text-ink tabular-nums">{Math.round(((overview.funnel.at(-1)?.value ?? 0) / funnelTop) * 100)}%</b> end to end</span>
          </div>
          <BarList format="num" labelWidth={148} ariaLabel="Signup funnel" total={funnelTop}
            data={overview.funnel.map((f, i) => ({ label: f.label, value: f.value, note: i ? `${Math.round((f.value / (overview.funnel[i - 1].value || 1)) * 100)}% of previous step` : undefined }))} />
          <ul className="mt-4 grid grid-cols-2 gap-2 text-[12.5px] text-mute sm:grid-cols-4">
            {overview.funnel.slice(1).map((f, i) => (
              <li key={f.label} className="rounded-[12px] bg-canvas px-3 py-2"><b className="block font-display text-[16px] text-ink tabular-nums">{Math.round((f.value / (overview.funnel[i].value || 1)) * 100)}%</b>to {f.label.toLowerCase()}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
