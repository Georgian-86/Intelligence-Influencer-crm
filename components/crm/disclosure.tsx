"use client";

import { useId, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

/**
 * Collapsible on mobile, always expanded from `lg` up. Content is rendered once
 * (unlike two copies toggled by CSS) so form fields are never duplicated.
 */
export function MobileDisclosure({ summary, badge, children, className }: {
  summary: ReactNode; badge?: ReactNode; children: ReactNode; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-12 w-full items-center justify-between gap-2 px-4 text-sm font-semibold lg:hidden"
      >
        <span className="flex items-center gap-2">{summary}</span>
        <span className="flex items-center gap-2">
          {badge}
          <ChevronDown aria-hidden className={clsx("h-4 w-4 text-mute transition-transform", open && "rotate-180")} />
        </span>
      </button>
      <div id={id} className={clsx(open ? "block border-t border-line lg:border-t-0" : "hidden", "lg:block")}>{children}</div>
    </div>
  );
}
