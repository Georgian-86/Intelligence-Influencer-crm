import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, fmtINR, fmtNum } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { can, requireAgency } from "@/lib/session";
import { searchPool } from "@/lib/pool";
import { mismatches } from "@/lib/match";
import { STAGES } from "@/lib/constants";
import { inviteTalent, setBriefStatus, updateIntent } from "../../actions";

const COLUMNS: { title: string; stages: string[] }[] = [
  { title: "Interested", stages: ["interested"] },
  { title: "Shortlisted", stages: ["shortlisted"] },
  { title: "Contacted / negotiating", stages: ["contacted", "negotiating"] },
  { title: "Confirmed / delivered", stages: ["confirmed", "delivered"] },
  { title: "Rejected / dropped", stages: ["rejected", "dropped"] },
];

type IntentRow = {
  id: string; stage: string; source: string; message: string | null; quoted_rate: number | null; agreed_rate: number | null; created_at: string;
  talent_profiles: { id: string; display_name: string; city: string | null; rank: string; social_accounts: { handle: string; followers: number | null; engagement_rate: number | null }[] } | null;
};

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const agency = await requireAgency();
  const { id } = await params;
  const supabase = await createClient();
  const { data: b } = await supabase.from("briefs").select("*, campaigns(id, name)").eq("id", id).eq("org_id", agency.orgId).maybeSingle();
  if (!b) notFound();
  const { data } = await supabase
    .from("intents")
    .select("id, stage, source, message, quoted_rate, agreed_rate, created_at, talent_profiles(id, display_name, city, rank, social_accounts(handle, followers, engagement_rate))")
    .eq("brief_id", id)
    .order("created_at", { ascending: true });
  const intents = (data ?? []) as unknown as IntentRow[];
  const inPipeline = new Set(intents.map((i) => i.talent_profiles?.id));
  const manage = can(agency, "pipeline.manage");
  const back = `/crm/briefs/${id}`;

  const pool = manage ? await searchPool({ kind: b.talent_kind === "any" ? undefined : b.talent_kind, sort: "engagement" }, 2000) : [];
  const suggestions = pool
    .filter((t) => !inPipeline.has(t.id))
    .filter((t) => mismatches(b, { ...t, followers: t.ig?.followers, engagement_rate: t.ig?.engagement_rate }).length === 0)
    .slice(0, 25);
  const campaign = b.campaigns as unknown as { id: string; name: string } | null;

  return (
    <div className="space-y-6">
      <Link href={`/crm/campaigns/${campaign?.id}`} className="text-sm text-mute hover:text-fog">← {campaign?.name}</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-2xl font-bold">{b.title}</h1><Badge value={b.status} /></div>
          <p className="mt-1 text-sm text-mute">
            {b.brand_display || "Confidential brand"} · <span className="capitalize">{b.talent_kind}</span> · {b.cities.join(", ") || "All cities"}
            {(b.min_followers || b.max_followers) && ` · ${fmtNum(b.min_followers)}–${fmtNum(b.max_followers)} followers`}
            {b.min_engagement && ` · ≥${b.min_engagement}% ER`}
            {(b.budget_min || b.budget_max) && ` · ${fmtINR(b.budget_min)}–${fmtINR(b.budget_max)}`}
          </p>
        </div>
        {can(agency, "brief.manage") && (
          <div className="flex gap-2">
            {b.status !== "open" && <form action={setBriefStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="open" /><button className="btn-primary">Publish</button></form>}
            {b.status === "open" && <form action={setBriefStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="closed" /><button className="btn-ghost">Close brief</button></form>}
          </div>
        )}
      </div>
      {(b.description || b.deliverables) && (
        <details className="card p-4 text-sm"><summary className="cursor-pointer font-semibold">Brief details</summary>
          <p className="mt-3 whitespace-pre-line text-mute">{b.description}</p>
          {b.deliverables && <p className="mt-3 whitespace-pre-line"><span className="label">Deliverables</span>{b.deliverables}</p>}
        </details>
      )}

      <div className="grid gap-4 xl:grid-cols-5">
        {COLUMNS.map((col) => {
          const items = intents.filter((i) => col.stages.includes(i.stage));
          return (
            <div key={col.title} className="rounded-2xl border border-line bg-ink-2/60 p-3">
              <div className="mb-3 flex items-center justify-between text-sm font-semibold">{col.title}<span className="text-mute">{items.length}</span></div>
              <div className="space-y-3">
                {items.map((i) => {
                  const t = i.talent_profiles;
                  const ig = t?.social_accounts?.[0];
                  return (
                    <div key={i.id} className="rounded-xl border border-line bg-ink p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/crm/talent/${t?.id}`} className="font-medium hover:text-brand">{t?.display_name}</Link>
                        {i.source === "invited" && <span className="chip text-[10px]">Invited</span>}
                      </div>
                      <div className="mt-0.5 text-xs text-mute">
                        {t?.city}{ig ? ` · @${ig.handle} · ${fmtNum(ig.followers)} · ${ig.engagement_rate ?? "—"}%` : ""}
                      </div>
                      {i.message && <p className="mt-2 line-clamp-3 text-xs text-mute">“{i.message}”</p>}
                      <div className="mt-2 text-xs">Quote {fmtINR(i.quoted_rate)}{i.agreed_rate ? ` · Agreed ${fmtINR(i.agreed_rate)}` : ""}</div>
                      {manage && (
                        <form action={updateIntent} className="mt-2 flex flex-wrap gap-1.5">
                          <input type="hidden" name="id" value={i.id} /><input type="hidden" name="back" value={back} />
                          <select name="stage" defaultValue={i.stage} className="input w-full py-1 text-xs">
                            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <input name="agreed_rate" defaultValue={i.agreed_rate ?? ""} placeholder="Agreed ₹" inputMode="numeric" className="input w-24 flex-1 py-1 text-xs" />
                          <button className="btn-ghost px-2 py-1 text-xs">Save</button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {manage && (
        <form action={inviteTalent} className="card p-5">
          <input type="hidden" name="brief_id" value={b.id} /><input type="hidden" name="back" value={back} />
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-semibold">Suggested from the pool</div>
              <div className="text-xs text-mute">Approved talent matching this brief who aren&apos;t in the pipeline yet. Adding them shortlists them and unlocks contact details.</div>
            </div>
            {suggestions.length > 0 && <button className="btn-primary">Add selected to shortlist</button>}
          </div>
          {suggestions.length === 0 ? <p className="text-sm text-mute">No additional matches right now.</p> : (
            <div className="overflow-x-auto">
              <table className="table w-full min-w-[640px]">
                <thead><tr><th /><th>Talent</th><th>City</th><th>Instagram</th><th>Followers</th><th>Eng.</th><th>Rank</th></tr></thead>
                <tbody>
                  {suggestions.map((t) => (
                    <tr key={t.id}>
                      <td><input type="checkbox" name="talent_id" value={t.id} className="accent-[#ff6a1a]" /></td>
                      <td><Link href={`/crm/talent/${t.id}`} className="hover:text-brand">{t.display_name}</Link></td>
                      <td>{t.city}</td>
                      <td className="text-mute">{t.ig ? `@${t.ig.handle}` : "—"}</td>
                      <td>{fmtNum(t.ig?.followers)}</td>
                      <td>{t.ig?.engagement_rate != null ? `${t.ig.engagement_rate}%` : "—"}</td>
                      <td><Badge value={t.rank} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
