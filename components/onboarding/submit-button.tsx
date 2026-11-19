"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

/** Primary submit button that shows a spinner while its form's server action runs. */
export function SubmitButton({ children, pendingLabel, className }: { children: ReactNode; pendingLabel?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={clsx("btn-primary min-h-12 w-full text-[15px]", className)}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {pending ? (pendingLabel ?? "Please wait…") : children}
    </button>
  );
}
