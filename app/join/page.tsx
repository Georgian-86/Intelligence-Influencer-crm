import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Check, Mic, Music, Star, Users, Wrench } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { InstagramIcon } from "@/components/brand/icons";
import { Reveal } from "@/components/motion/reveal";
import { ChoiceCard } from "@/components/marketing/choice-card";

export const metadata: Metadata = {
  title: "Join the network",
  description: "Join Vigor Talent Network as a creator or as event talent — one profile, matched to live brand campaigns across India.",
  alternates: { canonical: "/join" },
};

export default function JoinPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative overflow-x-clip">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] overflow-hidden">
          <div className="absolute left-1/2 top-[-16rem] h-[34rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_106_26/0.2),transparent)]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6 sm:pt-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-2">Join Vigor Talent Network</span>
            <h1 className="mt-3 text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-fog sm:text-[3.4rem]">
              How do you want to join?
            </h1>
            <p className="mt-4 text-pretty text-base text-mute sm:text-lg">
              Pick the profile that fits you best. You can add the other role later — it&apos;s one account either way.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <Reveal delay={0.05} className="h-full">
              <ChoiceCard
                href="/register?type=influencer"
                eyebrow="Creators"
                title="Influencer / content creator"
                desc="Instagram creators of every size, including college creators."
                perks={["Followers and engagement fetched for you", "Only briefs that match your niche and city", "Status updates on WhatsApp"]}
                cta="Continue as creator"
                preview={<CreatorPreview />}
              />
            </Reveal>
            <Reveal delay={0.12} className="h-full">
              <ChoiceCard
                href="/register?type=event"
                eyebrow="Event talent"
                title="Promoter, host, artist or crew"
                desc="On-ground talent for activations, college fests, launches and events."
                perks={["Gigs in your city", "Ranks from Bronze to Platinum", "Ratings that bring rebookings"]}
                cta="Continue as event talent"
                preview={<EventPreview />}
              />
            </Reveal>
          </div>

          <Reveal delay={0.18}>
            <Link
              href="/brands"
              className="group mt-5 flex min-h-16 items-center gap-4 rounded-2xl border border-line bg-ink-2/60 px-5 py-4 transition-[border-color,background-color] duration-200 hover:border-line-2 hover:bg-ink-3/60"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line-2 bg-ink-3 text-brand-2">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-fog">Hiring talent for a brand or agency?</span>
                <span className="block text-sm text-mute">Send us your requirement and get a curated shortlist.</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-mute transition-transform duration-200 group-hover:translate-x-1 group-hover:text-fog" aria-hidden="true" />
            </Link>
          </Reveal>

          <p className="mt-8 text-center text-sm text-mute">
            Already have a profile?{" "}
            <Link href="/login" className="font-semibold text-brand-2 underline-offset-4 hover:underline">Log in</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function CreatorPreview() {
  return (
    <div className="w-[15.5rem] rounded-2xl border border-white/10 bg-ink-2/95 p-3.5 shadow-[0_24px_48px_-20px_rgb(0_0_0/0.9)]">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-2 to-[#e1306c] p-[2px]">
          <span className="grid h-full w-full place-items-center rounded-full bg-ink-3 text-[11px] font-bold text-fog">YOU</span>
        </span>
        <span className="min-w-0 leading-tight">
          <span className="flex items-center gap-1 text-[13px] font-semibold text-fog">@yourhandle <BadgeCheck className="h-3.5 w-3.5 text-info" aria-hidden="true" /></span>
          <span className="block text-[11px] text-mute">Your niche · Your campus</span>
        </span>
        <InstagramIcon className="ml-auto h-4 w-4 text-mute" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {[["Followers", "auto"], ["ER", "auto"], ["Reach", "auto"]].map(([k, v]) => (
          <span key={k} className="rounded-lg bg-ink-3 px-2 py-1.5">
            <span className="block text-[9px] uppercase tracking-wider text-mute">{k}</span>
            <span className="block text-[12px] font-semibold text-ok">{v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function EventPreview() {
  const roles = [
    { icon: Users, label: "Promoter" },
    { icon: Mic, label: "Host" },
    { icon: Music, label: "DJ" },
    { icon: Wrench, label: "Crew" },
  ];
  return (
    <div className="w-[15.5rem] rounded-2xl border border-white/10 bg-ink-2/95 p-3.5 shadow-[0_24px_48px_-20px_rgb(0_0_0/0.9)]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-fog">Your roles</span>
        <span className="flex items-center gap-1 rounded-full border border-gold/50 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">
          <Star className="h-3 w-3 fill-gold" aria-hidden="true" /> Rank up
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {roles.map(({ icon: Icon, label }, i) => (
          <span key={label} className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[12px] font-medium ${i < 2 ? "border-brand/50 bg-brand/10 text-fog" : "border-line text-mute"}`}>
            {i < 2 ? <Check className="h-3.5 w-3.5 text-brand" aria-hidden="true" /> : <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
