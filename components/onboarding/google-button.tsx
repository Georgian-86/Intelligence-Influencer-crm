"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { GoogleIcon } from "@/components/brand/icons";
import { signInWithGoogle } from "@/app/auth-actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn min-h-12 w-full border border-line-2 bg-fog text-[15px] text-ink hover:bg-white focus-visible:ring-4 focus-visible:ring-brand/30"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <GoogleIcon className="h-5 w-5" />}
      {pending ? "Opening Google…" : label}
    </button>
  );
}

/** "Continue with Google" — posts to the OAuth server action, which redirects to Google. */
export function GoogleButton({ next, type, from = "login", label = "Continue with Google" }: {
  next?: string; type?: "influencer" | "event"; from?: "login" | "register"; label?: string;
}) {
  return (
    <form action={signInWithGoogle}>
      {next && <input type="hidden" name="next" value={next} />}
      {type && <input type="hidden" name="type" value={type} />}
      <input type="hidden" name="from" value={from} />
      <Submit label={label} />
    </form>
  );
}

export function OrDivider({ label = "or use email" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-mute" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
      <span aria-hidden="true">{label}</span>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
    </div>
  );
}
