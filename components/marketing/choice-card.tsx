import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ArrowRight, Check } from "lucide-react";

/** Large path card for /join. The whole card is one link; the preview is decorative. */
export function ChoiceCard({ href, kicker, title, desc, perks, cta, preview, featured = false }: {
  href: string; kicker: string; title: ReactNode; desc: string; perks: string[]; cta: string; preview: ReactNode; featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group relative flex h-full flex-col overflow-hidden rounded-[36px] border p-3 transition-[transform,box-shadow,border-color] duration-500 ease-out-expo hover:-translate-y-1.5",
        featured ? "border-cobalt-600 bg-cobalt text-white shadow-glow hover:shadow-[0_30px_60px_-20px_rgb(43_75_255/.6)]" : "border-line bg-surface text-ink shadow-sm hover:border-line-2 hover:shadow-lg",
      )}
    >
      <div aria-hidden className={clsx("relative grid aspect-[16/11] place-items-center overflow-hidden rounded-[28px] p-5", featured ? "bg-cobalt-700/50" : "bg-canvas-2")}>
        <div className="transition-transform duration-700 ease-out-expo group-hover:-translate-y-1 group-hover:scale-[1.02]">{preview}</div>
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-6 sm:px-5">
        <span className={clsx("text-[13px] font-medium", featured ? "text-white/75" : "text-cobalt")}>{kicker}</span>
        <h2 className="mt-1.5 font-display text-[28px] font-bold leading-[1.05] tracking-[-0.035em]">{title}</h2>
        <p className={clsx("mt-2 text-[15px] leading-relaxed", featured ? "text-white/80" : "text-ink-2")}>{desc}</p>
        <ul className="mb-8 mt-5 space-y-2.5">
          {perks.map((p) => (
            <li key={p} className={clsx("flex items-start gap-2.5 text-[14.5px]", featured ? "text-white/90" : "text-ink-2")}>
              <span className={clsx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full", featured ? "bg-white/20 text-white" : "bg-cobalt-50 text-cobalt")}><Check className="h-3 w-3" aria-hidden /></span>
              {p}
            </li>
          ))}
        </ul>
        <span className={clsx("mt-auto inline-flex h-12 items-center justify-between rounded-full pl-5 pr-1.5 text-[15px] font-semibold transition-colors", featured ? "bg-white text-cobalt" : "bg-ink text-white group-hover:bg-night-3")}>
          {cta}
          <span className={clsx("grid h-9 w-9 place-items-center rounded-full transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5", featured ? "bg-cobalt text-white" : "bg-white/15")}>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </span>
      </div>
    </Link>
  );
}
