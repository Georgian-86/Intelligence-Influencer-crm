import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, GraduationCap, Lock, MapPin, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { InstagramIcon } from "@/components/brand/icons";
import { MediaTile } from "@/components/kit";
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
      {sp.saved && <p role="status" className="rounded-[12px] bg-ok-bg px-4 py-3 text-[14px] font-medium text-ok">Profile saved.</p>}

      {/* header */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Photo url={c.photoUrl} name={c.name} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-[24px] leading-tight sm:text-[26px]">{c.name}</h1>
              <span className="inline-flex h-6 items-center gap-1.5 rounded-[6px] bg-canvas-2 px-2 text-[12px] font-medium text-ink-2"><span className="h-1.5 w-1.5 rounded-full bg-ok" />{strength.score}% complete</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-ink-2">
              {c.handle && <a href={`https://www.instagram.com/${c.handle}/`} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1.5 hover:text-cobalt"><InstagramIcon className="h-4 w-4" />@{c.handle}</a>}
              {c.city && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-mute" />{c.city}</span>}
              {c.collegeName && <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-mute" />{shortCollege(c.collegeName)}{c.gradYear ? ` '${String(c.gradYear).slice(2)}` : ""}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.categories.map((n) => <span key={n} className="chip border-cobalt-100 bg-cobalt-50 text-cobalt-700">{n}</span>)}
              {c.interests.map((n) => <span key={n} className="chip">{n}</span>)}
            </div>
          </div>
          <div className="flex gap-2">
            <ShareLink url={shareUrl} />
            <Link href="/dashboard/profile/edit" className="btn-ghost" aria-label="Edit all details"><SlidersHorizontal className="h-4 w-4" /><span className="hidden sm:inline">Edit details</span></Link>
          </div>
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
                <h2 id="content-h" className="text-[16px]">Recent content</h2>
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
                  <div className="mx-2 rounded-[14px] border border-line bg-surface/95 p-4 text-center shadow-md">
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
