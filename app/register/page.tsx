import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Field, Notice } from "@/components/ui";
import { signUp } from "@/app/auth-actions";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ type?: string; error?: string }> }) {
  const sp = await searchParams;
  const type = sp.type === "event" ? "event" : "influencer";
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-14">
        <span className="chip border-brand/40 text-brand">{type === "event" ? "Event talent" : "Influencer"}</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-mute">Next you&apos;ll build your profile. It takes about 3 minutes.</p>
        <form action={signUp} className="card mt-6 space-y-4 p-6">
          {sp.error && <Notice kind="error">{sp.error}</Notice>}
          <input type="hidden" name="type" value={type} />
          <Field label="Full name"><input name="full_name" required className="input" autoComplete="name" /></Field>
          <Field label="Email"><input name="email" type="email" required className="input" autoComplete="email" /></Field>
          <Field label="Password" hint="At least 8 characters.">
            <input name="password" type="password" minLength={8} required className="input" autoComplete="new-password" />
          </Field>
          <button className="btn-primary w-full">Create account</button>
          <p className="text-center text-sm text-mute">
            Already registered? <Link href="/login" className="text-brand hover:underline">Log in</Link>
          </p>
        </form>
        <p className="mt-4 text-center text-xs text-mute">
          Joining as {type === "event" ? "an influencer" : "event talent"} instead?{" "}
          <Link href={`/register?type=${type === "event" ? "influencer" : "event"}`} className="text-brand hover:underline">Switch</Link>
        </p>
      </main>
    </>
  );
}
