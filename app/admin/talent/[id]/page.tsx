import { notFound } from "next/navigation";
import { clsx } from "clsx";
import { ClipboardCheck, Mail, MapPin, Phone, RefreshCw } from "lucide-react";
import { Badge, Field, Notice, fmtINR } from "@/components/ui";
import { IgCard } from "@/components/ig-card";
import { WhatsAppIcon } from "@/components/brand/icons";
import { Avatar, BackLink, Meta, Panel, TagList } from "@/components/crm/primitives";
import { fmtDate, timeAgo } from "@/components/crm/format";
import { createClient } from "@/lib/supabase/server";
import { requirePlatform } from "@/lib/session";
import { RANKS, RANK_LABEL, TALENT_STATUSES } from "@/lib/constants";
import { adminRefreshInstagram, reviewTalent } from "../../actions";

const STATUS_TONE: Record<string, string> = {
  pending: "peer-checked:border-warn/60 peer-checked:bg-warn/10 peer-checked:text-warn",
  screening: "peer-checked:border-info/60 peer-checked:bg-info/10 peer-checked:text-info",
  approved: "peer-checked:border-ok/60 peer-checked:bg-ok/10 peer-checked:text-ok",
  rejected: "peer-checked:border-bad/60 peer-checked:bg-bad/10 peer-checked:text-bad",
  suspended: "peer-checked:border-bad/60 peer-checked:bg-bad/10 peer-checked:text-bad",
};
const RANK_TONE: Record<string, string> = {
  bronze: "peer-checked:border-bronze/60 peer-checked:bg-bronze/10 peer-checked:text-bronze",
  silver: "peer-checked:border-silver/50 peer-checked:bg-silver/10 peer-checked:text-silver",
  gold: "peer-checked:border-gold/60 peer-checked:bg-gold/10 peer-checked:text-gold",
  platinum: "peer-checked:border-platinum/60 peer-checked:bg-platinum/10 peer-checked:text-platinum",
};

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
      <BackLink href={`/admin?status=${t.status}`}>Screening queue</BackLink>

      <section className="card flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <Avatar src={ig?.profile_pic_url} name={t.display_name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{t.display_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mute">
            {ig && <span>@{ig.handle}</span>}
            {t.city && <span className="inline-flex items-center gap-1"><MapPin aria-hidden className="h-3.5 w-3.5" />{t.city}</span>}
            <span>Registered {timeAgo(t.created_at)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge value={t.status} />
          <Badge value={t.rank} label={RANK_LABEL[t.rank as (typeof RANKS)[number]]} />
        </div>
      </section>

      {sp.saved && <Notice kind="ok">Review saved.</Notice>}
      {sp.error && <Notice kind="error">{sp.error}</Notice>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          {ig && <IgCard acc={ig} action={
            <form action={adminRefreshInstagram}>
              <input type="hidden" name="account_id" value={ig.id} /><input type="hidden" name="back" value={back} />
              <button className="btn-ghost min-h-9 py-1.5 text-xs"><RefreshCw aria-hidden className="h-3.5 w-3.5" /> Refetch</button>
            </form>
          } />}

          <Panel title="Registration">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Meta label="Joined as">{[t.is_influencer && "Influencer", t.is_event_talent && "Event talent"].filter(Boolean).join(", ") || "—"}</Meta>
              <Meta label="City">{t.city ?? "—"}</Meta>
              <Meta label="Contact">
                <span className="flex flex-col gap-1">
                  {contact?.email && <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 text-brand"><Mail aria-hidden className="h-3.5 w-3.5" />{contact.email}</a>}
                  {contact?.phone && <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5"><Phone aria-hidden className="h-3.5 w-3.5 text-mute" />{contact.phone}</a>}
                  {contact?.whatsapp && contact.whatsapp !== contact.phone && <span className="inline-flex items-center gap-1.5"><WhatsAppIcon className="h-3.5 w-3.5 text-ok" />{contact.whatsapp}</span>}
                  {!contact && "—"}
                </span>
              </Meta>
              <Meta label="Gender / DOB"><span className="capitalize">{t.gender ?? "—"}</span> · {t.date_of_birth ? fmtDate(t.date_of_birth) : "—"}</Meta>
              <Meta label="Categories"><TagList items={t.categories} /></Meta>
              <Meta label="Skills"><TagList items={t.skills} /></Meta>
              <Meta label="Languages">{t.languages.join(", ") || "—"}</Meta>
              <Meta label="Experience">{t.experience_years ?? "—"} yrs</Meta>
              <Meta label="Rates"><span className="tabular-nums">Post {fmtINR(t.rate_per_post)} · Half {fmtINR(t.rate_half_day)} · Full {fmtINR(t.rate_full_day)}</span></Meta>
              <Meta label="Consent to share">{t.consent_share ? <span className="text-ok">Yes</span> : <span className="text-warn">No</span>}</Meta>
              {t.bio && <Meta label="Bio" className="sm:col-span-2"><span className="whitespace-pre-line">{t.bio}</span></Meta>}
              {t.experience_notes && <Meta label="Past work" className="sm:col-span-2"><span className="whitespace-pre-line">{t.experience_notes}</span></Meta>}
              {(media?.length ?? 0) > 0 && (
                <Meta label="Portfolio / videos" className="sm:col-span-2">
                  {media!.map((m) => <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="block break-all text-brand hover:underline">{m.url}</a>)}
                </Meta>
              )}
            </dl>
          </Panel>
        </div>

        <Panel title="Review" icon={<ClipboardCheck className="h-4 w-4" />} className="h-fit lg:sticky lg:top-20">
          <form action={reviewTalent} className="space-y-5">
            <input type="hidden" name="id" value={t.id} />
            <fieldset>
              <legend className="label">Status</legend>
              <div className="flex flex-wrap gap-1.5">
                {TALENT_STATUSES.map((s) => (
                  <label key={s}>
                    <input type="radio" name="status" value={s} defaultChecked={t.status === s} className="peer sr-only" />
                    <span className={clsx("chip min-h-9 px-3 capitalize text-mute peer-focus-visible:ring-2 peer-focus-visible:ring-brand", STATUS_TONE[s])}>{s}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">Rank</legend>
              <div className="grid grid-cols-2 gap-1.5">
                {RANKS.map((r) => (
                  <label key={r}>
                    <input type="radio" name="rank" value={r} defaultChecked={t.rank === r} className="peer sr-only" />
                    <span className={clsx("flex min-h-11 flex-col justify-center rounded-xl border border-line px-3 py-1.5 text-mute transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand", RANK_TONE[r])}>
                      <span className="text-sm font-semibold capitalize">{r}</span>
                      <span className="text-[11px] opacity-80">{RANK_LABEL[r].split("·")[1]?.trim()}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Rating (1–5)"><input name="rating" type="number" step="0.1" min="1" max="5" defaultValue={t.rating ?? ""} className="input" /></Field>
              <Field label="Reliability (0–100)"><input name="reliability_score" type="number" min="0" max="100" defaultValue={t.reliability_score ?? ""} className="input" /></Field>
            </div>
            <Field label="Screening / interview notes"><textarea name="review_notes" rows={4} defaultValue={t.review_notes ?? ""} className="input" /></Field>
            <button className="btn-primary w-full">Save review</button>
            {t.reviewed_at && <p className="text-xs text-mute">Last reviewed {new Date(t.reviewed_at).toLocaleString("en-IN")}</p>}
          </form>
        </Panel>
      </div>
    </div>
  );
}
