import Link from "next/link";
import { redirect } from "next/navigation";
import { Empty, PageHeader, fmtINR } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getMyTalent } from "@/lib/session";
import { mismatches } from "@/lib/match";

export default async function TalentBriefs() {
  const talent = await getMyTalent();
  if (!talent) redirect("/onboarding");
  if (talent.status !== "approved") {
    return (<><PageHeader title="Open briefs" /><Empty title="Briefs unlock after approval">The Vigor team is reviewing your profile.</Empty></>);
  }
  const supabase = await createClient();
  const [{ data: briefs }, { data: ig }, { data: mine }] = await Promise.all([
    supabase.from("briefs").select("*").eq("status", "open").order("created_at", { ascending: false }),
    supabase.from("social_accounts").select("followers, engagement_rate").eq("talent_id", talent.id).maybeSingle(),
    supabase.from("intents").select("brief_id, stage").eq("talent_id", talent.id),
  ]);
  const applied = new Map((mine ?? []).map((i) => [i.brief_id, i.stage]));
  const rows = (briefs ?? []).map((b) => ({ b, miss: mismatches(b, { ...talent, ...(ig ?? {}) }) }));
  const eligible = rows.filter((r) => r.miss.length === 0);

  return (
    <>
      <PageHeader title="Open briefs" subtitle={`${eligible.length} brief${eligible.length === 1 ? "" : "s"} match your profile`} />
      {eligible.length === 0 ? (
        <Empty title="No matching briefs right now">New campaigns are posted every week — check back soon.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {eligible.map(({ b }) => (
            <Link key={b.id} href={`/dashboard/briefs/${b.id}`} className="card block p-5 transition hover:border-brand">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-brand">{b.brand_display || "Confidential brand"}</div>
                  <div className="mt-1 font-semibold">{b.title}</div>
                </div>
                {applied.has(b.id) && <span className="chip border-ok/40 text-ok">Applied</span>}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-mute">{b.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-mute">
                {b.cities.length > 0 && <span className="chip">{b.cities.join(", ")}</span>}
                {(b.budget_min || b.budget_max) && <span className="chip">{fmtINR(b.budget_min)}–{fmtINR(b.budget_max)}</span>}
                {b.apply_by && <span className="chip">Apply by {new Date(b.apply_by).toLocaleDateString("en-IN")}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
