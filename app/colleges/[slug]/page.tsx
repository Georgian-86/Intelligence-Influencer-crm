import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check, GraduationCap } from "lucide-react";
import { HeaderBar } from "@/components/landing/header-bar";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Faq, Serif } from "@/components/landing/sections";
import { JsonLd, breadcrumbs, faqPage } from "@/components/marketing/json-ld";
import { Breadcrumbs, CreatorTile, H2, StatRow } from "@/components/marketing/seo-blocks";
import { COLLEGES, campusKind, cityStats, collegeSlug, collegeStats, collegesIn, creatorsIn, fmtIN, getCollege } from "@/components/marketing/seo-data";
import { SITE } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => COLLEGES.map((c) => ({ slug: collegeSlug(c) }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getCollege((await params).slug);
  if (!c) return {};
  const s = collegeStats(c);
  const k = campusKind(c);
  const short = c.short ?? c.name;
  const title = `${short} creators & campus ambassadors — ${s.city.name}`;
  const description = `About ${s.creators} student creators from ${c.name}, ${s.city.name} (${k.kind}). Average engagement ${s.er}%. Hire ${short} campus ambassadors and creators, or join free with your Instagram handle.`;
  return {
    title, description,
    alternates: { canonical: `/colleges/${collegeSlug(c)}` },
    openGraph: { url: `/colleges/${collegeSlug(c)}`, title: `${title} · ${SITE.name}`, description, type: "website", locale: "en_IN" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CollegePage({ params }: Props) {
  const c = getCollege((await params).slug);
  if (!c) notFound();
  const s = collegeStats(c);
  const city = s.city;
  const k = campusKind(c);
  const short = c.short ?? c.name;
  const cs = cityStats(city);
  const nearby = creatorsIn(city).filter((x) => x.status === "approved" && x.college_id !== c.id).sort((a, b) => b.engagement_rate - a.engagement_rate);
  const creators = [...s.sample, ...nearby].slice(0, 3);
  const siblings = collegesIn(city).filter((x) => x.id !== c.id);

  const faqs = [
    { q: `Can ${short} students join Vigor Talent Network?`, a: `Yes. Sign up free with your Instagram handle, answer "yes" to "are you in college?" and pick ${c.name}. You unlock ambassador, fest and sampling briefs at ${short}.` },
    { q: `How many creators are at ${short}?`, a: `About ${s.creators} creators in the network list ${c.name} as their college, with an average engagement rate of ${s.er}%.` },
    { q: `Can brands target only ${short}?`, a: `Yes. Brands can target a single campus, a group of ${city.name} campuses or a graduating batch. Send a brief and Vigor shares a ${short} shortlist within one working day.` },
  ];

  const ld = [
    breadcrumbs(SITE.url, [{ name: "Home", path: "/" }, { name: `Creators in ${city.name}`, path: `/creators/${city.slug}` }, { name: short, path: `/colleges/${collegeSlug(c)}` }]),
    {
      "@context": "https://schema.org", "@type": "WebPage",
      name: `${short} creators & campus ambassadors`, url: `${SITE.url}/colleges/${collegeSlug(c)}`, inLanguage: "en-IN",
      isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
      about: {
        "@type": "CollegeOrUniversity", name: c.name, ...(c.short ? { alternateName: c.short } : {}),
        ...(c.domains?.[0] ? { url: `https://${c.domains[0]}` } : {}),
        address: { "@type": "PostalAddress", addressLocality: city.name, addressRegion: city.state, addressCountry: "IN" },
      },
    },
    faqPage(faqs),
  ];

  return (
    <>
      <JsonLd data={ld} />
      <HeaderBar />
      <main id="main" className="overflow-x-clip">
        <section className="grain relative isolate pb-16 pt-32 sm:pt-40" aria-labelledby="col-title">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-[-15%] top-[-20rem] h-[50rem] w-[50rem] rounded-full bg-[radial-gradient(closest-side,rgb(220_229_255/.95),transparent_70%)]" />
          </div>
          <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:gap-16">
            <div>
              <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: city.name, href: `/creators/${city.slug}` }, { name: short }]} />
              <h1 id="col-title" className="mt-6 font-display text-[clamp(3rem,6.6vw,5.5rem)] font-bold leading-[0.94] tracking-[-0.05em] text-ink">
                Creators at <Serif>{short}</Serif>
              </h1>
              <p className="mt-4 text-[15px] font-medium text-mute">{c.name} · {city.name}, {city.state}</p>
              <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-ink-2">
                A {k.kind} campus in {city.name}. {k.angle}
              </p>
            </div>
            <div className="rounded-[20px] bg-night p-6 text-white shadow-lg sm:p-8">
              <p className="text-[14px] text-white/70">Studying at {short}?</p>
              <p className="mt-2 font-display text-[28px] font-bold leading-[1.05] tracking-[-0.035em]">We ask one question: <em className="font-serif font-normal text-cobalt-300">are you in college?</em></p>
              <ul className="mt-5 space-y-2 text-[14.5px] text-white/85">
                {["Join with your Instagram handle", `Pick ${short} — unlock campus briefs`, "Get paid per campaign"].map((t) => (
                  <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-mint" aria-hidden />{t}</li>
                ))}
              </ul>
              <Link href="/register?type=influencer" className="btn-flame btn-lg group mt-7 w-full">Join from {short} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></Link>
            </div>
          </div>
          <div className="mx-auto mt-14 max-w-[1240px] px-5 sm:px-8">
            <StatRow stats={[
              { value: fmtIN(s.creators), label: `Creators at ${short}` },
              { value: `${s.er}%`, label: "Avg engagement" },
              { value: fmtIN(cs.creators), label: `Creators in ${city.name}` },
              { value: cs.campuses, label: `${city.name} campuses` },
            ]} />
          </div>
        </section>

        <section className="py-20 sm:py-24" aria-labelledby="mix-title">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <H2 id="mix-title">{s.sample.length ? `From ${short}` : `Near ${short}`}</H2>
                <p className="mt-4 max-w-xl text-[16px] text-ink-2">{s.sample.length ? "Creators who list this campus, with stats fetched from Instagram." : `Top ${city.name} creators on nearby campuses — a ${short} shortlist is built per brief.`}</p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium text-mute">Strong niches on this campus</h3>
                <ul className="mt-2 flex flex-wrap gap-2">{k.niches.map((n) => <li key={n} className="chip h-8 px-3 text-[13px]">{n}</li>)}</ul>
              </div>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{creators.map((x) => <CreatorTile key={x.id} c={x} />)}</ul>
          </div>
        </section>

        <section className="border-y border-line bg-surface/60 py-20 sm:py-24" aria-labelledby="sib-title">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <H2 id="sib-title">More {city.name} campuses</H2>
              <Link href={`/creators/${city.slug}`} className="inline-flex items-center gap-1 text-[15px] font-semibold text-cobalt hover:underline">All creators in {city.name} <ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
            </div>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {siblings.map((x) => (
                <li key={x.id}>
                  <Link href={`/colleges/${collegeSlug(x)}`} className="flex min-h-14 items-center gap-3 rounded-[20px] border border-line bg-surface px-4 py-3 transition-colors hover:border-cobalt-200">
                    <GraduationCap className="h-4 w-4 shrink-0 text-cobalt" aria-hidden /><span className="truncate text-[14.5px] font-medium text-ink">{x.short ?? x.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-20 sm:py-24" aria-labelledby="colfaq-title">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
            <div>
              <H2 id="colfaq-title">{short}, <Serif>answered</Serif>.</H2>
              <Link href="/brands" className="btn-dark btn-lg mt-8">Hire {short} creators</Link>
            </div>
            <Faq items={faqs} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
