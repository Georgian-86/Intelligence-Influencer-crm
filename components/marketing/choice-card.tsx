import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Check } from "lucide-react";

/**
 * Large "app chooser" card. Pure CSS hover motion (transform/opacity only):
 * lift, glow fade-in, preview tilt and arrow nudge.
 */
export function ChoiceCard({ href, eyebrow, title, desc, perks, cta, preview }: {
  href: string; eyebrow: string; title: string; desc: string; perks: string[]; cta: string; preview: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-ink-2 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] transition-[transform,border-color] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-1 hover:border-brand/50 focus-visible:-translate-y-1 focus-visible:border-brand/50 active:translate-y-0 active:scale-[0.99]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        <div className="absolute -top-24 left-1/2 h-64 w-[130%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_106_26/0.28),transparent)]" />
      </div>

      {/* preview stage */}
      <div aria-hidden="true" className="relative flex h-48 items-center justify-center overflow-hidden border-b border-line bg-ink/40 sm:h-56">
        <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]" />
        <div className="relative transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:-translate-y-1.5 group-hover:-rotate-[1.5deg] group-hover:scale-[1.04]">
          {preview}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col p-6 sm:p-7">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-2">{eyebrow}</span>
        <h2 className="mt-2 text-2xl font-bold text-fog">{title}</h2>
        <p className="mt-2 text-[15px] text-mute">{desc}</p>
        <ul className="mt-5 space-y-2.5">
          {perks.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm text-fog/90">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-ok/15 text-ok">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
              {p}
            </li>
          ))}
        </ul>
        <span className="mt-auto pt-7">
          <span className="btn-primary min-h-12 w-full px-5 text-[15px]">
            {cta}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </span>
      </div>
    </Link>
  );
}
