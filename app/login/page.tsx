import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Field, Notice } from "@/components/ui";
import { signIn } from "@/app/auth-actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; checkEmail?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-14">
        <h1 className="text-3xl font-black tracking-tight">Log in</h1>
        <form action={signIn} className="card mt-6 space-y-4 p-6">
          {sp.checkEmail && <Notice kind="ok">Check your inbox and confirm your email, then log in here.</Notice>}
          {sp.error && <Notice kind="error">{sp.error}</Notice>}
          <input type="hidden" name="next" value={sp.next ?? "/dashboard"} />
          <Field label="Email"><input name="email" type="email" required className="input" autoComplete="email" /></Field>
          <Field label="Password"><input name="password" type="password" required className="input" autoComplete="current-password" /></Field>
          <button className="btn-primary w-full">Log in</button>
          <p className="text-center text-sm text-mute">
            New here? <Link href="/join" className="text-brand hover:underline">Join the network</Link>
          </p>
        </form>
      </main>
    </>
  );
}
