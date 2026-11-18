import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { can, requireAgency } from "@/lib/session";
import { setCampaignStatus } from "../../actions";

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

  return (
    <>
      <Link href="/crm/campaigns" className="text-sm text-mute hover:text-fog">← Campaigns</Link>
      <div className="mt-3">
        <PageHeader title={c.name} subtitle={[c.brand_name, c.start_date && `${c.start_date} → ${c.end_date ?? "…"}`].filter(Boolean).join(" · ")}
          actions={<>
            {can(agency, "campaign.manage") && (
              <form action={setCampaignStatus} className="flex gap-2">
                <input type="hidden" name="id" value={c.id} />
                <select name="status" defaultValue={c.status} className="input w-36">
                  {["planning", "active", "completed", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn-ghost">Update</button>
              </form>
            )}
            {can(agency, "brief.manage") && <Link href={`/crm/briefs/new?campaign=${c.id}`} className="btn-primary">New brief</Link>}
          </>} />
      </div>
      {c.description && <p className="mb-6 max-w-3xl whitespace-pre-line text-sm text-mute">{c.description}</p>}
      {!briefs?.length ? <Empty title="No briefs yet">Post a brief to collect interest from matching talent.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="table w-full">
            <thead><tr><th>Brief</th><th>Talent</th><th>Cities</th><th>Interested</th><th>Shortlisted+</th><th>Confirmed</th><th>Status</th></tr></thead>
            <tbody>
              {briefs.map((b) => {
                const st = (b.intents ?? []) as { stage: string }[];
                return (
                  <tr key={b.id}>
                    <td><Link href={`/crm/briefs/${b.id}`} className="font-medium hover:text-brand">{b.title}</Link></td>
                    <td className="capitalize text-mute">{b.talent_kind}</td>
                    <td className="text-mute">{b.cities.join(", ") || "Any"}</td>
                    <td>{st.filter((i) => i.stage === "interested").length}</td>
                    <td>{st.filter((i) => ["shortlisted", "contacted", "negotiating"].includes(i.stage)).length}</td>
                    <td>{st.filter((i) => ["confirmed", "delivered"].includes(i.stage)).length}</td>
                    <td><Badge value={b.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
