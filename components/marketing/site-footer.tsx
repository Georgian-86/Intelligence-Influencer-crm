import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { CITIES } from "@/lib/constants";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Talent",
    links: [
      { href: "/register?type=influencer", label: "Join as a creator" },
      { href: "/register?type=event", label: "Join as event talent" },
      { href: "/join", label: "Choose how to join" },
      { href: "/login", label: "Log in" },
    ],
  },
  {
    title: "Brands",
    links: [
      { href: "/brands", label: "Hire talent" },
      { href: "/#how", label: "How a campaign runs" },
      { href: "/#campuses", label: "The college graph" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,0.7fr))_minmax(0,1.1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mute">
            India&apos;s talent network for college creators, influencers and event talent — matched to
            brand campaigns and run end to end.
          </p>
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={`${c.title} links`}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-fog">{c.title}</h2>
            <ul className="mt-3">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-10 items-center text-sm text-mute transition-colors hover:text-fog">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-fog">Launch cities</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 text-sm text-mute">
            {CITIES.map((c) => <li key={c} className="flex min-h-10 items-center">{c}</li>)}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-mute sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} Vigor Talent Network</span>
          <span>by Vigor Launchpad · Mumbai</span>
        </div>
      </div>
    </footer>
  );
}
