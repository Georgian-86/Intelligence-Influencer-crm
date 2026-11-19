import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AUTH_SHOWCASE } from "@/lib/demo/creator";
import { AuthForm } from "./auth-form";
import { BrandPanel } from "./brand-panel";

type Notice = { kind: "ok" | "error"; text: string } | null;

/** One-screen auth used by /register and /login (D2: Google first, WhatsApp OTP second, email link fallback). */
export function AuthScreen({ mode, next, type, notice, demo }: { mode: "register" | "login"; next: string; type: "influencer" | "event"; notice: Notice; demo: boolean }) {
  const register = mode === "register";
  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-3 lg:p-3">
      <main id="main" className="flex min-h-dvh flex-col px-5 pb-8 pt-5 sm:px-10 lg:min-h-0 lg:px-14 lg:pt-8 xl:px-20">
        <header className="flex items-center justify-between">
          <Logo />
          <Link href={register ? `/login${next !== "/onboarding" ? `?next=${encodeURIComponent(next)}` : ""}` : "/register"}
            className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-[14px] font-medium text-ink-2 hover:bg-canvas-2">
            {register ? <><span className="hidden sm:inline">Have an account?</span><span className="ml-1 font-semibold text-cobalt">Log in</span></> : <>New here? <span className="ml-1 font-semibold text-cobalt">Join</span></>}
          </Link>
        </header>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10 lg:py-0">
          {register ? (
            <>
              <h1 className="font-display text-[40px] font-bold leading-[1.02] tracking-[-0.045em] sm:text-[48px]">
                Get brand collabs <span className="font-serif font-normal italic text-cobalt">on your campus.</span>
              </h1>
              <p className="mt-4 text-[16px] leading-relaxed text-ink-2">
                Sign in, drop your Instagram handle, and we fill in the rest. About a minute, no forms.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-[40px] font-bold leading-[1.02] tracking-[-0.045em] sm:text-[48px]">Welcome back.</h1>
              <p className="mt-4 text-[16px] leading-relaxed text-ink-2">New briefs dropped since you last checked. Sign in to see your matches.</p>
            </>
          )}

          {notice && (
            <p role={notice.kind === "error" ? "alert" : "status"}
              className={`mt-6 rounded-[14px] px-4 py-3 text-[14px] font-medium ${notice.kind === "error" ? "bg-bad-bg text-bad" : "bg-ok-bg text-ok"}`}>
              {notice.text}
            </p>
          )}

          <div className="mt-8"><AuthForm mode={mode} next={next} type={type} demo={demo} /></div>

          <p className="mt-8 flex items-start gap-2 text-[12.5px] leading-relaxed text-mute">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
            <span>No password to remember. We only read your public Instagram stats and never post for you. By continuing you agree to Vigor&apos;s terms and privacy policy.</span>
          </p>
        </div>

        {/* compact proof for small screens, where the brand panel is hidden */}
        <ol className="mx-auto grid w-full max-w-[420px] grid-cols-3 gap-3 border-t border-line pt-5 text-[12.5px] text-mute lg:hidden">
          {["Sign in", "Drop your Instagram", "Get matched"].map((s, k) => (
            <li key={s} className="flex items-start gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cobalt-50 font-display text-[12px] font-semibold text-cobalt-700">{k + 1}</span>
              <span className="pt-0.5 leading-snug">{s}</span>
            </li>
          ))}
        </ol>
      </main>
      <aside className="hidden lg:block lg:h-[calc(100dvh-24px)] lg:sticky lg:top-3">
        <BrandPanel creators={AUTH_SHOWCASE} />
      </aside>
    </div>
  );
}
