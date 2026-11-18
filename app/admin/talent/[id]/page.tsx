import Link from "next/link";
import { notFound } from "next/navigation";
import { Field, Notice, fmtINR } from "@/components/ui";
import { IgCard } from "@/components/ig-card";
import { createClient } from "@/lib/supabase/server";
import { requirePlatform } from "@/lib/session";
import { RANKS, RANK_LABEL, TALENT_STATUSES } from "@/lib/constants";
import { adminRefreshInstagram, reviewTalent } from "../../actions";

export default async function AdminTalent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requirePlatform();
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: t } = await supabase.from("talent_profiles").select("*").eq("id", id).maybeSingle();
  if (!t) notFound();
  const [{ data: ig }, { data: contact }, { data: media }] = await Promise.all([
    supabase.from("social_accounts").select("*").eq("talent_id", id).maybeSingle(),
    supabase.from("talent_contacts").select("*").eq("talent_id", id).maybeSingle(),
    supabase.from("talent_media").select("*").eq("talent_id", id),
  ]);
  const back = `/admin/talent/${id}`;

  return (
    <div className="space-y-6">
      <Link href={`/admin?status=${t.status}`} className="text-sm text-mute hover:text-fog">← Screening queue</Link>
      <h1 className="text-2xl font-bold">{t.display_name}</h1>
      {sp.saved && <Notice kind="ok">Review saved.</Notice>}
      {sp.error && <Notice kind="error">{sp.error}</Notice>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {ig && <IgCard acc={ig} action={
            <form action={adminRefreshInstagram}><input type="hidden" name="account_id" value={ig.id} /><input type="hidden" name="back" value={back} /><button className="btn-ghost py-1.5 text-xs">Refetch</button></form>
          } />}
          <div className="card space-y-3 p-5 text-sm">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="label">Joined as</dt><dd>{[t.is_influencer && "Influencer", t.is_event_talent && "Event talent"].filter(Boolean).join(", ")}</dd></div>
              <div><dt className="label">City</dt><dd>{t.city}</dd></div>
              <div><dt className="label">Contact</dt><dd>{contact?.email}<br />{contact?.phone}{contact?.whatsapp && contact.whatsapp !== contact.phone ? ` · WA ${contact.whatsapp}` : ""}</dd></div>
              <div><dt className="label">Gender / DOB</dt><dd>{t.gender ?? "—"} · {t.date_of_birth ?? "—"}</dd></div>
              <div><dt className="label">Categories</dt><dd>{t.categories.join(", ") || "—"}</dd></div>
              <div><dt className="label">Skills</dt><dd>{t.skills.join(", ") || "—"}</dd></div>
              <div><dt className="label">Languages</dt><dd>{t.languages.join(", ") || "—"}</dd></div>
              <div><dt className="label">Experience</dt><dd>{t.experience_years ?? "—"} yrs</dd></div>
              <div><dt className="label">Rates</dt><dd>Post {fmtINR(t.rate_per_post)} · Half {fmtINR(t.rate_half_day)} · Full {fmtINR(t.rate_full_day)}</dd></div>
              <div><dt className="label">Consent to share</dt><dd>{t.consent_share ? "Yes" : "No"}</dd></div>
            </dl>
            {t.bio && <div><div className="label">Bio</div><p className="whitespace-pre-line">{t.bio}</p></div>}
            {t.experience_notes && <div><div className="label">Past work</div><p className="whitespace-pre-line">{t.experience_notes}</p></div>}
            {(media?.length ?? 0) > 0 && <div><div className="label">Portfolio / videos</div>
              {media!.map((m) => <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="block break-all text-brand hover:underline">{m.url}</a>)}</div>}
          </div>
        </div>
        <form action={reviewTalent} className="card h-fit space-y-4 p-5">
          <input type="hidden" name="id" value={t.id} />
          <h2 className="font-semibold">Review</h2>
          <Field label="Status">
            <select name="status" defaultValue={t.status} className="input">{TALENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </Field>
          <Field label="Rank">
            <select name="rank" defaultValue={t.rank} className="input">{RANKS.map((r) => <option key={r} value={r}>{RANK_LABEL[r]}</option>)}</select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rating (1–5)"><input name="rating" type="number" step="0.1" min="1" max="5" defaultValue={t.rating ?? ""} className="input" /></Field>
            <Field label="Reliability (0–100)"><input name="reliability_score" type="number" min="0" max="100" defaultValue={t.reliability_score ?? ""} className="input" /></Field>
          </div>
          <Field label="Screening / interview notes"><textarea name="review_notes" rows={4} defaultValue={t.review_notes ?? ""} className="input" /></Field>
          <button className="btn-primary w-full">Save review</button>
          {t.reviewed_at && <p className="text-xs text-mute">Last reviewed {new Date(t.reviewed_at).toLocaleString("en-IN")}</p>}
        </form>
      </div>
    </div>
  );
}
