import Link from "next/link";
import { notFound } from "next/navigation";
import { clsx } from "clsx";
import { ArrowLeft, BadgeCheck, Check, CircleCheck, ExternalLink, GraduationCap, Lock, Mail, MapPin, Phone, RefreshCw, TriangleAlert, X } from "lucide-react";
import { Avatar, MediaTile, inr, km } from "@/components/kit";
import { AreaLine, Bullet, TableView } from "@/components/cockpit/charts";
import { ActionNotice, FlagChip, RANK_RUBRIC, RANK_TONE } from "@/components/admin/ui";
import { daysAgoLabel, getTalentReview } from "@/components/admin/data";
import { expectedEr } from "@/components/admin/flags";
import { requirePlatform } from "@/lib/session";
import { RANKS } from "@/lib/constants";
import { adminRefreshInstagram, reviewTalent } from "../../actions";

export const metadata = { title: "Review creator" };

const STATUS_TONE: Record<string, string> = { pending: "bg-warn-bg text-warn", screening: "bg-info-bg text-info", approved: "bg-ok-bg text-ok", rejected: "bg-bad-bg text-bad", suspended: "bg-bad-bg text-bad" };

export default async function AdminTalent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string; demo?: string }> }) {
  await requirePlatform();
  const { id } = await params;
  const sp = await searchParams;
  const t = await getTalentReview(id);
  if (!t) notFound();
  const back = `/admin/talent/${id}`;
  const ig = t.ig;
  const exp = ig?.followers ? expectedEr(ig.followers) : null;
  const growthPct = t.growth.length > 1 ? Math.round(((t.growth.at(-1)! - t.growth[0]) / t.growth[0]) * 100) : null;

  return (
    <>
      <Link href={`/admin?status=${t.status}`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-mute hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Screening queue</Link>
      <header className="mb-6 flex flex-wrap items-start gap-4">
        <Avatar name={t.name} hue={t.hue} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.035em]">{t.name}</h1>
            <span className={clsx("rounded-full px-2.5 py-0.5 text-[12px] font-semibold capitalize", STATUS_TONE[t.status])}>{t.status}</span>
            <span className={clsx("rounded-full px-2.5 py-0.5 text-[12px] font-semibold capitalize", RANK_TONE[t.rank])}>{t.rank}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[13.5px] text-mute">
            {ig && <span className="font-medium text-ink-2">@{ig.handle}</span>}
            {t.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{t.city}</span>}
            <span>{t.kinds.join(" + ")}</span>
            <span>Signed up {daysAgoLabel(t.joined).toLowerCase()}{t.source ? ` via ${t.source.toLowerCase()}` : ""}</span>
          </div>
        </div>
        {ig && <a href={`https://www.instagram.com/${ig.handle}/`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">Open Instagram <ExternalLink className="h-3.5 w-3.5" /></a>}
      </header>

      <ActionNotice sp={sp} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          {t.flags.length > 0 && (
            <section aria-label="Auto-flags" className="grid gap-2 sm:grid-cols-2">
              {t.flags.map((f) => <FlagChip key={f.key} flag={f} withDetail />)}
            </section>
          )}

          {/* Instagram evidence */}
          <section aria-labelledby="ig" className="card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 id="ig" className="flex items-center gap-2 text-[16px] font-semibold">
                Instagram evidence
                {ig?.verified && <span className="inline-flex items-center gap-1 text-[12px] font-medium text-info"><BadgeCheck className="h-3.5 w-3.5" /> Verified insights</span>}
              </h2>
              {ig && (
                <form action={adminRefreshInstagram} className="flex items-center gap-2 text-[12px] text-mute">
                  {ig.last_fetched_at && <span>Fetched {daysAgoLabel(ig.last_fetched_at).toLowerCase()}</span>}
                  <input type="hidden" name="account_id" value={ig.id ?? ""} /><input type="hidden" name="back" value={back} />
                  <button className="btn-ghost btn-sm"><RefreshCw className="h-3.5 w-3.5" /> Refetch</button>
                </form>
              )}
            </div>
            {!ig ? <p className="text-[14px] text-mute">No Instagram account linked. Event talent may skip this; ask for a showreel instead.</p> : (
              <>
                <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-[16px] border border-line bg-line sm:grid-cols-6">
                  {[["Followers", km(ig.followers)], ["Following", km(ig.following)], ["Posts", km(ig.posts)], ["Avg likes", km(ig.avg_likes)], ["Avg comments", km(ig.avg_comments)], ["Avg views", km(ig.avg_views)]].map(([l, v]) => (
                    <div key={l} className="bg-surface px-3 py-3"><dt className="text-[11.5px] text-mute">{l}</dt><dd className="mt-0.5 font-display text-[19px] font-bold tabular-nums">{v}</dd></div>
                  ))}
                </dl>
                {ig.er != null && exp != null && (
                  <div className="mt-5">
                    <div className="mb-2 flex items-baseline justify-between text-[13px]"><span className="text-ink-2">Engagement rate vs typical for {km(ig.followers)} followers</span><span className="font-display text-[22px] font-bold tabular-nums">{ig.er}%</span></div>
                    <Bullet label="Engagement rate" value={ig.er} target={exp} format="pct" targetLabel="Typical" max={Math.max(ig.er, exp) * 1.6} />
                  </div>
                )}
                <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-baseline justify-between text-[13px]"><span className="font-medium text-ink-2">Followers, last {t.growth.length} weeks</span>{growthPct != null && <span className={clsx("font-semibold tabular-nums", growthPct > 60 ? "text-bad" : "text-ink")}>{growthPct > 0 ? "+" : ""}{growthPct}%{growthPct > 60 && " spike"}</span>}</div>
                    {t.growth.length > 1 ? <>
                      <AreaLine data={t.growth.map((v, i) => ({ label: `W${i + 1}`, value: v }))} format="km" height={160} ariaLabel="Follower growth by week" />
                      <TableView columns={["Week", "Followers"]} rows={t.growth.map((v, i) => [`W${i + 1}`, v.toLocaleString("en-IN")])} />
                    </> : <p className="text-[13px] text-mute">Growth appears after two weekly snapshots.</p>}
                  </div>
                  <div>
                    <div className="mb-2 text-[13px] font-medium text-ink-2">Recent posts</div>
                    {t.recent.length ? <div className="grid grid-cols-3 gap-2">{t.recent.map((p) => <MediaTile key={p.id} hue={p.hue} type={p.type} views={p.views ?? undefined} />)}</div> : <p className="text-[13px] text-mute">No posts fetched yet.</p>}
                  </div>
                </div>
                {ig.biography && <p className="mt-5 rounded-[14px] bg-canvas px-4 py-3 text-[13.5px] text-ink-2"><span className="font-medium text-ink">Bio:</span> {ig.biography}</p>}
              </>
            )}
          </section>

          {/* College claim */}
          <section aria-labelledby="college" className="card p-6">
            <h2 id="college" className="mb-4 flex items-center gap-2 text-[16px] font-semibold"><GraduationCap className="h-4 w-4" /> College claim</h2>
            {!t.college ? <p className="text-[14px] text-mute">Not in college, or not claimed. Nothing to verify.</p> : (
              <dl className="grid gap-4 sm:grid-cols-3">
                <div><dt className="text-[12.5px] text-mute">Claimed</dt><dd className="mt-0.5 font-medium">{t.college.name}{t.college.grad_year && <span className="text-mute"> · class of {t.college.grad_year}</span>}</dd></div>
                <div>
                  <dt className="text-[12.5px] text-mute">Email domain</dt>
                  <dd className="mt-0.5">
                    <span className="font-medium">{t.college.email?.split("@")[1] ?? "—"}</span>
                    <span className={clsx("mt-1 flex items-center gap-1 text-[12.5px] font-medium", t.college.matches ? "text-ok" : "text-warn")}>
                      {t.college.matches ? <><CircleCheck className="h-3.5 w-3.5" /> Matches college domain</> : <><TriangleAlert className="h-3.5 w-3.5" /> Expected {t.college.domains[0] ?? "a college domain"}</>}
                    </span>
                  </dd>
                </div>
                <div><dt className="text-[12.5px] text-mute">Student ID</dt><dd className={clsx("mt-0.5 flex items-center gap-1 font-medium", t.college.id_uploaded ? "text-ok" : "text-mute")}>{t.college.id_uploaded ? <><CircleCheck className="h-4 w-4" /> Uploaded</> : <><X className="h-4 w-4" /> Not uploaded</>}</dd></div>
              </dl>
            )}
          </section>

          {/* Profile */}
          <section aria-labelledby="profile" className="card p-6">
            <h2 id="profile" className="mb-4 text-[16px] font-semibold">Profile</h2>
            <dl className="grid gap-x-6 gap-y-4 text-[14px] sm:grid-cols-2">
              <div><dt className="text-[12.5px] text-mute">Categories</dt><dd className="mt-1 flex flex-wrap gap-1.5">{t.categories.length ? t.categories.map((c) => <span key={c} className="chip">{c}</span>) : "—"}</dd></div>
              <div><dt className="text-[12.5px] text-mute">Skills</dt><dd className="mt-1">{t.skills.join(", ") || "—"}</dd></div>
              <div><dt className="text-[12.5px] text-mute">Languages</dt><dd className="mt-1">{t.languages.join(", ") || "—"}</dd></div>
              <div><dt className="text-[12.5px] text-mute">Rates</dt><dd className="mt-1 tabular-nums">Post {inr(t.rates.post)} · Full day {inr(t.rates.full)}</dd></div>
              <div className="sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-[12.5px] text-mute"><Lock className="h-3 w-3" /> Contact, platform team only (never shown to brands)</dt>
                <dd className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
                  <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-mute" />{t.contact.email ?? "—"}</span>
                  <span className="inline-flex items-center gap-1.5 tabular-nums"><Phone className="h-3.5 w-3.5 text-mute" />{t.contact.phone ?? "—"}</span>
                  <span className="text-mute">Consent to share: {t.consent ? "yes" : "no"}</span>
                </dd>
              </div>
              {t.media.length > 0 && <div className="sm:col-span-2"><dt className="text-[12.5px] text-mute">Portfolio</dt><dd className="mt-1 space-y-1">{t.media.map((m) => <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="block break-all text-cobalt hover:underline">{m.title ?? m.url}</a>)}</dd></div>}
            </dl>
          </section>
        </div>

        {/* Decision panel */}
        <form action={reviewTalent} className="card h-fit space-y-6 p-6 lg:sticky lg:top-20">
          <input type="hidden" name="id" value={t.id} />
          <h2 className="text-[16px] font-semibold">Decision</h2>
          <fieldset>
            <legend className="label">Status</legend>
            <div className="grid grid-cols-3 gap-2">
              {[["approved", "Approve", Check], ["screening", "Screening", RefreshCw], ["rejected", "Reject", X]].map(([v, l, I]) => {
                const Icon = I as typeof Check;
                return (
                  <label key={v as string} className="cursor-pointer">
                    <input type="radio" name="status" value={v as string} defaultChecked={t.status === v || (t.status === "pending" && v === "approved")} className="peer sr-only" />
                    <span className="flex h-16 flex-col items-center justify-center gap-1 rounded-[14px] border border-line text-[13px] font-semibold text-ink-2 transition-colors peer-checked:border-cobalt peer-checked:bg-cobalt-50 peer-checked:text-cobalt-700 peer-focus-visible:ring-2 peer-focus-visible:ring-cobalt">
                      <Icon className="h-4 w-4" />{l as string}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Rank</legend>
            <div className="space-y-2">
              {RANKS.map((r) => (
                <label key={r} className="block cursor-pointer">
                  <input type="radio" name="rank" value={r} defaultChecked={t.rank === r} className="peer sr-only" />
                  <span className="flex items-center gap-3 rounded-[14px] border border-line px-3 py-2.5 transition-colors peer-checked:border-cobalt peer-checked:bg-cobalt-50 peer-focus-visible:ring-2 peer-focus-visible:ring-cobalt">
                    <span className={clsx("w-20 shrink-0 rounded-full px-2 py-0.5 text-center text-[12px] font-semibold capitalize", RANK_TONE[r])}>{r}</span>
                    <span className="text-[12.5px] text-mute">{RANK_RUBRIC[r]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="label">Rating (1–5)</span><input name="rating" type="number" step="0.1" min="1" max="5" defaultValue={t.rating ?? ""} className="input" /></label>
            <label className="block"><span className="label">Reliability (0–100)</span><input name="reliability_score" type="number" min="0" max="100" defaultValue={t.reliability ?? ""} className="input" /></label>
          </div>
          <label className="block"><span className="label">Screening notes</span><textarea name="review_notes" rows={3} defaultValue={t.notes ?? ""} className="textarea" placeholder="What you checked, interview notes, follow-ups" /></label>
          <button className="btn-primary btn-lg w-full">Save decision</button>
          {t.reviewed_at && <p className="text-center text-[12px] text-mute">Last reviewed {new Date(t.reviewed_at).toLocaleString("en-IN")}</p>}
        </form>
      </div>
    </>
  );
}
