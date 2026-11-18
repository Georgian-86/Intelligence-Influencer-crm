import Link from "next/link";
import { Badge, Empty, Field, Notice, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { can, requireAgency } from "@/lib/session";
import { createCampaign } from "../actions";

export default async function Campaigns({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const agency = await requireAgency();
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, brand_name, status, start_date, end_date, briefs(id, status, intents(count))")
    .eq("org_id", agency.orgId)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Campaigns & briefs" subtitle="A campaign groups one or more talent briefs for a brand." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!campaigns?.length ? <Empty title="No campaigns yet">Create your first campaign to start posting briefs.</Empty> : (
            <div className="space-y-3">
              {campaigns.map((c) => {
                const briefs = (c.briefs ?? []) as unknown as { id: string; status: string; intents: { count: number }[] }[];
                const intents = briefs.reduce((s, b) => s + (b.intents?.[0]?.count ?? 0), 0);
                return (
                  <Link key={c.id} href={`/crm/campaigns/${c.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:border-brand">
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-mute">{c.brand_name ?? "—"}{c.start_date ? ` · ${new Date(c.start_date).toLocaleDateString("en-IN")}` : ""}</div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-mute">
                      <span>{briefs.length} briefs · {briefs.filter((b) => b.status === "open").length} open</span>
                      <span>{intents} talent in pipeline</span>
                      <Badge value={c.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        {can(agency, "campaign.manage") && (
          <form action={createCampaign} className="card h-fit space-y-4 p-5">
            <h2 className="font-semibold">New campaign</h2>
            {sp.error && <Notice kind="error">{sp.error}</Notice>}
            <Field label="Campaign name"><input name="name" required className="input" placeholder="Domino's College Fest 2026" /></Field>
            <Field label="Brand"><input name="brand_name" className="input" placeholder="Domino's" /></Field>
            <Field label="Description"><textarea name="description" rows={3} className="input" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start"><input type="date" name="start_date" className="input" /></Field>
              <Field label="End"><input type="date" name="end_date" className="input" /></Field>
            </div>
            <button className="btn-primary w-full">Create campaign</button>
          </form>
        )}
      </div>
    </>
  );
}
