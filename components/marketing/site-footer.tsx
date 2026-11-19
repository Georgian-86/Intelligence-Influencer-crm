import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { CITY_INFO, collegesIn, collegeSlug } from "@/components/marketing/seo-data";

const PRODUCT = [
  { href: "/join", label: "Join the network" },
  { href: "/register?type=influencer", label: "Creator sign-up" },
  { href: "/register?type=event", label: "Event talent sign-up" },
  { href: "/brands", label: "Hire talent" },
  { href: "/#how", label: "How a campaign launches" },
  { href: "/login", label: "Log in" },
];

/** Rich footer on a night band: SEO links to every city page and the top campuses per city. */
export function SiteFooter() {
  const topCampuses = CITY_INFO.slice(0, 6).flatMap((c) => collegesIn(c).slice(0, 2));
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-night text-white">
      <div className="mx-auto max-w-[1240px] px-5 pb-10 pt-16 sm:px-8 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-sm">
            <Logo tone="light" />
            <p className="mt-5 text-[15px] leading-relaxed text-white/70">
              The campus-first talent network by Vigor Launchpad, a youth and college marketing agency from Mumbai.
              Creators, college creators and event talent — matched to live brand campaigns.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/join" className="btn bg-white text-night hover:bg-ice">Join free</Link>
              <Link href="/brands" className="btn border border-white/20 text-white hover:border-white/45">Send a brief</Link>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            <FooterCol title="Network">
              {PRODUCT.map((l) => <FooterLink key={l.href} href={l.href}>{l.label}</FooterLink>)}
            </FooterCol>
            <FooterCol title="Creators by city">
              {CITY_INFO.map((c) => <FooterLink key={c.slug} href={`/creators/${c.slug}`}>Creators in {c.name}</FooterLink>)}
            </FooterCol>
            <FooterCol title="Campuses">
              {topCampuses.map((c) => <FooterLink key={c.id} href={`/colleges/${collegeSlug(c)}`}>{c.short ?? c.name}</FooterLink>)}
            </FooterCol>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-6 text-[13px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Vigor Launchpad. Made in Mumbai.</p>
          <p>Instagram metrics are fetched from public profile data and refreshed regularly.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-[14px] font-semibold tracking-[-0.01em] text-white">{title}</h2>
      <ul className="mt-4 space-y-1">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="inline-flex min-h-8 items-center text-[14px] text-white/65 transition-colors hover:text-white">
        {children}
      </Link>
    </li>
  );
}
