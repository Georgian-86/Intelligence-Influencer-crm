import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarCheck2, Star } from "lucide-react";
import { Avatar, AvatarStack, km } from "@/components/kit";
import { Hero3D } from "@/components/three/hero-3d";
import { HandleDemo, type DemoProfile } from "@/components/landing/handle-demo";
import { CREATORS, ME, PLATFORM_STATS } from "@/lib/demo/fixtures";

const PROFILES: DemoProfile[] = [
  { handle: ME.handle, name: ME.display_name, hue: ME.hue, followers: ME.followers, er: ME.engagement_rate, views: ME.avg_views, college: "NMIMS '27", city: ME.city, growth: ME.growth.map((g, i) => g * (ME.followers / ME.growth[11]) * (0.98 + i * 0.002)) },
  ...CREATORS.filter((c) => c.in_college && c.followers > 20_000 && c.followers < 400_000).slice(0, 2).map((c) => ({
    handle: c.handle, name: c.display_name, hue: c.hue, followers: c.followers, er: c.engagement_rate, views: c.avg_views,
    college: `${(c.college_name ?? "").split(",")[0].replace(/^SVKM's /, "")} '${String(c.grad_year ?? 2027).slice(2)}`, city: c.city, growth: c.growth,
  })),
];

const FLOATERS = CREATORS.filter((c) => c.status === "approved" && c.followers > 30_000).slice(0, 2);

export function Hero() {
  const [a, b] = FLOATERS;
  return (
    <section className="grain relative isolate overflow-hidden pb-16 pt-28 sm:pt-32 lg:pb-24 lg:pt-36" aria-labelledby="hero-title">
      {/* atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-[-10%] h-[56rem] w-[56rem] rounded-full bg-[radial-gradient(closest-side,rgb(220_229_255/.95),rgb(220_229_255/0)_70%)]" />
        <div className="absolute bottom-[-30%] left-[-15%] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(closest-side,rgb(195_181_255/.28),transparent_70%)]" />
      </div>

      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Link href="/#how" className="group relative z-10 inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface/80 pl-2 pr-3.5 text-[13px] font-medium text-ink-2 shadow-xs backdrop-blur transition-colors hover:border-line-2">
          <span className="relative grid h-5 w-5 place-items-center">
            <span className="absolute h-2 w-2 animate-ping rounded-full bg-flame/60" />
            <span className="h-2 w-2 rounded-full bg-flame" />
          </span>
          {PLATFORM_STATS.briefs_live} brand briefs matching right now
          <ArrowRight className="h-3.5 w-3.5 text-mute transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>

        <h1 id="hero-title" className="relative z-10 mt-7 font-display text-[clamp(3.5rem,8.4vw,7.6rem)] font-bold leading-[0.92] tracking-[-0.05em] text-ink">
          Talent that{" "}
          <span className="font-serif text-[1.1em] font-normal italic tracking-[-0.025em] text-cobalt">launches</span>
          <br className="hidden sm:block" /> campaigns.
        </h1>
      </div>

      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-0">
        <div className="relative z-10">
          <p className="mt-7 max-w-[500px] text-pretty text-[17px] leading-[1.6] text-ink-2 sm:text-[18px]">
            The campus-first creator network by Vigor Launchpad. Sign up with your Instagram handle —
            we fetch your followers, engagement and reach, so you never send a screenshot again.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/register?type=influencer" className="btn-primary btn-lg group">
              Join as a creator <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link href="/brands" className="btn-ghost btn-lg">I&apos;m a brand</Link>
          </div>
          <p className="mt-4 text-[13px] text-mute">Free for creators and event talent. About 2 minutes to sign up.</p>

          <div className="mt-12 flex items-center gap-4 border-t border-line pt-6 lg:mt-16">
            <AvatarStack people={CREATORS.slice(3, 8).map((c) => ({ name: c.display_name, hue: c.hue }))} size={36} max={5} />
            <p className="text-[14px] leading-snug text-ink-2">
              <b className="font-semibold text-ink">{PLATFORM_STATS.signups_week.at(-1)} creators</b> joined this week,<br className="hidden sm:block" /> from {PLATFORM_STATS.campuses} campuses.
            </p>
          </div>
        </div>

        {/* visual: WebGL object + floating cards + live demo */}
        <div className="relative mx-auto aspect-[1/1.02] w-full max-w-[640px] lg:mr-[-2rem] lg:mt-[-6.5rem]">
          <Hero3D className="absolute inset-[-6%]" />

          {a && (
            <div className="absolute right-[0%] top-[2%] hidden animate-float sm:block [animation-delay:-2s]">
              <TiltCard tilt="[transform:perspective(900px)_rotateY(-16deg)_rotateX(6deg)_rotateZ(3deg)]">
                <div className="flex items-center gap-2.5">
                  <Avatar name={a.display_name} hue={a.hue} size={36} />
                  <div className="leading-tight">
                    <div className="text-[13px] font-semibold text-ink">@{a.handle}</div>
                    <div className="text-[12px] text-mute">{a.categories[0]} · {a.city}</div>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-3 text-[12px] text-ink-2">
                  <span><b className="font-display text-[15px] text-ink">{km(a.followers)}</b> followers</span>
                  <span><b className="font-display text-[15px] text-ink">{a.engagement_rate.toFixed(1)}%</b> ER</span>
                </div>
              </TiltCard>
            </div>
          )}

          {b && (
            <div className="absolute right-[-2%] top-[58%] hidden animate-float md:block">
              <TiltCard tilt="[transform:perspective(900px)_rotateY(-18deg)_rotateX(8deg)_rotateZ(3deg)]">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-ok"><CalendarCheck2 className="h-4 w-4" aria-hidden /> Confirmed for Campus Fest</div>
                <div className="mt-2 flex items-center gap-2">
                  <Avatar name={b.display_name} hue={b.hue} size={28} />
                  <span className="text-[13px] font-semibold text-ink">{b.display_name}</span>
                  <span className="ml-1 inline-flex items-center gap-0.5 text-[12px] text-ink-2"><Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden />{b.rating}</span>
                </div>
              </TiltCard>
            </div>
          )}

          <div className="absolute bottom-0 left-1/2 w-[min(360px,92%)] -translate-x-1/2 sm:left-[4%] sm:translate-x-0">
            <HandleDemo profiles={PROFILES} />
          </div>

          <div className="absolute left-[2%] top-[22%] hidden animate-float lg:block [animation-delay:-4s]">
            <span className="glass inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold text-ink shadow-md">
              <BadgeCheck className="h-4 w-4 text-cobalt" aria-hidden /> Verified insights
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function TiltCard({ tilt, children }: { tilt: string; children: React.ReactNode }) {
  return <div className={`glass w-[230px] rounded-[20px] p-3.5 shadow-lg ${tilt}`}>{children}</div>;
}
