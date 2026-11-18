import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Field, Notice, fmtINR, fmtNum } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getMyTalent } from "@/lib/session";
import { mismatches } from "@/lib/match";
import { expressInterest } from "../../actions";

export default async function TalentBrief({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const talent = await getMyTalent();
  if (!talent) redirect("/onboarding");
  const supabase = await createClient();
  const { data: b } = await supabase.from("briefs").select("*").eq("id", id).maybeSingle();
  if (!b) notFound();
  const [{ data: ig }, { data: intent }] = await Promise.all([
    supabase.from("social_accounts").select("followers, engagement_rate").eq("talent_id", talent.id).maybeSingle(),
    supabase.from("intents").select("id, stage").eq("talent_id", talent.id).eq("brief_id", id).maybeSingle(),
  ]);
  const miss = mismatches(b, { ...talent, ...(ig ?? {}) });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/dashboard/briefs" className="text-sm text-mute hover:text-fog">← All briefs</Link>
      <div className="card p-6">
        <div className="text-xs uppercase tracking-wide text-brand">{b.brand_display || "Confidential brand"}</div>
        <h1 className="mt-1 text-2xl font-bold">{b.title}</h1>
        <p className="mt-3 whitespace-pre-line text-sm text-mute">{b.description}</p>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          {b.deliverables && <div className="sm:col-span-2"><dt className="label">Deliverables</dt><dd className="whitespace-pre-line">{b.deliverables}</dd></div>}
          <div><dt className="label">Cities</dt><dd>{b.cities.length ? b.cities.join(", ") : "Any"}</dd></div>
          <div><dt className="label">Budget</dt><dd>{b.budget_min || b.budget_max ? `${fmtINR(b.budget_min)} – ${fmtINR(b.budget_max)}` : "To be discussed"}</dd></div>
          {b.event_date && <div><dt className="label">Date</dt><dd>{new Date(b.event_date).toLocaleDateString("en-IN")}</dd></div>}
          {b.apply_by && <div><dt className="label">Apply by</dt><dd>{new Date(b.apply_by).toLocaleDateString("en-IN")}</dd></div>}
          {(b.min_followers || b.max_followers) && <div><dt className="label">Followers</dt><dd>{fmtNum(b.min_followers)} – {fmtNum(b.max_followers)}</dd></div>}
        </dl>
      </div>

      {sp.sent && <Notice kind="ok">Interest sent! The Vigor team will reach out if you&apos;re shortlisted.</Notice>}
      {sp.error && <Notice kind="error">{sp.error}</Notice>}

      {intent ? (
        <div className="card p-5 text-sm">You&apos;ve applied to this brief. Track it in <Link href="/dashboard/applications" className="text-brand hover:underline">My applications</Link>.</div>
      ) : miss.length > 0 ? (
        <div className="card p-5 text-sm text-mute">This brief doesn&apos;t match your profile: {miss.join(" · ")}</div>
      ) : (
        <form action={expressInterest} className="card space-y-4 p-6">
          <input type="hidden" name="brief_id" value={b.id} />
          <h2 className="font-semibold">I&apos;m interested</h2>
          <Field label="Note to the team (optional)"><textarea name="message" rows={3} className="input" placeholder="Why you're a great fit, relevant past work, availability…" /></Field>
          <Field label="Your expected fee (₹, optional)"><input name="quoted_rate" inputMode="numeric" className="input" /></Field>
          <button className="btn-primary">Express interest</button>
        </form>
      )}
    </div>
  );
}
