import { CountUp } from "@/components/motion/reveal";
import { PLATFORM_STATS } from "@/lib/demo/fixtures";

/** Typeset wordmarks — each brand gets its own type treatment so the row reads like a logo wall without using logos. */
const WORDMARKS: { name: string; cls: string }[] = [
  { name: "Domino's", cls: "font-display font-extrabold tracking-[-0.04em]" },
  { name: "NUUK", cls: "font-sans font-black tracking-[0.18em]" },
  { name: "nua", cls: "font-serif italic text-[1.25em] tracking-[-0.01em]" },
  { name: "boAt", cls: "font-display font-bold tracking-[-0.05em]" },
  { name: "CHAAYOS", cls: "font-sans font-semibold tracking-[0.28em] text-[0.8em]" },
  { name: "Lenskart", cls: "font-sans font-bold tracking-[-0.02em]" },
];

const STATS = [
  { to: PLATFORM_STATS.creators, label: "creators in the network" },
  { to: PLATFORM_STATS.campuses, label: "campuses represented" },
  { to: PLATFORM_STATS.cities, label: "cities with live talent" },
];

export function TrustStrip() {
  const row = [...WORDMARKS, ...WORDMARKS];
  return (
    <section aria-labelledby="trust-title" className="border-y border-line bg-surface/60">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16">
        <div className="min-w-0">
          <h2 id="trust-title" className="text-[13px] font-medium text-mute">Campaigns run for youth brands including</h2>
          <div className="group relative mt-4 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
            <ul className="flex w-max animate-marquee items-center gap-14 pr-14 group-hover:[animation-play-state:paused]">
              {row.map((w, i) => (
                <li key={i} aria-hidden={i >= WORDMARKS.length} className={`whitespace-nowrap text-[26px] leading-none text-ink/75 ${w.cls}`}>
                  {w.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-6 sm:gap-10">
          {STATS.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <CountUp to={s.to} className="block font-display text-[clamp(1.75rem,3.4vw,2.75rem)] font-bold leading-none tracking-[-0.04em] text-ink tabular-nums" />
                <span aria-hidden className="mt-2 block text-[13px] leading-snug text-mute">{s.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
