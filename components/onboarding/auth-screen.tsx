import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AUTH_SHOWCASE } from "@/lib/demo/creator";
import { AuthForm } from "./auth-form";
import { BrandPanel } from "./brand-panel";
import { DemoPersonas } from "./demo-personas";

type Notice = { kind: "ok" | "error"; text: string } | null;

/** One-screen auth used by /register and /login (D2: Google first, WhatsApp OTP second, email link fallback). */
export function AuthScreen({ mode, next, type, notice, demo }: { mode: "register" | "login"; next: string; type: "influencer" | "event"; notice: Notice; demo: boolean }) {
  const register = mode === "register";
  return (
    <div className="min-h-dvh bg-[#f6f7f9] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-3 lg:p-3">
      <main id="main" className="app-ui flex min-h-dvh flex-col bg-transparent px-5 pb-8 pt-5 sm:px-10 lg:min-h-0 lg:px-12 lg:pt-6">
        <header className="flex items-center justify-between">
          <Logo />
          <Link href={register ? `/login${next !== "/onboarding" ? `?next=${encodeURIComponent(next)}` : ""}` : "/register"}
            className="inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-[8px] px-3 text-[14px] text-ink-2 hover:bg-canvas-2">
            {register ? <><span className="hidden sm:inline">Have an account?</span><span className="ml-1 font-medium text-cobalt">Log in</span></> : <><span className="hidden sm:inline">New here?</span><span className="ml-1 font-medium text-cobalt">Sign up</span></>}
          </Link>
        </header>

        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-12">
          <h1 className="text-[28px] leading-tight">{register ? "Create your creator account" : "Log in to Vigor"}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-mute">
            {register ? "Sign in, add your Instagram handle, and we fill in the rest. About a minute." : "Welcome back. Pick how you'd like to sign in."}
          </p>

          {notice && (
            <p role={notice.kind === "error" ? "alert" : "status"}
              className={`mt-6 rounded-[10px] px-3.5 py-2.5 text-[14px] ${notice.kind === "error" ? "bg-bad-bg text-bad" : "bg-ok-bg text-ok"}`}>
              {notice.text}
            </p>
          )}

          <div className="mt-8"><AuthForm mode={mode} next={next} type={type} demo={demo} /></div>

          {demo && !register && <DemoPersonas next={next} />}

          <p className="mt-8 flex items-start gap-2 text-[12.5px] leading-relaxed text-mute">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mute" />
            <span>We only read your public Instagram stats and never post for you. By continuing you agree to Vigor&apos;s terms and privacy policy.</span>
          </p>
        </div>
      </main>
      <aside className="hidden lg:block lg:sticky lg:top-3 lg:h-[calc(100dvh-24px)]">
        <BrandPanel creators={AUTH_SHOWCASE} />
      </aside>
    </div>
  );
}
