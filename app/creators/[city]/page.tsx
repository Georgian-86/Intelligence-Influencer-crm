import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, GraduationCap, Languages } from "lucide-react";
import { HeaderBar } from "@/components/landing/header-bar";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Faq, Serif } from "@/components/landing/sections";
import { JsonLd, breadcrumbs, faqPage } from "@/components/marketing/json-ld";
import { Breadcrumbs, CreatorTile, H2, StatRow } from "@/components/marketing/seo-blocks";
import { CITY_INFO, cityStats, collegesIn, collegeSlug, fmtIN, getCity } from "@/components/marketing/seo-data";
import { compact } from "@/components/kit";
import { SITE } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => CITY_INFO.map((c) => ({ city: c.slug }));

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCity((await params).city);
  if (!city) return {};
  const s = cityStats(city);
  const title = `Instagram creators & college influencers in ${city.name}`;
  const description = `Hire from ${fmtIN(s.creators)}+ creators across ${s.campuses} campuses in ${city.name}. Average engagement ${s.er}%. ${city.niches.slice(0, 3).join(", ")} creators, campus ambassadors and event talent — verified by Vigor Launchpad.`;
  return {
    title, description,
    alternates: { canonical: `/creators/${city.slug}` },
    openGraph: { url: `/creators/${city.slug}`, title: `${title} · ${SITE.name}`, description, type: "website", locale: "en_IN" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CityPage({ params }: Props) {
  const city = getCity((await params).city);
  if (!city) notFound();
  const s = cityStats(city);
  const colleges = collegesIn(city);
  const featured = [...s.sample].filter((c) => c.status === "approved").sort((a, b) => b.engagement_rate - a.engagement_rate).slice(0, 6);
  const others = CITY_INFO.filter((c) => c.slug !== city.slug);

  const faqs = [
    { q: `How many creators are there in ${city.name}?`, a: `Vigor Talent Network has about ${fmtIN(s.creators)} creators and event talent in ${city.name}, across ${s.campuses} campuses. Around ${s.inCollege}% are currently in college.` },
    { q: `What kind of creators work best in ${city.name}?`, a: `${city.name} is strongest in ${city.niches.join(", ")} content, in ${city.languages.join(", ")}. ${city.scene}` },
    { q: `How do I hire creators in ${city.name}?`, a: `Send a brief with your goal, budget and dates. Vigor's team shares a shortlist of ${city.name} creators on a review link within one working day, then runs briefing, content review and tracking.` },
    { q: `I'm a creator in ${city.name}. How do I join?`, a: `Sign up free with your Instagram handle — we fetch your followers and engagement automatically. Tell us your college to unlock campus briefs in ${city.name}.` },
  ];

  const ld = [
    breadcrumbs(SITE.url, [{ name: "Home", path: "/" }, { name: "Creators", path: "/join" }, { name: city.name, path: `/creators/${city.slug}` }]),
    {
      "@context": "https://schema.org", "@type": "CollectionPage",
      name: `Creators in ${city.name}`, url: `${SITE.url}/creators/${city.slug}`, inLanguage: "en-IN",
      about: { "@type": "City", name: city.name, containedInPlace: { "@type": "State", name: city.state } },
      isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
      mainEntity: {
        "@type": "ItemList", numberOfItems: colleges.length,
        itemListElement: colleges.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: `${SITE.url}/colleges/${collegeSlug(c)}` })),
      },
    },
    faqPage(faqs),
  ];

  return (
    <>
      <JsonLd data={ld} />
      <HeaderBar />
      <main id="main" className="overflow-x-clip">
        <section className="grain relative isolate pb-16 pt-32 sm:pt-40" aria-labelledby="city-title">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute right-[-15%] top-[-20rem] h-[50rem] w-[50rem] rounded-full bg-[radial-gradient(closest-side,rgb(220_229_255/.95),transparent_70%)]" />
          </div>
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Creators", href: "/join" }, { name: city.name }]} />
            <h1 id="city-title" className="mt-6 max-w-5xl font-display text-[clamp(3rem,7vw,6rem)] font-bold leading-[0.94] tracking-[-0.05em] text-ink">
              Creators in <Serif>{city.name}</Serif>
            </h1>
            <p className="mt-6 max-w-2xl text-[18px] leading-relaxed text-ink-2">{city.intro}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/brands" className="btn-primary btn-lg group">Hire creators in {city.name} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></Link>
              <Link href="/register?type=influencer" className="btn-ghost btn-lg">I&apos;m a creator here</Link>
            </div>
            <div className="mt-14">
              <StatRow stats={[
                { value: fmtIN(s.creators), label: "Creators & talent" },
                { value: s.campuses, label: "Campuses" },
                { value: `${s.er}%`, label: "Avg engagement" },
                { value: `${s.inCollege}%`, label: "Currently in college" },
              ]} />
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24" aria-labelledby="featured-title">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <H2 id="featured-title">Featured {city.name} creators</H2>
              <p className="max-w-sm text-[14px] text-mute">Stats fetched from public Instagram profiles. Ranked by engagement.</p>
            </div>
            {featured.length ? (
              <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((c) => <CreatorTile key={c.id} c={c} />)}
              </ul>
            ) : (
              <div className="mt-10 rounded-[28px] border border-dashed border-line-2 bg-surface/60 p-10 text-center">
                <p className="font-display text-[22px] font-semibold tracking-[-0.02em] text-ink">Be one of the first featured creators in {city.name}.</p>
                <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-2">Profiles go live here once our team verifies them — usually within 48 hours of sign-up.</p>
                <Link href="/register?type=influencer" className="btn-primary mt-6">Join with your handle</Link>
              </div>
            )}
          </div>
        </section>

        <section className="border-y border-line bg-surface/60 py-20 sm:py-24" aria-labelledby="scene-title">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <H2 id="scene-title">The {city.name} <Serif>scene</Serif></H2>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">{city.scene}</p>
              <div className="mt-8">
                <h3 className="text-[14px] font-semibold text-ink">Strongest niches</h3>
                <ul className="mt-3 flex flex-wrap gap-2">{city.niches.map((n) => <li key={n} className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-4 text-[14px] font-medium text-ink-2">{n}</li>)}</ul>
              </div>
              <p className="mt-6 flex items-center gap-2 text-[14px] text-ink-2"><Languages className="h-4 w-4 text-cobalt" aria-hidden /> Content in {city.languages.join(", ")}</p>
              <p className="mt-2 text-[14px] text-ink-2">About {s.events}% of {city.name} profiles also take event gigs — promoters, hosts, DJs and crew.</p>
            </div>
            <div>
              <h3 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-ink">Campaigns run here</h3>
              {s.campaigns.length ? (
                <ul className="mt-5 space-y-3">
                  {s.campaigns.map((k) => (
                    <li key={k.id} className="flex items-center justify-between gap-4 rounded-[20px] border border-line bg-surface p-4">
                      <div className="min-w-0"><div className="truncate text-[15px] font-semibold text-ink">{k.name}</div><div className="text-[13px] text-mute">{k.brand_name} · {k.cities.join(", ")}</div></div>
                      <div className="shrink-0 text-right"><div className="font-display text-[20px] font-bold tabular-nums text-ink">{k.views ? compact(k.views) : "—"}</div><div className="text-[12px] text-mute">{k.views ? "views" : "launching soon"}</div></div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 rounded-[20px] border border-line bg-surface p-5 text-[15px] text-ink-2">No public case studies in {city.name} yet. Brands launching here get our pilot onboarding — <Link href="/brands" className="font-semibold text-cobalt hover:underline">send a brief</Link>.</p>
              )}
            </div>
          </div>
        </section>

        <section id="campuses" className="py-20 sm:py-24" aria-labelledby="campus-title">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <H2 id="campus-title">Campuses in {city.name}</H2>
            <p className="mt-4 max-w-xl text-[16px] text-ink-2">Target one campus or a whole city. Each campus page shows its creator mix.</p>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {colleges.map((c) => (
                <li key={c.id}>
                  <Link href={`/colleges/${collegeSlug(c)}`} className="group flex min-h-16 items-center gap-3 rounded-[20px] border border-line bg-surface px-4 py-3 transition-[border-color,transform] duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-cobalt-200">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cobalt-50 text-cobalt"><GraduationCap className="h-5 w-5" aria-hidden /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold text-ink">{c.short ?? c.name}</span><span className="block truncate text-[13px] text-mute">{c.name}</span></span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-mute transition-colors group-hover:text-cobalt" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-canvas-2/60 py-20 sm:py-24" aria-labelledby="cityfaq-title">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
            <div>
              <H2 id="cityfaq-title">{city.name}, <Serif>answered</Serif>.</H2>
              <h3 className="mt-10 text-[14px] font-semibold text-ink">Creators in other cities</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {others.map((o) => <li key={o.slug}><Link href={`/creators/${o.slug}`} className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-4 text-[14px] font-medium text-ink-2 hover:border-line-2 hover:text-ink">{o.name}</Link></li>)}
              </ul>
            </div>
            <Faq items={faqs} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
