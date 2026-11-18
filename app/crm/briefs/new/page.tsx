import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckGroup, Field, Notice, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/session";
import { CITIES, EVENT_CATEGORIES, INFLUENCER_NICHES, RANKS } from "@/lib/constants";
import { createBrief } from "../../actions";

export default async function NewBrief({ searchParams }: { searchParams: Promise<{ campaign?: string; error?: string }> }) {
  const agency = await requireAgency("brief.manage");
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: c } = await supabase.from("campaigns").select("id, name, brand_name").eq("id", sp.campaign ?? "").eq("org_id", agency.orgId).maybeSingle();
  if (!c) notFound();
  return (
    <div className="max-w-4xl">
      <Link href={`/crm/campaigns/${c.id}`} className="text-sm text-mute hover:text-fog">← {c.name}</Link>
      <div className="mt-3"><PageHeader title="New brief" subtitle="Approved talent matching the criteria will see it once published." /></div>
      <form action={createBrief} className="space-y-6">
        <input type="hidden" name="campaign_id" value={c.id} />
        {sp.error && <Notice kind="error">{sp.error}</Notice>}
        <section className="card space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brief title"><input name="title" required className="input" placeholder="Micro food creators for launch week" /></Field>
            <Field label="Brand shown to talent" hint="Leave blank to show 'Confidential brand'."><input name="brand_display" defaultValue={c.brand_name ?? ""} className="input" /></Field>
          </div>
          <Field label="Description"><textarea name="description" rows={4} className="input" placeholder="What the campaign is about and what you're looking for." /></Field>
          <Field label="Deliverables"><textarea name="deliverables" rows={3} className="input" placeholder="1 reel + 2 stories, or 2 days of on-ground promotion…" /></Field>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Budget min (₹)"><input name="budget_min" inputMode="numeric" className="input" /></Field>
            <Field label="Budget max (₹)"><input name="budget_max" inputMode="numeric" className="input" /></Field>
            <Field label="Event / go-live date"><input type="date" name="event_date" className="input" /></Field>
            <Field label="Apply by"><input type="date" name="apply_by" className="input" /></Field>
          </div>
        </section>
        <section className="card space-y-4 p-6">
          <h2 className="font-semibold">Who should see it</h2>
          <Field label="Talent type">
            <select name="talent_kind" className="input sm:w-64" defaultValue="influencer">
              <option value="influencer">Influencers</option><option value="event">Event talent</option><option value="any">Anyone</option>
            </select>
          </Field>
          <Field label="Cities (none = all)"><CheckGroup name="cities" options={CITIES} columns={3} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Min followers"><input name="min_followers" inputMode="numeric" className="input" /></Field>
            <Field label="Max followers"><input name="max_followers" inputMode="numeric" className="input" /></Field>
            <Field label="Min engagement %"><input name="min_engagement" inputMode="decimal" className="input" /></Field>
          </div>
          <Field label="Ranks (none = all)"><CheckGroup name="ranks" options={RANKS} columns={3} /></Field>
          <details>
            <summary className="cursor-pointer text-sm text-brand">Categories (none = all)</summary>
            <div className="mt-3 space-y-3">
              <Field label="Influencer niches"><CheckGroup name="categories" options={INFLUENCER_NICHES} columns={3} /></Field>
              <Field label="Event talent"><CheckGroup name="categories" options={EVENT_CATEGORIES} columns={3} /></Field>
            </div>
          </details>
        </section>
        <div className="flex gap-3">
          <button name="publish" value="1" className="btn-primary">Publish brief</button>
          <button name="publish" value="0" className="btn-ghost">Save as draft</button>
        </div>
      </form>
    </div>
  );
}
