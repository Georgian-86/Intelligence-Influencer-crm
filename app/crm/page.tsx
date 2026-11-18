import Link from "next/link";
import { Badge, PageHeader, Stat } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/session";

export default async function CrmHome() {
  const agency = await requireAgency();
  const supabase = await createClient();
  const [pool, openBriefs, newIntents, confirmed, enquiries, recent] = await Promise.all([
    supabase.from("talent_profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("briefs").select("id", { count: "exact", head: true }).eq("org_id", agency.orgId).eq("status", "open"),
    supabase.from("intents").select("id", { count: "exact", head: true }).eq("org_id", agency.orgId).eq("stage", "interested"),
    supabase.from("intents").select("id", { count: "exact", head: true }).eq("org_id", agency.orgId).in("stage", ["confirmed", "delivered"]),
    supabase.from("brand_enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("intents")
      .select("id, stage, created_at, talent_profiles(id, display_name, city), briefs(id, title)")
      .eq("org_id", agency.orgId).order("updated_at", { ascending: false }).limit(10),
  ]);

  return (
    <>
      <PageHeader title={agency.orgName} subtitle="Influencer & talent CRM" actions={<Link href="/crm/campaigns" className="btn-primary">New campaign</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Approved talent" value={pool.count ?? 0} />
        <Stat label="Open briefs" value={openBriefs.count ?? 0} />
        <Stat label="New interest" value={newIntents.count ?? 0} hint="Waiting for review" />
        <Stat label="Confirmed" value={confirmed.count ?? 0} />
        <Stat label="New enquiries" value={enquiries.count ?? 0} />
      </div>
      <div className="card mt-6 p-5">
        <div className="mb-3 font-semibold">Latest pipeline activity</div>
        {!recent.data?.length ? <p className="text-sm text-mute">No activity yet. Publish a brief to start collecting interest.</p> : (
          <ul className="divide-y divide-line text-sm">
            {recent.data.map((i) => {
              const t = i.talent_profiles as unknown as { id: string; display_name: string; city: string } | null;
              const b = i.briefs as unknown as { id: string; title: string } | null;
              return (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span><Link href={`/crm/talent/${t?.id}`} className="font-medium hover:text-brand">{t?.display_name}</Link> <span className="text-mute">on</span> <Link href={`/crm/briefs/${b?.id}`} className="hover:text-brand">{b?.title}</Link></span>
                  <Badge value={i.stage} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
