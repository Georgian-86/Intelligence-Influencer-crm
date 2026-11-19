import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, CalendarDays, CheckCircle2, FilePlus2, Users } from "lucide-react";
import { Badge } from "@/components/ui";
import { EmptyState, KpiTile, ScreenHeader } from "@/components/crm/primitives";
import { AutoSubmitSelect } from "@/components/crm/auto-submit";
import { fmtDate } from "@/components/crm/format";
import { createClient } from "@/lib/supabase/server";
import { can, requireAgency } from "@/lib/session";
import { setCampaignStatus } from "../../actions";

const ACTIVE = ["shortlisted", "contacted", "negotiating"];
const DONE = ["confirmed", "delivered"];

export default async function Campaign({ params }: { params: Promise<{ id: string }> }) {
  const agency = await requireAgency();
  const { id } = await params;
  const supabase = await createClient();
  const { data: c } = await supabase.from("campaigns").select("*").eq("id", id).eq("org_id", agency.orgId).maybeSingle();
  if (!c) notFound();
  const { data: briefs } = await supabase
    .from("briefs")
    .select("id, title, status, talent_kind, cities, apply_by, intents(stage)")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });

  const rows = (briefs ?? []).map((b) => {
    const st = (b.intents ?? []) as { stage: string }[];
    return {
      ...b,
      interested: st.filter((i) => i.stage === "interested").length,
      active: st.filter((i) => ACTIVE.includes(i.stage)).length,
      confirmed: st.filter((i) => DONE.includes(i.stage)).length,
      total: st.length,
    };
  });
  const sum = (k: "interested" | "active" | "confirmed" | "total") => rows.reduce((s, r) => s + r[k], 0);

  return (
    <>
      <ScreenHeader
        back={{ href: "/crm/campaigns", label: "Campaigns" }}
        eyebrow={<span className="inline-flex items-center gap-2">{c.brand_name ?? "Campaign"} <Badge value={c.status} /></span>}
        title={c.name}
        subtitle={c.start_date ? <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden className="h-3.5 w-3.5" />{fmtDate(c.start_date)} → {c.end_date ? fmtDate(c.end_date) : "…"}</span> : undefined}
        actions={<>
          {can(agency, "campaign.manage") && (
            <form action={setCampaignStatus} className="flex items-center gap-2">
              <input type="hidden" name="id" value={c.id} />
              <label htmlFor="campaign-status" className="text-xs text-mute">Status</label>
              <AutoSubmitSelect id="campaign-status" name="status" defaultValue={c.status} className="input w-36 py-2 text-sm capitalize">
                {["planning", "active", "completed", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
              </AutoSubmitSelect>
              <noscript><button className="btn-ghost">Update</button></noscript>
            </form>
          )}
          {can(agency, "brief.manage") && <Link href={`/crm/briefs/new?campaign=${c.id}`} className="btn-primary"><FilePlus2 aria-hidden className="h-4 w-4" /> New brief</Link>}
        </>}
      />

      {c.description && <p className="-mt-2 mb-6 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-mute">{c.description}</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="Briefs" value={rows.length} icon={<Briefcase className="h-4 w-4" />} hint={`${rows.filter((r) => r.status === "open").length} open`} />
        <KpiTile label="New interest" value={sum("interested")} icon={<Users className="h-4 w-4" />} hint="Waiting for review" />
        <KpiTile label="In progress" value={sum("active")} icon={<Users className="h-4 w-4" />} accent hint="Shortlisted → negotiating" />
        <KpiTile label="Confirmed" value={sum("confirmed")} icon={<CheckCircle2 className="h-4 w-4" />} hint={`of ${sum("total")} in pipeline`} />
      </div>

      {!rows.length ? (
        <EmptyState icon={<Briefcase className="h-5 w-5" />} title="No briefs yet"
          action={can(agency, "brief.manage") ? <Link href={`/crm/briefs/new?campaign=${c.id}`} className="btn-primary">Write the first brief</Link> : undefined}>
          Post a brief to collect interest from matching talent.
        </EmptyState>
      ) : (
        <>
          <div className="card hidden overflow-x-auto md:block">
            <table className="table w-full min-w-[760px]">
              <thead><tr><th>Brief</th><th>Talent</th><th>Cities</th><th className="text-right!">Interested</th><th className="text-right!">In progress</th><th className="text-right!">Confirmed</th><th>Apply by</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td><Link href={`/crm/briefs/${b.id}`} className="font-medium hover:text-brand">{b.title}</Link></td>
                    <td className="capitalize text-mute">{b.talent_kind}</td>
                    <td className="max-w-[200px] truncate text-mute">{b.cities.join(", ") || "Any"}</td>
                    <td className="text-right tabular-nums">{b.interested ? <span className="text-info">{b.interested}</span> : 0}</td>
                    <td className="text-right tabular-nums">{b.active}</td>
                    <td className="text-right tabular-nums">{b.confirmed ? <span className="text-ok">{b.confirmed}</span> : 0}</td>
                    <td className="whitespace-nowrap text-mute">{fmtDate(b.apply_by)}</td>
                    <td><Badge value={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="grid gap-2 md:hidden">
            {rows.map((b) => (
              <li key={b.id}>
                <Link href={`/crm/briefs/${b.id}`} className="card block p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{b.title}</span><Badge value={b.status} />
                  </div>
                  <div className="mt-1 text-xs capitalize text-mute">{b.talent_kind} · {b.cities.join(", ") || "Any city"}</div>
                  <div className="mt-3 flex gap-4 text-xs tabular-nums">
                    <span><span className="text-info">{b.interested}</span> new</span>
                    <span>{b.active} in progress</span>
                    <span><span className="text-ok">{b.confirmed}</span> confirmed</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
