import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Field, Notice } from "@/components/ui";
import { signIn } from "@/app/auth-actions";
import { AuthShell } from "@/components/onboarding/auth-shell";
import { GoogleButton, OrDivider } from "@/components/onboarding/google-button";
import { SubmitButton } from "@/components/onboarding/submit-button";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; checkEmail?: string; confirmed?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/dashboard";
  return (
    <>
      <SiteHeader />
      <AuthShell
        title="Welcome back"
        subtitle="Log in to see your briefs, applications and profile."
        footer={<>New here? <Link href="/join" className="font-semibold text-brand-2 underline-offset-4 hover:underline">Join the network</Link></>}
      >
        <div aria-live="polite" className="space-y-3 empty:hidden">
          {sp.checkEmail && <Notice kind="ok">Check your inbox and confirm your email, then log in here.</Notice>}
          {sp.confirmed && <Notice kind="ok">Your email is confirmed. Log in to continue.</Notice>}
          {sp.error && <Notice kind="error">{sp.error}</Notice>}
        </div>
        <GoogleButton next={next} from="login" />
        <OrDivider />
        <form action={signIn} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Email"><input name="email" type="email" required className="input min-h-11" autoComplete="email" inputMode="email" /></Field>
          <Field label="Password"><input name="password" type="password" required className="input min-h-11" autoComplete="current-password" /></Field>
          <SubmitButton pendingLabel="Logging in…">Log in with email</SubmitButton>
        </form>
      </AuthShell>
    </>
  );
}
