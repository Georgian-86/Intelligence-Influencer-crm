import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Mic2, Sparkles, Users } from "lucide-react";
import { CheckGroup, Field, Notice } from "@/components/ui";
import { ScreenHeader } from "@/components/crm/primitives";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/session";
import { CITIES, EVENT_CATEGORIES, INFLUENCER_NICHES, RANKS } from "@/lib/constants";
import { createBrief } from "../../actions";

function Section({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`sec-${n}`} className="card p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-brand/40 bg-brand/10 text-xs font-bold text-brand">{n}</span>
        <div>
          <h2 id={`sec-${n}`} className="font-sans text-base font-semibold tracking-normal">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-mute">{hint}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const KINDS = [
  { v: "influencer", l: "Influencers", d: "Creators with an Instagram audience", icon: Sparkles },
  { v: "event", l: "Event talent", d: "Promoters, hosts, artists, crew", icon: Mic2 },
  { v: "any", l: "Anyone", d: "Open to every approved talent", icon: Users },
];

export default async function NewBrief({ searchParams }: { searchParams: Promise<{ campaign?: string; error?: string }> }) {
  const agency = await requireAgency("brief.manage");
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: c } = await supabase.from("campaigns").select("id, name, brand_name").eq("id", sp.campaign ?? "").eq("org_id", agency.orgId).maybeSingle();
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-4xl">
      <ScreenHeader back={{ href: `/crm/campaigns/${c.id}`, label: c.name }} eyebrow="New brief" title="What do you need?"
        subtitle="Approved talent matching the criteria will see it once published." />
      <form action={createBrief} className="space-y-5 pb-24">
        <input type="hidden" name="campaign_id" value={c.id} />
        {sp.error && <Notice kind="error">{sp.error}</Notice>}

        <Section n={1} title="Basics" hint="How the brief appears to talent.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brief title"><input name="title" required className="input" placeholder="Micro food creators for launch week" /></Field>
            <Field label="Brand shown to talent" hint="Leave blank to show 'Confidential brand'."><input name="brand_display" defaultValue={c.brand_name ?? ""} className="input" /></Field>
          </div>
          <Field label="Description"><textarea name="description" rows={4} className="input" placeholder="What the campaign is about and what you're looking for." /></Field>
        </Section>

        <Section n={2} title="Deliverables, budget & dates">
          <Field label="Deliverables"><textarea name="deliverables" rows={3} className="input" placeholder="1 reel + 2 stories, or 2 days of on-ground promotion…" /></Field>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Budget min (₹)"><input name="budget_min" inputMode="numeric" className="input" /></Field>
            <Field label="Budget max (₹)"><input name="budget_max" inputMode="numeric" className="input" /></Field>
            <Field label="Event / go-live date"><input type="date" name="event_date" className="input" /></Field>
            <Field label="Apply by"><input type="date" name="apply_by" className="input" /></Field>
          </div>
        </Section>

        <Section n={3} title="Who should see it" hint="Only approved talent who match every criterion see the brief.">
          <fieldset>
            <legend className="label">Talent type</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {KINDS.map((k) => (
                <label key={k.v} className="relative">
                  <input type="radio" name="talent_kind" value={k.v} defaultChecked={k.v === "influencer"} className="peer sr-only" />
                  <span className="flex h-full items-start gap-3 rounded-xl border border-line bg-ink p-3 transition-colors peer-checked:border-brand peer-checked:bg-brand/5 peer-focus-visible:ring-2 peer-focus-visible:ring-brand">
                    <k.icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span><span className="block text-sm font-semibold">{k.l}</span><span className="block text-xs text-mute">{k.d}</span></span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Cities (none = all)"><CheckGroup name="cities" options={CITIES} columns={3} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Min followers"><input name="min_followers" inputMode="numeric" className="input" /></Field>
            <Field label="Max followers"><input name="max_followers" inputMode="numeric" className="input" /></Field>
            <Field label="Min engagement %"><input name="min_engagement" inputMode="decimal" className="input" /></Field>
          </div>
          <Field label="Ranks (none = all)"><CheckGroup name="ranks" options={RANKS} columns={3} /></Field>
        </Section>

        <Section n={4} title="Categories" hint="Optional. Leave all unchecked to accept every category.">
          <details className="group rounded-xl border border-line bg-ink p-4">
            <summary className="cursor-pointer text-sm font-medium text-brand">Influencer niches</summary>
            <div className="mt-3"><CheckGroup name="categories" options={INFLUENCER_NICHES} columns={3} /></div>
          </details>
          <details className="group rounded-xl border border-line bg-ink p-4">
            <summary className="cursor-pointer text-sm font-medium text-brand">Event talent roles</summary>
            <div className="mt-3"><CheckGroup name="categories" options={EVENT_CATEGORIES} columns={3} /></div>
          </details>
        </Section>

        <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-ink/85 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="mr-auto hidden text-xs text-mute sm:block">Drafts are only visible to your team.</span>
            <button name="publish" value="0" className="btn-ghost">Save as draft</button>
            <button name="publish" value="1" className="btn-primary">Publish brief</button>
          </div>
        </div>
      </form>
    </div>
  );
}
