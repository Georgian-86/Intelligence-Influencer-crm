import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeaderBar } from "@/components/landing/header-bar";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { AudienceSwitcher } from "@/components/landing/audience-switcher";
import { CampusMap, type MapCity } from "@/components/landing/campus-map";
import { Bento } from "@/components/landing/bento";
import { CaseStudies, Faq, FAQS, FinalCta, HowItWorks, Section, SectionHeading, Serif } from "@/components/landing/sections";
import { JsonLd, faqPage } from "@/components/marketing/json-ld";
import { CITY_INFO, cityStats, collegesIn, collegeSlug } from "@/components/marketing/seo-data";
import { SITE } from "@/lib/site";

const TITLE = "Vigor Talent Network — campus-first creators, college talent and event crews";
const DESC = "Join India's campus-first talent network by Vigor Launchpad. Sign up with your Instagram handle — we fetch your stats — and get matched to live brand campaigns. Brands get a verified shortlist in a day.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", title: TITLE, description: DESC, siteName: SITE.name, locale: "en_IN" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function Home() {
  const cities: MapCity[] = CITY_INFO.map((c) => {
    const s = cityStats(c);
    return {
      slug: c.slug, name: c.name, lat: c.lat, lng: c.lng, creators: s.creators, campuses: s.campuses,
      colleges: collegesIn(c).map((x) => ({ slug: collegeSlug(x), name: x.name, short: x.short })),
    };
  });

  const ld = [
    {
      "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE.url}/#org`,
      name: "Vigor Launchpad", alternateName: SITE.name, url: SITE.url, logo: `${SITE.url}/brand/vigor-mark.svg`,
      description: SITE.description,
      address: { "@type": "PostalAddress", addressLocality: "Mumbai", addressRegion: "Maharashtra", addressCountry: "IN" },
      areaServed: { "@type": "Country", name: "India" },
    },
    {
      "@context": "https://schema.org", "@type": "WebSite", "@id": `${SITE.url}/#website`,
      name: SITE.name, url: SITE.url, inLanguage: "en-IN", publisher: { "@id": `${SITE.url}/#org` },
    },
    faqPage(FAQS),
  ];

  return (
    <>
      <JsonLd data={ld} />
      <HeaderBar />
      <main id="main" className="overflow-x-clip">
        <Hero />
        <TrustStrip />

        <Section id="audiences" labelledBy="aud-title">
          <SectionHeading id="aud-title" kicker="One network, four ways in" title={<>Built for everyone who <Serif>makes</Serif> a campaign.</>}
            intro="Creators, college creators, event talent and brands each get their own path — and the same live data." />
          <AudienceSwitcher />
        </Section>

        <Section id="campuses" labelledBy="campus-title" className="bg-canvas-2/60">
          <SectionHeading id="campus-title" kicker="Campus map" title={<>We ask one question: <Serif>are you in college?</Serif></>}
            intro="Say yes, pick your campus, and you unlock fest, ambassador and sampling briefs at your college. Brands can target a city, a campus or a graduating batch."
          />
          <CampusMap cities={cities} />
        </Section>

        <Section id="how" labelledBy="how-title">
          <SectionHeading id="how-title" kicker="How it works" title={<>How a campaign <Serif>launches</Serif>.</>}
            intro="From a brand's brief to a shareable report. Vigor's team runs every step with you." />
          <HowItWorks />
        </Section>

        <Section id="features" labelledBy="feat-title" className="bg-canvas-2/60">
          <SectionHeading id="feat-title" kicker="Inside the platform" title={<>Less chasing. More <Serif>creating</Serif>.</>}
            action={<Link href="/join" className="btn-ghost btn-lg group self-start lg:self-auto">Create your profile <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></Link>} />
          <Bento />
        </Section>

        <Section id="results" labelledBy="results-title">
          <SectionHeading id="results-title" kicker="Results" title={<>Numbers first. <Serif>Always.</Serif></>}
            intro="Recent campaigns run through the network, tracked post by post." />
          <CaseStudies />
        </Section>

        <Section id="faq" labelledBy="faq-title" className="bg-canvas-2/60">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
            <div>
              <h2 id="faq-title" className="font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.04] tracking-[-0.04em] text-ink">Questions, <Serif>answered</Serif>.</h2>
              <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-mute">Still unsure? Brands can <Link href="/brands" className="font-semibold text-cobalt underline-offset-4 hover:underline">send a brief</Link> and we&apos;ll reply within one working day.</p>
            </div>
            <Faq />
          </div>
        </Section>

        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
