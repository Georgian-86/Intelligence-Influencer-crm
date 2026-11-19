import type { Metadata } from "next";
import Link from "next/link";
import { Timer } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Field, Notice } from "@/components/ui";
import { signUp } from "@/app/auth-actions";
import { AuthShell } from "@/components/onboarding/auth-shell";
import { GoogleButton, OrDivider } from "@/components/onboarding/google-button";
import { SubmitButton } from "@/components/onboarding/submit-button";

export const metadata: Metadata = { title: "Create your account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ type?: string; error?: string }> }) {
  const sp = await searchParams;
  const type = sp.type === "event" ? "event" : "influencer";
  return (
    <>
      <SiteHeader />
      <AuthShell
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border-brand/40 bg-brand/10 text-brand-2">{type === "event" ? "Event talent" : "Creator"}</span>
            <span className="chip text-mute"><Timer className="h-3.5 w-3.5" aria-hidden="true" /> About 60 seconds</span>
          </div>
        }
        title="Create your account"
        subtitle={type === "event"
          ? "One tap with Google, then a few quick questions and you're in the pool for gigs in your city."
          : "One tap with Google, then paste your Instagram. We fetch your stats for you."}
        footer={
          <div className="space-y-2">
            <p>Already registered? <Link href="/login" className="font-semibold text-brand-2 underline-offset-4 hover:underline">Log in</Link></p>
            <p className="text-xs">
              Joining as {type === "event" ? "a creator" : "event talent"} instead?{" "}
              <Link href={`/register?type=${type === "event" ? "influencer" : "event"}`} className="font-medium text-brand-2 underline-offset-4 hover:underline">Switch</Link>
            </p>
          </div>
        }
      >
        {sp.error && <div aria-live="polite"><Notice kind="error">{sp.error}</Notice></div>}
        <GoogleButton type={type} from="register" label="Sign up with Google" />
        <OrDivider />
        <form action={signUp} className="space-y-4">
          <input type="hidden" name="type" value={type} />
          <Field label="Full name"><input name="full_name" required className="input min-h-11" autoComplete="name" /></Field>
          <Field label="Email"><input name="email" type="email" required className="input min-h-11" autoComplete="email" inputMode="email" /></Field>
          <Field label="Password" hint="At least 8 characters.">
            <input name="password" type="password" minLength={8} required className="input min-h-11" autoComplete="new-password" />
          </Field>
          <SubmitButton pendingLabel="Creating account…">Create account with email</SubmitButton>
        </form>
      </AuthShell>
    </>
  );
}
