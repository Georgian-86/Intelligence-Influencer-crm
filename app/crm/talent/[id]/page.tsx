import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Empty, fmtINR, fmtNum, imgSrc } from "@/components/ui";
import { IgCard } from "@/components/ig-card";
import { createClient } from "@/lib/supabase/server";
import { can, requireAgency } from "@/lib/session";
import { RANK_LABEL, type Rank } from "@/lib/constants";
import { addNote, inviteTalent, refreshInstagram } from "../../actions";

export default async function CrmTalent({ params }: { params: Promise<{ id: string }> }) {
  const agency = await requireAgency();
  const { id } = await params;
  const supabase = await createClient();
  const { data: t } = await supabase.from("talent_profiles").select("*").eq("id", id).maybeSingle();
  if (!t) notFound();
  const [{ data: ig }, { data: contact }, { data: media }, { data: notes }, { data: intents }, { data: briefs }] = await Promise.all([
    supabase.from("social_accounts").select("*").eq("talent_id", id).eq("platform", "instagram").maybeSingle(),
    supabase.from("talent_contacts").select("*").eq("talent_id", id).maybeSingle(),
    supabase.from("talent_media").select("*").eq("talent_id", id),
    supabase.from("notes").select("id, body, created_at, profiles(full_name, email)").eq("talent_id", id).eq("org_id", agency.orgId).order("created_at", { ascending: false }),
    supabase.from("intents").select("id, stage, source, quoted_rate, agreed_rate, created_at, briefs(id, title)").eq("talent_id", id).eq("org_id", agency.orgId).order("created_at", { ascending: false }),
    supabase.from("briefs").select("id, title, status").eq("org_id", agency.orgId).in("status", ["draft", "open"]).order("created_at", { ascending: false }),
  ]);
  const { data: posts } = ig
    ? await supabase.from("social_posts").select("*").eq("account_id", ig.id).order("posted_at", { ascending: false }).limit(12)
    : { data: [] };
  const inBriefs = new Set((intents ?? []).map((i) => (i.briefs as unknown as { id: string } | null)?.id));
  const back = `/crm/talent/${id}`;

  return (
    <div className="space-y-6">
      <Link href="/crm/talent" className="text-sm text-mute hover:text-fog">← Talent pool</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.display_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-mute">
            <Badge value={t.rank} label={RANK_LABEL[t.rank as Rank]} />
            {t.status !== "approved" && <Badge value={t.status} />}
            <span>{t.city}</span>
            {t.gender && <span>· {t.gender}</span>}
            {t.rating && <span>· ★ {t.rating}</span>}
          </div>
        </div>
        {can(agency, "pipeline.manage") && (briefs?.length ?? 0) > 0 && (
          <form action={inviteTalent} className="flex gap-2">
            <input type="hidden" name="talent_id" value={t.id} />
            <input type="hidden" name="back" value={back} />
            <select name="brief_id" className="input w-60" required defaultValue="">
              <option value="" disabled>Add to brief…</option>
              {briefs!.filter((b) => !inBriefs.has(b.id)).map((b) => <option key={b.id} value={b.id}>{b.title} ({b.status})</option>)}
            </select>
            <button className="btn-primary">Add</button>
          </form>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {ig && (
            <IgCard acc={ig} action={
              <form action={refreshInstagram}>
                <input type="hidden" name="account_id" value={ig.id} /><input type="hidden" name="back" value={back} />
                <button className="btn-ghost py-1.5 text-xs">Refresh metrics</button>
              </form>
            } />
          )}
          {(posts?.length ?? 0) > 0 && (
            <div className="card p-5">
              <div className="mb-3 font-semibold">Recent posts</div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {posts!.map((p) => (
                  <a key={p.id} href={p.url ?? "#"} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden rounded-lg bg-ink-3">
                    {p.thumbnail_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgSrc(p.thumbnail_url)} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover opacity-90 group-hover:opacity-100" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1.5 py-1 text-[10px] tabular-nums">
                      ♥ {fmtNum(p.likes)} · 💬 {fmtNum(p.comments)}{p.views ? ` · ▶ ${fmtNum(p.views)}` : ""}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="card space-y-4 p-5 text-sm">
            {t.bio && <p className="whitespace-pre-line">{t.bio}</p>}
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="label">Categories</dt><dd>{t.categories.join(", ") || "—"}</dd></div>
              <div><dt className="label">Skills</dt><dd>{t.skills.join(", ") || "—"}</dd></div>
              <div><dt className="label">Languages</dt><dd>{t.languages.join(", ") || "—"}</dd></div>
              <div><dt className="label">Experience</dt><dd>{t.experience_years != null ? `${t.experience_years} yrs` : "—"}</dd></div>
              <div><dt className="label">Rates</dt><dd>
                {t.rate_per_post ? `Per post ${fmtINR(t.rate_per_post)} ` : ""}
                {t.rate_half_day ? `· Half day ${fmtINR(t.rate_half_day)} ` : ""}
                {t.rate_full_day ? `· Full day ${fmtINR(t.rate_full_day)}` : ""}
                {!t.rate_per_post && !t.rate_half_day && !t.rate_full_day ? "—" : ""}
                {t.rate_notes ? <div className="text-mute">{t.rate_notes}</div> : null}
              </dd></div>
              {t.experience_notes && <div className="sm:col-span-2"><dt className="label">Past work</dt><dd className="whitespace-pre-line">{t.experience_notes}</dd></div>}
            </dl>
            {(media?.length ?? 0) > 0 && (
              <div><div className="label">Portfolio</div>
                <ul className="space-y-1">{media!.map((m) => <li key={m.id}><a href={m.url} target="_blank" rel="noreferrer" className="break-all text-brand hover:underline">{m.url}</a></li>)}</ul>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5 text-sm">
            <div className="mb-2 font-semibold">Contact</div>
            {contact ? (
              <div className="space-y-1">
                <div>📧 <a href={`mailto:${contact.email}`} className="text-brand">{contact.email}</a></div>
                <div>📞 <a href={`tel:${contact.phone}`}>{contact.phone}</a></div>
                {contact.whatsapp && <div>💬 <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-brand">WhatsApp</a></div>}
              </div>
            ) : (
              <p className="text-mute">Contact details unlock once this talent responds to one of your briefs or you add them to a brief.</p>
            )}
            {ig?.public_email && <div className="mt-2 text-xs text-mute">Public email in bio: {ig.public_email}</div>}
          </div>

          <div className="card p-5 text-sm">
            <div className="mb-2 font-semibold">Briefs with your agency</div>
            {!intents?.length ? <p className="text-mute">None yet.</p> : (
              <ul className="space-y-2">
                {intents.map((i) => {
                  const b = i.briefs as unknown as { id: string; title: string } | null;
                  return (
                    <li key={i.id} className="flex items-center justify-between gap-2">
                      <Link href={`/crm/briefs/${b?.id}`} className="hover:text-brand">{b?.title}</Link>
                      <Badge value={i.stage} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="card p-5 text-sm">
            <div className="mb-2 font-semibold">Team notes <span className="text-xs font-normal text-mute">(private to {agency.orgName})</span></div>
            {can(agency, "note.write") && (
              <form action={addNote} className="mb-4 space-y-2">
                <input type="hidden" name="talent_id" value={t.id} />
                <textarea name="body" rows={3} className="input" placeholder="Call notes, rates discussed, reliability…" required />
                <button className="btn-ghost py-1.5">Add note</button>
              </form>
            )}
            {!notes?.length ? <Empty title="No notes yet" /> : (
              <ul className="space-y-3">
                {notes.map((n) => {
                  const a = n.profiles as unknown as { full_name: string | null; email: string } | null;
                  return (
                    <li key={n.id} className="border-l-2 border-brand/50 pl-3">
                      <p className="whitespace-pre-line">{n.body}</p>
                      <div className="mt-1 text-xs text-mute">{a?.full_name ?? a?.email} · {new Date(n.created_at).toLocaleString("en-IN")}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
