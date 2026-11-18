import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { CITIES, EVENT_CATEGORY_GROUPS } from "@/lib/constants";

const highlights = [
  { t: "Register once", d: "Build one verified profile. Influencers connect Instagram and we pull followers and engagement automatically." },
  { t: "See live briefs", d: "Brands and agencies post campaigns. You see the ones that fit you and raise your hand in one tap." },
  { t: "Get picked faster", d: "Our team reviews interest, shortlists and reaches out — no endless DMs and WhatsApp forwards." },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:pt-24">
            <span className="chip border-brand/40 text-brand">Influencers · Event talent · Brands</span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              India&apos;s talent network for <span className="text-brand">campaigns, events</span> &amp; experiences.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-mute sm:text-lg">
              One verified pool of creators, promoters, hosts, performers and crew — matched to live brand
              campaigns by the Vigor team.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/join" className="btn-primary px-6 py-3 text-base">I&apos;m an individual — join</Link>
              <Link href="/brands" className="btn-ghost px-6 py-3 text-base">I&apos;m a brand — find talent</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 sm:grid-cols-3">
          {highlights.map((h, i) => (
            <div key={h.t} className="card p-5">
              <div className="text-sm font-bold text-brand">0{i + 1}</div>
              <div className="mt-2 font-semibold">{h.t}</div>
              <p className="mt-1 text-sm text-mute">{h.d}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-xl font-bold">Who&apos;s in the network</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="card p-4">
              <div className="font-semibold text-brand">Influencers</div>
              <p className="mt-1 text-sm text-mute">Nano to mega creators across niches and cities.</p>
            </div>
            {Object.entries(EVENT_CATEGORY_GROUPS).map(([group, items]) => (
              <div key={group} className="card p-4">
                <div className="font-semibold text-brand">{group}</div>
                <p className="mt-1 text-sm text-mute">{items.slice(0, 5).join(", ")} and more.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <h2 className="text-xl font-bold">Cities we operate in</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CITIES.map((c) => <span key={c} className="chip px-3 py-1 text-sm">{c}</span>)}
          </div>
        </section>
      </main>
      <footer className="border-t border-line py-8 text-center text-xs text-mute">
        © {new Date().getFullYear()} Vigor Talent Network · A Vigor Launchpad initiative
      </footer>
    </>
  );
}
