import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Heart, Lock, MessageCircle, Mail, MapPin, Phone, RefreshCw, Star } from "lucide-react";
import { Avatar, MediaTile, Panel, Sparkline, km } from "@/components/kit";
import { InstagramIcon, WhatsAppIcon } from "@/components/brand/icons";
import { NotesPanel } from "@/components/crm/notes-panel";
import { RankBadge, StagePill } from "@/components/crm/ui";
import { BarList } from "@/components/crm/charts";
import { ago, shortDate } from "@/components/crm/format";
import { can, requireAgency } from "@/lib/session";
import { isDemo } from "@/lib/demo";
import { inviteTalent, refreshInstagram } from "../../actions";
import { crmNow, getTalentDetail, listOpenBriefs } from "../../_lib/data";

const WA_TEMPLATES = [
  { label: "Send brief", text: (n: string) => `Hi ${n}! Vigor here 👋 We have a paid brief that fits your content. Can I share details?` },
  { label: "Ask rate card", text: (n: string) => `Hi ${n}, could you share your current rate card for Reels + Stories?` },
  { label: "Request draft", text: (n: string) => `Hi ${n}, gentle reminder — please upload your draft to the review link today 🙏` },
  { label: "Payment update", text: (n: string) => `Hi ${n}, your payment has been processed and should reflect in 2–3 working days.` },
];

