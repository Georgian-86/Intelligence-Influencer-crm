import Link from "next/link";
import { ArrowRight, Briefcase, CalendarCheck2, Inbox, Plus, Search, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui";
import { EmptyState, KpiTile, Panel, ScreenHeader } from "@/components/crm/primitives";
import { STAGE_DOT, STAGE_LABEL } from "@/components/crm/stages";
import { fmtDate, timeAgo } from "@/components/crm/format";
import { createClient } from "@/lib/supabase/server";
import { can, requireAgency } from "@/lib/session";
import type { Stage } from "@/lib/constants";

type Activity = {
  id: string; from: string | null; to: string; at: string;
  talent: { id: string; display_name: string } | null; brief: { id: string; title: string } | null;
};

export default async function CrmHome() {
  const agency = await requireAgency();
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [pool, openBriefs, newIntents, inPipeline, confirmedMonth, confirmed, enquiries, events, recent, briefList, enquiryList] = await Promise.all([
    supabase.from("talent_profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("briefs").select("id", { count: "exact", head: true }).eq("org_id", agency.orgId).eq("status", "open"),
    supabase.from("intents").select("id", { count: "exact", head: true }).eq("org_id", agency.orgId).eq("stage", "interested"),
    supabase.from("intents").select("id", { count: "exact", head: true }).eq("org_id", agency.orgId).in("stage", ["shortlisted", "contacted", "negotiating"]),
    supabase.from("intents").select("id", { count: "exact", head: true }).eq("org_id", agency.orgId).in("stage", ["confirmed", "delivered"]).gte("updated_at", monthStart.toISOString()),
    supabase.from("intents").select("id", { count: "exact", head: true }).eq("org_id", agency.orgId).in("stage", ["confirmed", "delivered"]),
    supabase.from("brand_enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("pipeline_events")
      .select("id, from_stage, to_stage, created_at, intents(talent_profiles(id, display_name), briefs(id, title))")
      .eq("org_id", agency.orgId).order("created_at", { ascending: false }).limit(12),
    supabase.from("intents")
      .select("id, stage, created_at, updated_at, talent_profiles(id, display_name, city), briefs(id, title)")
      .eq("org_id", agency.orgId).order("updated_at", { ascending: false }).limit(10),
    supabase.from("briefs")
      .select("id, title, apply_by, talent_kind, campaigns(name), intents(stage)")
      .eq("org_id", agency.orgId).eq("status", "open").order("created_at", { ascending: false }).limit(6),
    can(agency, "enquiry.view")
      ? supabase.from("brand_enquiries").select("id, company, contact_name, city, status, created_at").order("created_at", { ascending: false }).limit(4)
      : Promise.resolve({ data: [] as { id: string; company: string; contact_name: string; city: string | null; status: string; created_at: string }[] }),
  ]);

  // Prefer the stage-change log; fall back to latest intents if the log is empty/unavailable.
  let activity: Activity[] = (events.data ?? []).map((e) => {
    const i = e.intents as unknown as { talent_profiles: Activity["talent"]; briefs: Activity["brief"] } | null;
    return { id: `e${e.id}`, from: e.from_stage, to: e.to_stage, at: e.created_at, talent: i?.talent_profiles ?? null, brief: i?.briefs ?? null };
  });
  if (!activity.length) {
    activity = (recent.data ?? []).map((i) => ({
      id: i.id, from: null, to: i.stage, at: i.updated_at ?? i.created_at,
      talent: i.talent_profiles as unknown as Activity["talent"], brief: i.briefs as unknown as Activity["brief"],
    }));
  }

  const briefs = (briefList.data ?? []) as unknown as {
    id: string; title: string; apply_by: string | null; talent_kind: string; campaigns: { name: string } | null; intents: { stage: string }[];
  }[];
  const monthName = monthStart.toLocaleDateString("en-IN", { month: "long" });

  return (
    <>
      <ScreenHeader
        eyebrow="Overview"
        title={agency.orgName}
        subtitle={<>{(pool.count ?? 0).toLocaleString("en-IN")} approved talent in the network</>}
        actions={<>
          <Link href="/crm/talent" className="btn-ghost"><Search aria-hidden className="h-4 w-4" /> Search pool</Link>
          {can(agency, "campaign.manage") && <Link href="/crm/campaigns#new" className="btn-primary"><Plus aria-hidden className="h-4 w-4" /> New campaign</Link>}
        </>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="Open briefs" value={openBriefs.count ?? 0} icon={<Briefcase className="h-4 w-4" />} href="/crm/campaigns" hint="Visible to matching talent" />
        <KpiTile label="Talent in pipeline" value={inPipeline.count ?? 0} icon={<Users className="h-4 w-4" />} accent
          hint={<><span className="text-brand">{newIntents.count ?? 0} new</span> waiting for review</>} />
        <KpiTile label={`Confirmed · ${monthName}`} value={confirmedMonth.count ?? 0} icon={<CalendarCheck2 className="h-4 w-4" />}
          hint={`${confirmed.count ?? 0} confirmed all time`} />
        <KpiTile label="New enquiries" value={enquiries.count ?? 0} icon={<Inbox className="h-4 w-4" />}
          href={can(agency, "enquiry.view") ? "/crm/enquiries" : undefined} hint="From the For brands page" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Recent activity" icon={<Sparkles className="h-4 w-4" />} bodyClassName="p-0 sm:p-0">
          {!activity.length ? (
            <div className="p-5"><EmptyState title="No activity yet">Publish a brief to start collecting interest from matching talent.</EmptyState></div>
          ) : (
            <ol className="divide-y divide-line">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                  <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STAGE_DOT[a.to as Stage] ?? "bg-mute"}`} />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="leading-snug">
                      {a.talent ? <Link href={`/crm/talent/${a.talent.id}`} className="font-medium hover:text-brand">{a.talent.display_name}</Link> : <span className="text-mute">Talent</span>}
                      <span className="text-mute">
                        {a.from ? <> moved from {STAGE_LABEL[a.from as Stage] ?? a.from} to </> : a.to === "interested" ? " showed interest in " : " added as "}
                      </span>
                      {(a.from || a.to !== "interested") && <span className="font-medium">{STAGE_LABEL[a.to as Stage] ?? a.to}</span>}
                      {a.brief && <><span className="text-mute">{a.from || a.to !== "interested" ? " on " : ""}</span><Link href={`/crm/briefs/${a.brief.id}`} className="hover:text-brand">{a.brief.title}</Link></>}
                    </p>
                  </div>
                  <time dateTime={a.at} className="shrink-0 text-xs tabular-nums text-mute">{timeAgo(a.at)}</time>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Open briefs" icon={<Briefcase className="h-4 w-4" />} bodyClassName="p-0 sm:p-0"
            actions={<Link href="/crm/campaigns" className="text-xs text-mute hover:text-fog">All campaigns</Link>}>
            {!briefs.length ? (
              <p className="p-5 text-sm text-mute">No open briefs. Create one from a campaign.</p>
            ) : (
              <ul className="divide-y divide-line">
                {briefs.map((b) => {
                  const st = b.intents ?? [];
                  const fresh = st.filter((i) => i.stage === "interested").length;
                  return (
                    <li key={b.id}>
                      <Link href={`/crm/briefs/${b.id}`} className="group flex items-center gap-3 px-4 py-3 hover:bg-ink-3/40 sm:px-5">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium group-hover:text-brand">{b.title}</div>
                          <div className="truncate text-xs text-mute">{b.campaigns?.name}{b.apply_by ? ` · apply by ${fmtDate(b.apply_by)}` : ""}</div>
                        </div>
                        <div className="text-right text-xs tabular-nums">
                          <div>{st.length} <span className="text-mute">in pipeline</span></div>
                          {fresh > 0 && <div className="text-info">{fresh} new</div>}
                        </div>
                        <ArrowRight aria-hidden className="h-4 w-4 text-mute" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {can(agency, "enquiry.view") && (
            <Panel title="Latest enquiries" icon={<Inbox className="h-4 w-4" />} bodyClassName="p-0 sm:p-0"
              actions={<Link href="/crm/enquiries" className="text-xs text-mute hover:text-fog">View all</Link>}>
              {!enquiryList.data?.length ? <p className="p-5 text-sm text-mute">No enquiries yet.</p> : (
                <ul className="divide-y divide-line">
                  {enquiryList.data.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 px-4 py-3 text-sm sm:px-5">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{e.company}</div>
                        <div className="truncate text-xs text-mute">{e.contact_name}{e.city ? ` · ${e.city}` : ""} · {timeAgo(e.created_at)}</div>
                      </div>
                      <Badge value={e.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
