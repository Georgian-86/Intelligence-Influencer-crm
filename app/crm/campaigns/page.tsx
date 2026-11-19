import Link from "next/link";
import { ArrowRight, CalendarDays, Megaphone, Plus } from "lucide-react";
import { Badge, Field, Notice } from "@/components/ui";
import { EmptyState, Panel, ScreenHeader, TabLinks } from "@/components/crm/primitives";
import { fmtDate } from "@/components/crm/format";
import { createClient } from "@/lib/supabase/server";
import { can, requireAgency } from "@/lib/session";
import { createCampaign } from "../actions";

const STATUSES = ["planning", "active", "completed", "archived"] as const;

export default async function Campaigns({ searchParams }: { searchParams: Promise<{ error?: string; status?: string; brand?: string }> }) {
  const agency = await requireAgency();
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, brand_name, status, start_date, end_date, briefs(id, status, intents(count))")
    .eq("org_id", agency.orgId)
    .order("created_at", { ascending: false });

  const all = campaigns ?? [];
  const filter = (STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status : undefined;
  const shown = filter ? all.filter((c) => c.status === filter) : all;
  const manage = can(agency, "campaign.manage");

  return (
    <>
      <ScreenHeader eyebrow="Bookings" title="Campaigns & briefs" subtitle="A campaign groups one or more talent briefs for a brand."
        actions={manage ? <a href="#new" className="btn-primary lg:hidden"><Plus aria-hidden className="h-4 w-4" /> New campaign</a> : null} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <TabLinks label="Filter by status" items={[
            { href: "/crm/campaigns", label: "All", count: all.length, active: !filter },
            ...STATUSES.map((s) => ({ href: `/crm/campaigns?status=${s}`, label: s, count: all.filter((c) => c.status === s).length, active: filter === s })),
          ]} />

          {!shown.length ? (
            <EmptyState icon={<Megaphone className="h-5 w-5" />} title={filter ? `No ${filter} campaigns` : "No campaigns yet"}>
              {filter ? "Try another status." : "Create your first campaign to start posting briefs."}
            </EmptyState>
          ) : (
            <ul className="grid gap-3">
              {shown.map((c) => {
                const briefs = (c.briefs ?? []) as unknown as { id: string; status: string; intents: { count: number }[] }[];
                const intents = briefs.reduce((s, b) => s + (b.intents?.[0]?.count ?? 0), 0);
                const open = briefs.filter((b) => b.status === "open").length;
                return (
                  <li key={c.id}>
                    <Link href={`/crm/campaigns/${c.id}`} className="card card-hover group flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                      <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 font-display text-lg font-bold text-brand">
                        {(c.brand_name ?? c.name).trim()[0]?.toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold group-hover:text-brand">{c.name}</span>
                          <Badge value={c.status} />
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-mute">
                          <span>{c.brand_name ?? "No brand"}</span>
                          {c.start_date && <span className="inline-flex items-center gap-1"><CalendarDays aria-hidden className="h-3 w-3" />{fmtDate(c.start_date)}{c.end_date ? ` → ${fmtDate(c.end_date)}` : ""}</span>}
                        </div>
                      </div>
                      <dl className="flex shrink-0 gap-5 text-right text-xs">
                        <div><dt className="text-mute">Briefs</dt><dd className="text-base font-semibold tabular-nums">{briefs.length}</dd></div>
                        <div><dt className="text-mute">Open</dt><dd className="text-base font-semibold tabular-nums text-ok">{open}</dd></div>
                        <div><dt className="text-mute">Pipeline</dt><dd className="text-base font-semibold tabular-nums">{intents}</dd></div>
                      </dl>
                      <ArrowRight aria-hidden className="hidden h-4 w-4 shrink-0 text-mute sm:block" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {manage && (
          <Panel id="new" title="New campaign" icon={<Plus className="h-4 w-4" />} className="h-fit scroll-mt-20 lg:sticky lg:top-20">
            <form action={createCampaign} className="space-y-4">
              {sp.error && <Notice kind="error">{sp.error}</Notice>}
              <Field label="Campaign name"><input name="name" required className="input" placeholder="Domino's College Fest 2026" /></Field>
              <Field label="Brand"><input name="brand_name" defaultValue={sp.brand ?? ""} className="input" placeholder="Domino's" /></Field>
              <Field label="Description"><textarea name="description" rows={3} className="input" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start"><input type="date" name="start_date" className="input" /></Field>
                <Field label="End"><input type="date" name="end_date" className="input" /></Field>
              </div>
              <button className="btn-primary w-full">Create campaign</button>
            </form>
          </Panel>
        )}
      </div>
    </>
  );
}
