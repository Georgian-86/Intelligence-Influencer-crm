import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, Heart, IndianRupee, Lock, Mail, MapPin, MessageCircle, NotebookPen, Phone, Play, RefreshCw, Star, UserRound } from "lucide-react";
import { Badge, fmtINR, fmtNum, imgSrc } from "@/components/ui";
import { IgCard } from "@/components/ig-card";
import { WhatsAppIcon } from "@/components/brand/icons";
import { Avatar, BackLink, Meta, Panel, TagList } from "@/components/crm/primitives";
import { fmtEr, timeAgo } from "@/components/crm/format";
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
  const addable = (briefs ?? []).filter((b) => !inBriefs.has(b.id));
  const back = `/crm/talent/${id}`;
  const rates = [
    t.rate_per_post && ["Per post", t.rate_per_post],
    t.rate_half_day && ["Half day", t.rate_half_day],
    t.rate_full_day && ["Full day", t.rate_full_day],
  ].filter(Boolean) as [string, number][];

  return (
    <div className="space-y-6">
      <BackLink href="/crm/talent">Talent pool</BackLink>

      {/* Profile header */}
      <section className="card relative overflow-hidden p-5 sm:p-6">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start gap-4 sm:gap-5">
          <Avatar src={ig?.profile_pic_url} name={t.display_name} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{t.display_name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mute">
              {ig && <a href={`https://www.instagram.com/${ig.handle}/`} target="_blank" rel="noreferrer" className="hover:text-brand">@{ig.handle}</a>}
              {t.city && <span className="inline-flex items-center gap-1"><MapPin aria-hidden className="h-3.5 w-3.5" />{t.city}</span>}
              {t.gender && <span className="inline-flex items-center gap-1 capitalize"><UserRound aria-hidden className="h-3.5 w-3.5" />{t.gender}</span>}
              {t.rating && <span className="inline-flex items-center gap-1"><Star aria-hidden className="h-3.5 w-3.5 text-gold" />{t.rating}</span>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge value={t.rank} label={RANK_LABEL[t.rank as Rank]} />
              {t.status !== "approved" && <Badge value={t.status} />}
              {t.is_influencer && <span className="chip text-mute">Influencer</span>}
              {t.is_event_talent && <span className="chip text-mute">Event talent</span>}
            </div>
          </div>

          {can(agency, "pipeline.manage") && addable.length > 0 && (
            <form action={inviteTalent} className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <input type="hidden" name="talent_id" value={t.id} />
              <input type="hidden" name="back" value={back} />
              <label htmlFor="add-brief" className="sr-only">Add to brief</label>
              <select id="add-brief" name="brief_id" className="input sm:w-64" required defaultValue="">
                <option value="" disabled>Add to brief…</option>
                {addable.map((b) => <option key={b.id} value={b.id}>{b.title} ({b.status})</option>)}
              </select>
              <button className="btn-primary"><Briefcase aria-hidden className="h-4 w-4" /> Shortlist</button>
            </form>
          )}
        </div>

        {/* Quick stats */}
        <dl className="relative mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
          {[
            ["Followers", fmtNum(ig?.followers)],
            ["Engagement", fmtEr(ig?.engagement_rate)],
            ["Avg likes", fmtNum(ig?.avg_likes)],
            ["From", rates.length ? fmtINR(Math.min(...rates.map((r) => r[1]))) : "—"],
          ].map(([l, v]) => (
            <div key={l} className="bg-ink-2 px-4 py-3">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-mute">{l}</dt>
              <dd className="mt-0.5 font-display text-xl font-bold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          {ig && (
            <IgCard acc={ig} action={
              <form action={refreshInstagram}>
                <input type="hidden" name="account_id" value={ig.id} /><input type="hidden" name="back" value={back} />
                <button className="btn-ghost min-h-9 py-1.5 text-xs"><RefreshCw aria-hidden className="h-3.5 w-3.5" /> Refresh</button>
              </form>
            } />
          )}

          {(posts?.length ?? 0) > 0 && (
            <Panel title="Recent posts">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
                {posts!.map((p) => (
                  <a key={p.id} href={p.url ?? "#"} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden rounded-lg bg-ink-3">
                    {p.thumbnail_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgSrc(p.thumbnail_url)} alt="" referrerPolicy="no-referrer" loading="lazy" className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/85 to-transparent px-1.5 pb-1 pt-4 text-[10px] tabular-nums">
                      <span className="inline-flex items-center gap-0.5"><Heart aria-hidden className="h-3 w-3" />{fmtNum(p.likes)}</span>
                      <span className="inline-flex items-center gap-0.5"><MessageCircle aria-hidden className="h-3 w-3" />{fmtNum(p.comments)}</span>
                      {p.views ? <span className="inline-flex items-center gap-0.5"><Play aria-hidden className="h-3 w-3" />{fmtNum(p.views)}</span> : null}
                    </div>
                  </a>
                ))}
              </div>
            </Panel>
          )}

          <Panel title="Profile">
            {t.bio && <p className="mb-5 whitespace-pre-line text-sm leading-relaxed">{t.bio}</p>}
            <dl className="grid gap-5 sm:grid-cols-2">
              <Meta label="Categories"><TagList items={t.categories} /></Meta>
              <Meta label="Skills"><TagList items={t.skills} /></Meta>
              <Meta label="Languages">{t.languages.join(", ") || "—"}</Meta>
              <Meta label="Experience">{t.experience_years != null ? `${t.experience_years} yrs` : "—"}</Meta>
              <Meta label="Rates" className="sm:col-span-2">
                {rates.length ? (
                  <div className="flex flex-wrap gap-2">
                    {rates.map(([l, v]) => (
                      <span key={l} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink px-2.5 py-1">
                        <IndianRupee aria-hidden className="h-3.5 w-3.5 text-mute" /><span className="text-mute">{l}</span> <span className="font-semibold tabular-nums">{fmtINR(v)}</span>
                      </span>
                    ))}
                  </div>
                ) : "—"}
                {t.rate_notes ? <div className="mt-2 text-mute">{t.rate_notes}</div> : null}
              </Meta>
              {t.experience_notes && <Meta label="Past work" className="sm:col-span-2"><span className="whitespace-pre-line">{t.experience_notes}</span></Meta>}
              {(media?.length ?? 0) > 0 && (
                <Meta label="Portfolio" className="sm:col-span-2">
                  <ul className="space-y-1">{media!.map((m) => <li key={m.id}><a href={m.url} target="_blank" rel="noreferrer" className="break-all text-brand hover:underline">{m.url}</a></li>)}</ul>
                </Meta>
              )}
            </dl>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Contact" icon={contact ? <Mail className="h-4 w-4" /> : <Lock className="h-4 w-4" />}>
            {contact ? (
              <ul className="space-y-1 text-sm">
                {contact.email && <li><a href={`mailto:${contact.email}`} className="flex min-h-10 items-center gap-2.5 rounded-lg px-2 hover:bg-ink-3"><Mail aria-hidden className="h-4 w-4 text-mute" /><span className="truncate text-brand">{contact.email}</span></a></li>}
                {contact.phone && <li><a href={`tel:${contact.phone}`} className="flex min-h-10 items-center gap-2.5 rounded-lg px-2 hover:bg-ink-3"><Phone aria-hidden className="h-4 w-4 text-mute" />{contact.phone}</a></li>}
                {contact.whatsapp && <li><a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex min-h-10 items-center gap-2.5 rounded-lg px-2 hover:bg-ink-3"><WhatsAppIcon className="h-4 w-4 text-ok" /><span className="text-brand">WhatsApp</span></a></li>}
              </ul>
            ) : (
              <p className="text-sm text-mute">Contact details unlock once this talent responds to one of your briefs or you add them to a brief.</p>
            )}
            {ig?.public_email && <div className="mt-3 border-t border-line pt-3 text-xs text-mute">Public email in bio: {ig.public_email}</div>}
          </Panel>

          <Panel title="Briefs with your agency" icon={<Briefcase className="h-4 w-4" />} bodyClassName={intents?.length ? "p-0 sm:p-0" : undefined}>
            {!intents?.length ? <p className="text-sm text-mute">Not in any of your briefs yet.</p> : (
              <ul className="divide-y divide-line text-sm">
                {intents.map((i) => {
                  const b = i.briefs as unknown as { id: string; title: string } | null;
                  return (
                    <li key={i.id}>
                      <Link href={`/crm/briefs/${b?.id}`} className="flex min-h-12 items-center justify-between gap-2 px-4 py-2 hover:bg-ink-3/40 sm:px-5">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{b?.title}</span>
                          <span className="block text-xs text-mute">{i.agreed_rate ? `Agreed ${fmtINR(i.agreed_rate)}` : i.quoted_rate ? `Quoted ${fmtINR(i.quoted_rate)}` : i.source === "invited" ? "Invited" : "Applied"}</span>
                        </span>
                        <Badge value={i.stage} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title={<>Team notes <span className="font-normal text-mute">· private to {agency.orgName}</span></>} icon={<NotebookPen className="h-4 w-4" />}>
            {can(agency, "note.write") && (
              <form action={addNote} className="mb-4 space-y-2">
                <input type="hidden" name="talent_id" value={t.id} />
                <label htmlFor="note-body" className="sr-only">New note</label>
                <textarea id="note-body" name="body" rows={3} className="input text-sm" placeholder="Call notes, rates discussed, reliability…" required />
                <button className="btn-ghost min-h-9 py-1.5">Add note</button>
              </form>
            )}
            {!notes?.length ? <p className="text-sm text-mute">No notes yet.</p> : (
              <ul className="space-y-4">
                {notes.map((n) => {
                  const a = n.profiles as unknown as { full_name: string | null; email: string } | null;
                  return (
                    <li key={n.id} className="border-l-2 border-brand/50 pl-3 text-sm">
                      <p className="whitespace-pre-line">{n.body}</p>
                      <div className="mt-1 text-xs text-mute">{a?.full_name ?? a?.email} · <time dateTime={n.created_at} title={new Date(n.created_at).toLocaleString("en-IN")}>{timeAgo(n.created_at)}</time></div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
