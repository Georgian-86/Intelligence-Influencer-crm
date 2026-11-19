import type { ReactNode } from "react";
import { clsx } from "clsx";
import { Reveal } from "@/components/motion/reveal";

export function SectionHeading({ eyebrow, title, children, align = "center", id }: {
  eyebrow: string; title: ReactNode; children?: ReactNode; align?: "center" | "left"; id?: string;
}) {
  return (
    <Reveal className={clsx("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-2">{eyebrow}</span>
      <h2 id={id} className="mt-3 text-balance text-3xl font-bold leading-[1.1] text-fog sm:text-[2.6rem]">{title}</h2>
      {children && <p className="mt-4 text-pretty text-base leading-relaxed text-mute sm:text-lg">{children}</p>}
    </Reveal>
  );
}
