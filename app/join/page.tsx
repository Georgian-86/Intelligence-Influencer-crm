import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Check, GraduationCap, Mic, Music, Star, Users, Wrench } from "lucide-react";
import { HeaderBar } from "@/components/landing/header-bar";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ChoiceCard } from "@/components/marketing/choice-card";
import { JsonLd, breadcrumbs } from "@/components/marketing/json-ld";
import { Avatar } from "@/components/kit";
import { InstagramIcon } from "@/components/brand/icons";
import { PLATFORM_STATS } from "@/lib/demo/fixtures";
import { SITE } from "@/lib/site";

const TITLE = "Join free — creators, college creators, event talent and brands";
const DESC = "Pick your path into Vigor Talent Network: sign up as a creator with just your Instagram handle, join as event talent, or hire talent as a brand.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/join" },
  openGraph: { url: "/join", title: `${TITLE} · ${SITE.name}`, description: DESC, type: "website", locale: "en_IN" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function JoinPage() {
  return (
    <>
      <JsonLd data={breadcrumbs(SITE.url, [{ name: "Home", path: "/" }, { name: "Join", path: "/join" }])} />
      <HeaderBar />
      <main id="main" className="grain relative isolate overflow-x-clip">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-20rem] h-[50rem] w-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(220_229_255/.95),transparent_70%)]" />
        </div>

        <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-[14px] font-medium text-cobalt"><span className="h-1.5 w-1.5 rounded-full bg-cobalt" aria-hidden />Join {PLATFORM_STATS.creators.toLocaleString("en-IN")} creators and crews</p>
            <h1 className="mt-4 font-display text-[clamp(3rem,7.4vw,6.5rem)] font-bold leading-[0.92] tracking-[-0.05em] text-ink">
              Pick your <em className="font-serif font-normal tracking-[-0.02em] text-cobalt">launchpad</em>.
            </h1>
            <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-ink-2">
              One account, whichever way you come in. You can add another role later — a creator can also take event gigs.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            <ChoiceCard
              featured
              href="/register?type=influencer"
              kicker="Creators & college creators"
              title="I create content"
              desc="Instagram creators of every size — nano to mega, on campus or off."
              perks={["Sign up with your @handle; we fetch the stats", "Briefs matched to your niche, city and campus", "Track reviews, go-lives and payouts"]}
              cta="Join as a creator"
              preview={<CreatorPreview />}
            />
            <ChoiceCard
              href="/register?type=event"
              kicker="Event talent"
              title="I work events"
              desc="Promoters, hosts, DJs, dancers, comics, crew and specialty performers."
              perks={["Paid gigs at fests, launches and activations", "Confirmations and call sheets on WhatsApp", "Ranks from Bronze to Platinum"]}
              cta="Join as event talent"
              preview={<EventPreview />}
            />
            <ChoiceCard
              href="/register?type=brand"
              kicker="Brands & agencies"
              title="I hire talent"
              desc="Creators and on-ground teams for launches, sampling and campus campaigns."
              perks={["A verified shortlist within one working day", "Approve creators and content from your phone", "One report: reach, views, cost per view"]}
              cta="Create a brand account"
              preview={<BrandPreview />}
            />
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-[28px] border border-line bg-surface/70 p-6 sm:flex-row sm:items-center sm:p-7">
            <p className="text-[15px] text-ink-2">
              <b className="font-semibold text-ink">Just want to talk?</b> Brands can send a brief without an account.{" "}
              <Link href="/brands" className="font-semibold text-cobalt underline-offset-4 hover:underline">Send a brief</Link>
            </p>
            <p className="text-[15px] text-ink-2">
              Already joined? <Link href="/login" className="font-semibold text-cobalt underline-offset-4 hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function CreatorPreview() {
  return (
    <div className="w-[17rem] rounded-[20px] bg-surface p-4 text-ink shadow-lg">
      <div className="flex h-10 items-center gap-2 rounded-xl border border-line bg-canvas px-3 text-[13px]">
        <InstagramIcon className="h-4 w-4 text-ink-2" /><span className="text-mute">instagram.com/</span><b>yourhandle</b>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {[["Followers", "48.2K"], ["ER", "6.4%"], ["Views", "61K"]].map(([k, v]) => (
          <span key={k} className="rounded-lg bg-canvas px-2 py-1.5"><span className="block text-[10.5px] text-mute">{k}</span><span className="block font-display text-[14px] font-bold">{v}</span></span>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium text-ok"><BadgeCheck className="h-3.5 w-3.5" /> Filled in automatically</div>
    </div>
  );
}

function EventPreview() {
  const roles = [{ icon: Users, label: "Promoter" }, { icon: Mic, label: "Host" }, { icon: Music, label: "DJ" }, { icon: Wrench, label: "Crew" }];
  return (
    <div className="w-[17rem] rounded-[20px] bg-surface p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink">Your roles</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#fbf1d6] px-2 py-0.5 text-[11px] font-semibold text-gold"><Star className="h-3 w-3 fill-gold" /> Gold</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {roles.map(({ icon: Icon, label }, i) => (
          <span key={label} className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] font-medium ${i < 2 ? "border-cobalt bg-cobalt-50 text-cobalt" : "border-line text-ink-2"}`}>
            {i < 2 ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}{label}
          </span>
        ))}
      </div>
    </div>
  );
}

function BrandPreview() {
  return (
    <div className="w-[17rem] rounded-[20px] bg-surface p-4 shadow-lg">
      <div className="text-[12px] text-mute">Shortlist ready</div>
      <div className="text-[14px] font-semibold text-ink">12 creators · Mumbai + Pune</div>
      <div className="mt-3 flex items-center justify-between">
        <span className="flex -space-x-2">{([["Riya Shah", 12], ["Arjun Nair", 200], ["Meher Kapoor", 280], ["Dev Joshi", 40], ["Tara Bose", 150]] as const).map(([n, h]) => <Avatar key={n} name={n} hue={h} size={30} ring />)}</span>
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-cobalt"><GraduationCap className="h-3.5 w-3.5" /> 8 campuses</span>
      </div>
    </div>
  );
}
