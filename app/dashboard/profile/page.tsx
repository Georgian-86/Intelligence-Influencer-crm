import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, GraduationCap, Lock, MapPin, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { InstagramIcon } from "@/components/brand/icons";
import { MediaTile, km } from "@/components/kit";
import { Photo } from "@/components/onboarding/preview-card";
import { StatsSync } from "@/components/creator/stats-sync";
import { AboutSection, ContactSection, PortfolioSection, RatesSection, ShareLink } from "@/components/creator/profile-sections";
import { SITE } from "@/lib/site";
import { getCreator } from "../_lib/data";
import { profileStrength, shortCollege } from "../_lib/score";

export default async function Profile({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const c = await getCreator();
  if (!c) redirect("/onboarding");
  const strength = profileStrength(c);
  const shareUrl = `${SITE.url}/c/${c.handle ?? c.id}`;

  return (
    <div className="space-y-6">
      {sp.saved && <p role="status" className="rounded-[14px] bg-ok-bg px-4 py-3 text-[14px] font-medium text-ok">Profile saved.</p>}

      {/* hero */}
      <section className="panel overflow-hidden p-0">
        <div className="grain relative h-36 overflow-hidden bg-night sm:h-44">
          <div aria-hidden className="absolute -left-10 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgb(43_75_255/.75),transparent)]" />
          <div aria-hidden className="absolute right-0 top-0 h-64 w-96 bg-[radial-gradient(closest-side,rgb(195_181_255/.35),transparent)]" />
          <div className="absolute right-4 top-4 flex gap-2 sm:right-6 sm:top-6">
            <span className="glass-night inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold text-white"><span className="h-1.5 w-1.5 rounded-full bg-mint" /> {strength.score}% complete</span>
          </div>
        </div>
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="rounded-full bg-surface p-1.5 shadow-md"><Photo url={c.photoUrl} name={c.name} size={104} /></div>
            <div className="flex gap-2">
              <ShareLink url={shareUrl} />
              <Link href="/dashboard/profile/edit" className="btn-ghost" aria-label="Edit all details"><SlidersHorizontal className="h-4 w-4" /><span className="hidden sm:inline">All details</span></Link>
            </div>
          </div>
          <h1 className="mt-4 font-display text-[34px] font-bold leading-none tracking-[-0.045em] sm:text-[44px]">{c.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px] text-ink-2">
            {c.handle && <a href={`https://www.instagram.com/${c.handle}/`} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1.5 font-medium hover:text-cobalt"><InstagramIcon className="h-4 w-4" />@{c.handle}</a>}
            {c.city && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-mute" />{c.city}</span>}
            {c.collegeName && <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-mute" />{shortCollege(c.collegeName)}{c.gradYear ? ` '${String(c.gradYear).slice(2)}` : ""}</span>}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {c.categories.map((n) => <span key={n} className="chip h-7 border-cobalt-100 bg-cobalt-50 px-3 text-cobalt-700">{n}</span>)}
            {c.interests.map((n) => <span key={n} className="chip h-7 px-3">{n}</span>)}
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-[18px] border border-line bg-line sm:grid-cols-5">
            {[
              ["Followers", km(c.followers)], ["Engagement", c.er != null ? `${c.er}%` : "—"], ["Avg views", km(c.avgViews)],
              ["Avg likes", km(c.avgLikes)], ["Posts", km(c.postsCount)],
            ].map(([k, v], i) => (
              <div key={k} className={`bg-surface px-4 py-3.5 ${i > 2 ? "hidden sm:block" : ""}`}>
                <dt className="text-[12px] text-mute">{k}</dt>
                <dd className="mt-0.5 font-display text-[24px] font-bold tracking-[-0.03em] tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section id="stats" className="scroll-mt-24">
            <StatsSync followers={c.followers} er={c.er} avgViews={c.avgViews} series={c.series} lastSyncedAt={c.lastSyncedAt} accountId={c.igAccountId} fetchStatus={c.fetchStatus} fetchError={c.fetchError} />
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="content-h">
            <div className="flex items-end justify-between">
              <div>
                <h2 id="content-h" className="font-display text-[18px] font-semibold tracking-[-0.02em]">Recent content</h2>
                <p className="mt-0.5 text-[13px] text-mute">Pulled from Instagram. Brands see your top 9.</p>
              </div>
            </div>
            {c.posts.length ? (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                {c.posts.slice(0, 9).map((p) => p.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={p.id} href={p.url ?? undefined} target="_blank" rel="noreferrer"><img src={p.thumb} alt={p.caption?.slice(0, 80) ?? "Instagram post"} className="aspect-[4/5] w-full rounded-[14px] object-cover" /></a>
                ) : <MediaTile key={p.id} hue={p.hue} type={p.type} views={p.views ?? undefined} />)}
              </div>
            ) : <p className="mt-4 rounded-[14px] bg-canvas px-4 py-6 text-center text-[14px] text-mute">Your posts appear here after the first Instagram sync.</p>}
          </section>

          <AboutSection init={{ bio: c.bio, city: c.city, categories: c.categories, languages: c.languages, gender: c.gender, dob: c.dob }} />
          <PortfolioSection init={c.portfolio} />
        </div>

        <div className="space-y-6">
          <section id="audience" className="card scroll-mt-24 overflow-hidden p-5 sm:p-6" aria-labelledby="aud-h">
            <div className="flex items-center justify-between gap-2">
              <h2 id="aud-h" className="font-display text-[18px] font-semibold tracking-[-0.02em]">Audience</h2>
              {c.verifiedInsights && <span className="inline-flex items-center gap-1 rounded-full bg-ok-bg px-2.5 py-1 text-[12px] font-semibold text-ok"><BadgeCheck className="h-3.5 w-3.5" /> Verified insights</span>}
            </div>
            {c.verifiedInsights && c.audience ? (
              <AudienceBars a={c.audience} />
            ) : (
              <div className="relative mt-4">
                <div aria-hidden className="pointer-events-none select-none opacity-40 blur-[3px]">
                  <AudienceBars a={c.audience ?? { age_18_24: 62, female: 58, top_cities: [{ city: "Mumbai", pct: 41 }, { city: "Pune", pct: 12 }, { city: "Delhi", pct: 7 }] }} />
                </div>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="mx-2 rounded-[18px] border border-line bg-surface/95 p-4 text-center shadow-md">
                    <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-cobalt-50 text-cobalt"><Lock className="h-4.5 w-4.5" /></span>
                    <div className="mt-2 text-[14.5px] font-semibold">Connect Instagram for verified insights</div>
                    <p className="mt-1 text-[12.5px] text-mute">Age, gender and city split. Verified creators rank higher in matching.</p>
                    <button type="button" disabled className="btn-primary btn-sm mt-3" title="Instagram Login ships in v2.3">Coming soon</button>
                  </div>
                </div>
              </div>
            )}
          </section>
          <RatesSection init={{ ratePerPost: c.ratePerPost, rateFullDay: c.rateFullDay, rateNotes: c.rateNotes }} />
          <ContactSection init={{ whatsapp: c.whatsapp, email: c.email }} />
          <p className="flex items-start gap-2 px-1 text-[12.5px] leading-relaxed text-mute">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> Brands see your public profile, stats and content. Your rates, phone and email stay with Vigor.
          </p>
        </div>
      </div>
    </div>
  );
}

function AudienceBars({ a }: { a: { age_18_24: number; female: number; top_cities: { city: string; pct: number }[] } }) {
  const rows = [{ k: "Age 18–24", v: a.age_18_24 }, { k: "Women", v: a.female }, ...a.top_cities.map((c) => ({ k: c.city, v: c.pct }))];
  return (
    <ul className="mt-4 space-y-3">
      {rows.map((r) => (
        <li key={r.k}>
          <div className="flex justify-between text-[13px]"><span className="text-ink-2">{r.k}</span><span className="font-semibold tabular-nums">{r.v}%</span></div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-canvas-2"><div className="h-full w-full origin-left rounded-full bg-cobalt" style={{ transform: `scaleX(${r.v / 100})` }} /></div>
        </li>
      ))}
    </ul>
  );
}
