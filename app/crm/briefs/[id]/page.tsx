import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, FileText, IndianRupee, MapPin, Sparkles, Target, UserPlus, Users } from "lucide-react";
import { Badge, fmtINR, fmtNum } from "@/components/ui";
import { Avatar, Panel, ScreenHeader } from "@/components/crm/primitives";
import { PipelineBoard, type PipelineIntent } from "@/components/crm/pipeline-board";
import { fmtDate, fmtEr } from "@/components/crm/format";
import { createClient } from "@/lib/supabase/server";
import { can, requireAgency } from "@/lib/session";
import { searchPool } from "@/lib/pool";
import { mismatches } from "@/lib/match";
import { inviteTalent, setBriefStatus } from "../../actions";

type IntentRow = {
  id: string; stage: string; source: string; message: string | null; quoted_rate: number | null; agreed_rate: number | null; created_at: string; updated_at: string | null;
  talent_profiles: {
    id: string; display_name: string; city: string | null; rank: string;
    social_accounts: { handle: string; followers: number | null; engagement_rate: number | null; profile_pic_url: string | null }[];
  } | null;
};

function Crit({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink-2 px-2.5 py-1 text-xs">
      <span aria-hidden className="text-mute">{icon}</span>{children}
    </span>
  );
}

export default async function BriefPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string }> }) {
  const agency = await requireAgency();
  const { id } = await params;
  const sp = await searchParams;
  const view = sp.view === "table" ? "table" : "board";
  const supabase = await createClient();
  const { data: b } = await supabase.from("briefs").select("*, campaigns(id, name)").eq("id", id).eq("org_id", agency.orgId).maybeSingle();
  if (!b) notFound();
  const { data } = await supabase
    .from("intents")
    .select("id, stage, source, message, quoted_rate, agreed_rate, created_at, updated_at, talent_profiles(id, display_name, city, rank, social_accounts(handle, followers, engagement_rate, profile_pic_url))")
    .eq("brief_id", id)
    .order("created_at", { ascending: true });
  const intents = (data ?? []) as unknown as IntentRow[];
  const inPipeline = new Set(intents.map((i) => i.talent_profiles?.id));
  const manage = can(agency, "pipeline.manage");
  const baseHref = `/crm/briefs/${id}`;
  const back = view === "table" ? `${baseHref}?view=table` : baseHref;

  const pool = manage ? await searchPool({ kind: b.talent_kind === "any" ? undefined : b.talent_kind, sort: "engagement" }, 2000) : [];
  const suggestions = pool
    .filter((t) => !inPipeline.has(t.id))
    .filter((t) => mismatches(b, { ...t, followers: t.ig?.followers, engagement_rate: t.ig?.engagement_rate }).length === 0)
    .slice(0, 25);
  const campaign = b.campaigns as unknown as { id: string; name: string } | null;

  const board: PipelineIntent[] = intents.map((i) => {
    const t = i.talent_profiles;
    const ig = t?.social_accounts?.[0];
    return {
      id: i.id, stage: i.stage, source: i.source, message: i.message, quoted_rate: i.quoted_rate, agreed_rate: i.agreed_rate,
      created_at: i.created_at, updated_at: i.updated_at,
      talent: t ? {
        id: t.id, display_name: t.display_name, city: t.city, rank: t.rank,
        handle: ig?.handle ?? null, followers: ig?.followers ?? null, engagement_rate: ig?.engagement_rate ?? null, pic: ig?.profile_pic_url ?? null,
      } : null,
    };
  });

  return (
    <div className="space-y-6">
      <ScreenHeader
        back={{ href: `/crm/campaigns/${campaign?.id}`, label: campaign?.name ?? "Campaign" }}
        eyebrow={<span className="inline-flex items-center gap-2">{b.brand_display || "Confidential brand"} <Badge value={b.status} /></span>}
        title={b.title}
        actions={can(agency, "brief.manage") ? (
          <>
            {b.status !== "open" && <form action={setBriefStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="open" /><button className="btn-primary">Publish</button></form>}
            {b.status === "open" && <form action={setBriefStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="closed" /><button className="btn-ghost">Close brief</button></form>}
          </>
        ) : null}
      />

      <div className="-mt-3 flex flex-wrap gap-2">
        <Crit icon={<Users className="h-3.5 w-3.5" />}><span className="capitalize">{b.talent_kind === "any" ? "Anyone" : b.talent_kind}</span></Crit>
        <Crit icon={<MapPin className="h-3.5 w-3.5" />}>{b.cities.join(", ") || "All cities"}</Crit>
        {(b.min_followers || b.max_followers) && <Crit icon={<Target className="h-3.5 w-3.5" />}>{fmtNum(b.min_followers ?? 0)}–{b.max_followers ? fmtNum(b.max_followers) : "∞"} followers</Crit>}
        {b.min_engagement && <Crit icon={<Sparkles className="h-3.5 w-3.5" />}>≥ {b.min_engagement}% ER</Crit>}
        {b.ranks?.length > 0 && <Crit icon={<Target className="h-3.5 w-3.5" />}><span className="capitalize">{b.ranks.join(", ")}</span></Crit>}
        {(b.budget_min || b.budget_max) && <Crit icon={<IndianRupee className="h-3.5 w-3.5" />}>{fmtINR(b.budget_min)}–{fmtINR(b.budget_max)}</Crit>}
        {b.event_date && <Crit icon={<CalendarDays className="h-3.5 w-3.5" />}>Live {fmtDate(b.event_date)}</Crit>}
        {b.apply_by && <Crit icon={<CalendarDays className="h-3.5 w-3.5" />}>Apply by {fmtDate(b.apply_by)}</Crit>}
      </div>

      {(b.description || b.deliverables || b.categories?.length > 0) && (
        <details className="card group">
          <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-4 text-sm font-semibold sm:px-5">
            <FileText aria-hidden className="h-4 w-4 text-mute" /> Brief details
          </summary>
          <div className="grid gap-5 border-t border-line p-4 text-sm sm:grid-cols-2 sm:p-5">
            {b.description && <div className="sm:col-span-2"><div className="label">Description</div><p className="whitespace-pre-line text-fog/90">{b.description}</p></div>}
            {b.deliverables && <div><div className="label">Deliverables</div><p className="whitespace-pre-line">{b.deliverables}</p></div>}
            {b.categories?.length > 0 && <div><div className="label">Categories</div><p>{b.categories.join(", ")}</p></div>}
          </div>
        </details>
      )}

      <PipelineBoard intents={board} manage={manage} baseHref={baseHref} view={view} />

      {manage && (
        <Panel title="Suggested from the pool" icon={<UserPlus className="h-4 w-4" />} bodyClassName="p-0 sm:p-0">
          <form action={inviteTalent}>
            <input type="hidden" name="brief_id" value={b.id} /><input type="hidden" name="back" value={back} />
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <p className="max-w-xl text-xs text-mute">Approved talent matching this brief who aren&apos;t in the pipeline yet. Adding them shortlists them and unlocks contact details.</p>
              {suggestions.length > 0 && <button className="btn-primary"><UserPlus aria-hidden className="h-4 w-4" /> Add selected to shortlist</button>}
            </div>
            {suggestions.length === 0 ? <p className="border-t border-line px-5 py-4 text-sm text-mute">No additional matches right now.</p> : (
              <div className="overflow-x-auto border-t border-line">
                <table className="table w-full min-w-[680px]">
                  <thead><tr><th className="w-10"><span className="sr-only">Select</span></th><th>Talent</th><th>City</th><th className="text-right!">Followers</th><th className="text-right!">Eng.</th><th>Rank</th></tr></thead>
                  <tbody>
                    {suggestions.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <input type="checkbox" name="talent_id" value={t.id} id={`sg-${t.id}`} aria-label={`Select ${t.display_name}`} className="h-4 w-4 accent-brand" />
                        </td>
                        <td>
                          <label htmlFor={`sg-${t.id}`} className="flex items-center gap-2.5">
                            <Avatar src={t.ig?.profile_pic_url} name={t.display_name} size="xs" />
                            <span className="min-w-0">
                              <Link href={`/crm/talent/${t.id}`} className="block truncate font-medium hover:text-brand">{t.display_name}</Link>
                              <span className="block truncate text-xs text-mute">{t.ig ? `@${t.ig.handle}` : "—"}</span>
                            </span>
                          </label>
                        </td>
                        <td className="text-mute">{t.city}</td>
                        <td className="text-right tabular-nums">{fmtNum(t.ig?.followers)}</td>
                        <td className="text-right tabular-nums">{fmtEr(t.ig?.engagement_rate)}</td>
                        <td><Badge value={t.rank} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </form>
        </Panel>
      )}
    </div>
  );
}