export default async function Creator360({ params }: { params: Promise<{ id: string }> }) {
  const agency = await requireAgency();
  const { id } = await params;
  const [t, briefs] = await Promise.all([getTalentDetail(id, agency.orgId), listOpenBriefs(agency.orgId)]);
  if (!t) notFound();
  const now = crmNow();
  const demo = isDemo();
  const r = t.row;
  const first = r.name.split(" ")[0];
  const wa = t.contact?.whatsapp?.replace(/\D/g, "");
  const g = r.growth.length > 4 ? ((r.growth.at(-1)! - r.growth.at(-5)!) / r.growth.at(-5)!) * 100 : null;
  const inBriefs = new Set(t.history.map((h) => h.briefId));
  const addable = briefs.filter((b) => !inBriefs.has(b.id));
  const back = `/crm/talent/${id}`;
  const stats: [string, string, string?][] = [
    ["Followers", km(r.followers), g != null ? `+${g.toFixed(1)}% in 4 weeks` : undefined],
    ["Engagement", r.er != null ? `${r.er.toFixed(2)}%` : "—", r.er != null ? (r.er >= 5 ? "Above tier median" : "Around tier median") : undefined],
    ["Avg views", km(r.avgViews), r.avgLikes != null ? `${km(r.avgLikes)} avg likes` : undefined],
    ["Rate per post", r.rate ? `₹${r.rate.toLocaleString("en-IN")}` : "—", t.rateDay ? `₹${t.rateDay.toLocaleString("en-IN")} full day` : undefined],
    ["Reliability", t.reliability != null ? `${t.reliability}` : "—", r.rating ? `★ ${r.rating} avg rating` : undefined],
  ];

  return (
    <div className="space-y-6">
      <Link href="/crm/talent" className="inline-flex h-7 items-center gap-1.5 text-[13px] font-medium text-mute hover:text-ink">← Talent</Link>

      {/* hero */}
      <section className="card relative overflow-hidden">
        <div className="h-24 sm:h-28" style={{ background: `linear-gradient(120deg, hsl(${r.hue} 80% 86%), hsl(${(r.hue + 40) % 360} 70% 74%) 55%, hsl(${(r.hue + 80) % 360} 60% 62%))` }} aria-hidden />
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 px-5 pb-5 sm:px-6">
          <div className="-mt-12 rounded-full bg-surface p-1 shadow-sm"><Avatar name={r.name} hue={r.hue} size={88} /></div>
          <div className="min-w-0 flex-1 pt-3">
            <h1 className="flex items-center gap-2 text-[24px] leading-tight sm:text-[26px]">
              {r.name}{r.verified && <BadgeCheck className="h-6 w-6 text-cobalt" aria-label="Verified insights" />}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-mute">
              {r.handle && <a href={t.igUrl ?? "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-ink-2 hover:text-cobalt"><InstagramIcon className="h-3.5 w-3.5" />@{r.handle}</a>}
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.city ?? "—"}</span>
              {r.college && <span>{r.college}</span>}
              {r.rating && <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-gold text-gold" />{r.rating}</span>}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <RankBadge rank={r.rank} />
              <span className="chip"><span className={`h-1.5 w-1.5 rounded-full ${r.availability === "available" ? "bg-ok" : r.availability === "busy" ? "bg-warn" : "bg-faint"}`} />{r.availability === "available" ? "Available" : r.availability === "busy" ? "Busy this week" : "Away"}</span>
              {r.categories.map((c) => <span key={c} className="chip">{c}</span>)}
              {r.event && <span className="chip">Event talent</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(WA_TEMPLATES[0].text(first))}`} target="_blank" rel="noreferrer" className="btn-ghost"><WhatsAppIcon className="h-4 w-4 text-[#128C4B]" /> WhatsApp</a>}
            {can(agency, "pipeline.manage") && addable.length > 0 && (
              <form action={inviteTalent} className="flex gap-2">
                <input type="hidden" name="talent_id" value={r.id} /><input type="hidden" name="back" value={back} />
                <label className="sr-only" htmlFor="brief-pick">Brief</label>
                <select id="brief-pick" name="brief_id" required defaultValue={addable[0].id} className="input h-11 w-56 rounded-full text-[14px]">
                  {addable.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
                <button className="btn-primary">Add to brief</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(([l, v, h]) => (
          <div key={l} className="card p-4">
            <div className="text-[12.5px] font-medium text-mute">{l}</div>
            <div className="mt-1 font-display text-[24px] font-semibold tabular-nums tracking-[-0.03em]">{v}</div>
            {h && <div className="mt-0.5 text-[12px] text-mute">{h}</div>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Follower growth" subtitle="Weekly, last 12 weeks">
              {r.growth.length > 1 ? (
                <>
                  <Sparkline data={r.growth} className="h-28" height={112} />
                  <div className="mt-2 flex justify-between text-[12px] tabular-nums text-mute"><span>{km(r.growth[0])}</span><span className="font-semibold text-ink">{km(r.growth.at(-1))}</span></div>
                </>
              ) : <p className="text-[13px] text-mute">Growth appears after two weekly snapshots.</p>}
              {t.lastFetched && (
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[12px] text-mute">
                  <span>Synced {ago(t.lastFetched, now)} ago</span>
                  {t.igId && (
                    <form action={refreshInstagram}><input type="hidden" name="account_id" value={t.igId} /><input type="hidden" name="back" value={back} />
                      <button className="inline-flex items-center gap-1 font-semibold text-cobalt hover:text-cobalt-700"><RefreshCw className="h-3 w-3" /> Refresh</button>
                    </form>
                  )}
                </div>
              )}
            </Panel>
            <Panel title="Audience" subtitle={r.verified ? "From creator-authorised Instagram insights" : "Estimated from public data"}>
              {t.audience ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-[12px] bg-canvas px-3 py-2.5"><div className="text-[11.5px] text-mute">Aged 18–24</div><div className="font-display text-[20px] font-semibold tabular-nums">{t.audience.age_18_24}%</div></div>
                    <div className="rounded-[12px] bg-canvas px-3 py-2.5"><div className="text-[11.5px] text-mute">Women</div><div className="font-display text-[20px] font-semibold tabular-nums">{t.audience.female}%</div></div>
                  </div>
                  <BarList items={t.audience.top_cities.map((c) => ({ label: c.city, value: c.pct }))} format={(n) => `${n}%`} />
                </div>
              ) : <p className="text-[13px] text-mute">Audience splits unlock when the creator connects Instagram insights.</p>}
            </Panel>
          </div>

          <Panel title="Recent content" subtitle={t.posts ? `${t.posts.toLocaleString("en-IN")} posts on Instagram` : undefined}>
            {t.content.length === 0 ? <p className="text-[13px] text-mute">No posts synced yet.</p> : (
              <ul className="grid grid-cols-3 gap-2 sm:gap-3">
                {t.content.map((p) => (
                  <li key={p.id}>
                    <a href={p.url ?? t.igUrl ?? "#"} target="_blank" rel="noreferrer" className="block" title={p.caption ?? undefined}>
                      {p.thumb
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.thumb} alt="" referrerPolicy="no-referrer" className="aspect-[4/5] w-full rounded-[14px] object-cover" />
                        : <MediaTile hue={p.hue} type={p.type} views={p.views ?? undefined} />}
                    </a>
                    <div className="mt-1.5 flex gap-2 text-[11.5px] tabular-nums text-mute"><span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{km(p.likes)}</span><span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{km(p.comments)}</span></div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Campaign history" subtitle="Briefs with your agency" bodyClass="px-0 pb-0">
            {t.history.length === 0 ? <p className="px-5 pb-5 text-[13px] text-mute">Not in any of your briefs yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-[13.5px] [&_td]:border-t [&_td]:border-line [&_td]:px-5 [&_td]:py-3 [&_th]:bg-canvas-2/70 [&_th]:px-5 [&_th]:py-2 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-mute">
                  <thead><tr><th>Brief</th><th>Stage</th><th className="!text-right">Fee</th><th className="!text-right">Updated</th></tr></thead>
                  <tbody>
                    {t.history.map((h) => (
                      <tr key={h.id}>
                        <td><Link href={`/crm/briefs/${h.briefId}`} className="font-semibold hover:text-cobalt-700">{h.brief}</Link><div className="text-[12px] text-mute">{h.campaign}</div></td>
                        <td><StagePill stage={h.stage} /></td>
                        <td className="text-right tabular-nums">{h.agreed ? `₹${h.agreed.toLocaleString("en-IN")}` : <span className="text-mute">quoted ₹{(h.quoted ?? 0).toLocaleString("en-IN")}</span>}</td>
                        <td className="text-right tabular-nums text-mute">{shortDate(h.at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <aside className="min-w-0 space-y-6 lg:col-span-4">
          <Panel title="Contact">
            {t.contact ? (
              <ul className="space-y-2.5 text-[14px]">
                {t.contact.phone && <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-mute" /><a href={`tel:${t.contact.phone}`} className="tabular-nums hover:text-cobalt">{t.contact.phone}</a></li>}
                {t.contact.email && <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-mute" /><a href={`mailto:${t.contact.email}`} className="truncate hover:text-cobalt">{t.contact.email}</a></li>}
              </ul>
            ) : (
              <div className="flex gap-3 rounded-[14px] bg-canvas p-3">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-mute" />
                <p className="text-[13px] text-ink-2">Phone and email unlock once {first} responds to one of your briefs or you add them to one.</p>
              </div>
            )}
            {wa && (
              <div className="mt-4 border-t border-line pt-4">
                <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-2"><WhatsAppIcon className="h-4 w-4 text-[#128C4B]" /> Quick WhatsApp</div>
                <div className="grid grid-cols-2 gap-2">
                  {WA_TEMPLATES.map((w) => (
                    <a key={w.label} href={`https://wa.me/${wa}?text=${encodeURIComponent(w.text(first))}`} target="_blank" rel="noreferrer"
                      className="flex h-10 items-center justify-center rounded-[12px] border border-line text-[13px] font-medium text-ink-2 transition-colors hover:border-[#128C4B]/40 hover:bg-[#e4f6ea] hover:text-[#0d6b3a]">{w.label}</a>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Profile">
            <dl className="space-y-3 text-[13.5px]">
              {t.bio && <div><dt className="text-[12px] text-mute">Bio</dt><dd className="mt-0.5 text-ink-2">{t.bio}</dd></div>}
              <div><dt className="text-[12px] text-mute">Languages</dt><dd className="mt-0.5 text-ink-2">{t.languages.join(", ") || "—"}</dd></div>
              {t.skills.length > 0 && <div><dt className="text-[12px] text-mute">Event skills</dt><dd className="mt-0.5 text-ink-2">{t.skills.join(", ")}</dd></div>}
              <div><dt className="text-[12px] text-mute">Following · Posts</dt><dd className="mt-0.5 tabular-nums text-ink-2">{km(t.following)} · {km(t.posts)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Team notes" subtitle={`Private to ${agency.orgName}`}>
            <NotesPanel talentId={r.id} notes={t.notes} demo={demo} now={now} canWrite={can(agency, "note.write")} me={demo ? "Kunal Shah" : "You"} />
          </Panel>
        </aside>
      </div>
    </div>
  );
}
