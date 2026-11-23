"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, KeyRound, LoaderCircle, Mail, MailCheck } from "lucide-react";
import { clsx } from "clsx";
import { GoogleIcon, WhatsAppIcon } from "@/components/brand/icons";
import { sendMagicLink, sendPhoneOtp, signIn, signInWithGoogle, verifyPhoneOtp } from "@/app/auth-actions";

type Mode = "register" | "login";
type View = "choose" | "phone" | "code" | "email" | "email-sent" | "password";

export const PHONE_KEY = "vtn:auth-phone";

export function AuthForm({ mode, next, type, demo }: { mode: Mode; next: string; type: "influencer" | "event"; demo: boolean }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [view, setView] = useState<View>("choose");
  const [phone, setPhone] = useState("");
  const [e164, setE164] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [googlePending, setGooglePending] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const go = (v: View) => { setError(null); setView(v); };
  const anim = reduce ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const } };

  const submitPhone = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await sendPhoneOtp(phone);
      if (!r.ok) return setError(r.error);
      setE164(r.phone!); setChannel(r.channel!); go("code");
      try { localStorage.setItem(PHONE_KEY, r.phone!); } catch {}
      setTimeout(() => codeRef.current?.focus(), 50);
    });
  };
  const submitCode = (e?: React.FormEvent) => {
    e?.preventDefault();
    start(async () => {
      const r = await verifyPhoneOtp(e164, code, next);
      if (!r.ok) return setError(r.error);
      router.push(r.redirectTo!);
    });
  };
  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await sendMagicLink(email, next);
      if (!r.ok) return setError(r.error);
      if (demo) return router.push(next);
      go("email-sent");
    });
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        {view === "choose" && (
          <motion.div key="choose" {...anim} className="space-y-2.5">
            <form action={signInWithGoogle} onSubmit={() => setGooglePending(true)}>
              <input type="hidden" name="next" value={next} />
              <button className="btn-ghost btn-lg w-full gap-2.5" aria-busy={googlePending}>
                {googlePending ? <LoaderCircle className="h-[18px] w-[18px] animate-spin text-cobalt" /> : <GoogleIcon className="h-[18px] w-[18px]" />}
                Continue with Google
              </button>
            </form>
            <button type="button" onClick={() => go("phone")} className="btn-ghost btn-lg w-full gap-2.5">
              <WhatsAppIcon className="h-[18px] w-[18px] text-[#128c4a]" />
              Continue with WhatsApp
            </button>
            <div className="flex items-center gap-3 py-1.5 text-[12px] text-faint" aria-hidden><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
            <button type="button" onClick={() => go("email")} className="btn-ghost btn-lg w-full gap-2.5">
              <Mail className="h-[18px] w-[18px] text-mute" /> Continue with email
            </button>
            {mode === "login" && (
              <p className="pt-2 text-center text-[13px] text-mute">
                <button type="button" onClick={() => go("password")} className="inline-flex min-h-10 items-center gap-1.5 text-ink-2 underline-offset-4 hover:text-ink hover:underline">
                  <KeyRound className="h-3.5 w-3.5" /> Sign in with a password
                </button>
              </p>
            )}
          </motion.div>
        )}

        {view === "phone" && (
          <motion.form key="phone" {...anim} onSubmit={submitPhone} className="space-y-4" noValidate>
            <BackLink onClick={() => go("choose")} />
            <div>
              <label htmlFor="phone" className="label">Mobile number</label>
              <div className={clsx("flex h-12 items-center overflow-hidden rounded-[10px] border bg-surface transition-[border-color,box-shadow] focus-within:border-cobalt focus-within:ring-4 focus-within:ring-cobalt/12", error ? "border-bad" : "border-line")}>
                <span className="flex h-full items-center border-r border-line bg-canvas px-3.5 text-[15px] font-semibold text-ink-2">+91</span>
                <input id="phone" autoFocus inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/[^\d ]/g, "").slice(0, 12)); setError(null); }}
                  aria-invalid={!!error} aria-describedby={error ? "auth-err" : "phone-hint"}
                  className="h-full flex-1 bg-transparent px-3.5 text-[17px] tracking-wide tabular-nums outline-none placeholder:text-faint" />
              </div>
              <p id="phone-hint" className="mt-1.5 text-[12.5px] text-mute">We&apos;ll WhatsApp you a 6-digit code. No spam, ever.</p>
            </div>
            <ErrorLine error={error} />
            <button className="btn-primary btn-lg w-full" disabled={pending || phone.replace(/\D/g, "").length < 10}>
              {pending ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Sending code</> : <>Send code on WhatsApp <ArrowRight className="h-4 w-4" /></>}
            </button>
          </motion.form>
        )}

        {view === "code" && (
          <motion.form key="code" {...anim} onSubmit={submitCode} className="space-y-4" noValidate>
            <BackLink onClick={() => go("phone")} label="Change number" />
            <div>
              <label htmlFor="otp" className="label">Enter the code sent to {e164.replace(/^\+91/, "+91 ")} on {channel === "whatsapp" ? "WhatsApp" : "SMS"}</label>
              <input id="otp" ref={codeRef} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} placeholder="••••••"
                onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setCode(v); setError(null); if (v.length === 6) setTimeout(() => submitCode(), 0); }}
                aria-invalid={!!error} aria-describedby={error ? "auth-err" : undefined}
                className={clsx("input h-14 text-center font-display text-[26px] font-bold tracking-[0.5em] tabular-nums", error && "border-bad")} />
              {demo && <p className="mt-1.5 text-[12.5px] text-mute">Demo mode: any 6 digits work.</p>}
            </div>
            <ErrorLine error={error} />
            <button className="btn-primary btn-lg w-full" disabled={pending || code.length !== 6}>
              {pending ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Checking</> : <>Verify and continue <ArrowRight className="h-4 w-4" /></>}
            </button>
            <button type="button" className="btn-quiet w-full" disabled={pending} onClick={() => start(async () => { const r = await sendPhoneOtp(e164); if (!r.ok) setError(r.error); })}>
              Resend code
            </button>
          </motion.form>
        )}

        {view === "email" && (
          <motion.form key="email" {...anim} onSubmit={submitEmail} className="space-y-4" noValidate>
            <BackLink onClick={() => go("choose")} />
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" type="email" autoFocus autoComplete="email" inputMode="email" placeholder="you@college.edu" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }} aria-invalid={!!error} aria-describedby={error ? "auth-err" : "email-hint"}
                className={clsx("input h-12 text-[16px]", error && "border-bad")} />
              <p id="email-hint" className="mt-1.5 text-[12.5px] text-mute">Use your college email and we&apos;ll recognise your campus.</p>
            </div>
            <ErrorLine error={error} />
            <button className="btn-primary btn-lg w-full" disabled={pending || !email.includes("@")}>
              {pending ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Sending link</> : <><Mail className="h-4 w-4" /> Email me a sign-in link</>}
            </button>
          </motion.form>
        )}

        {view === "email-sent" && (
          <motion.div key="sent" {...anim} className="rounded-[14px] border border-line bg-surface p-5 text-center" role="status">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ok-bg text-ok"><MailCheck className="h-6 w-6" /></span>
            <p className="mt-3 text-[17px] font-semibold">Check {email}</p>
            <p className="mt-1 text-[14px] text-mute">Tap the link in the email to continue. It works for 1 hour.</p>
            <button type="button" onClick={() => go("email")} className="btn-quiet mt-3">Use a different email</button>
          </motion.div>
        )}

        {view === "password" && (
          <motion.form key="password" {...anim} action={signIn} className="space-y-4">
            <BackLink onClick={() => go("choose")} />
            <input type="hidden" name="next" value={next} />
            <div><label htmlFor="pw-email" className="label">Email</label><input id="pw-email" name="email" type="email" required autoComplete="email" className="input h-12" /></div>
            <div><label htmlFor="pw" className="label">Password</label><input id="pw" name="password" type="password" required autoComplete="current-password" className="input h-12" /></div>
            <button className="btn-primary btn-lg w-full">Sign in</button>
          </motion.form>
        )}
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">{pending ? "Working…" : ""}</span>
      {type === "event" && view === "choose" && mode === "register" && (
        <p className="mt-4 text-center text-[12.5px] text-mute">
          Joining as event talent. <Link href="/register" className="font-semibold text-cobalt hover:underline">Join as a creator instead</Link>
        </p>
      )}
    </div>
  );
}

function BackLink({ onClick, label = "All sign-in options" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="-ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-[8px] px-2 text-[13px] font-medium text-mute hover:text-ink">
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}

function ErrorLine({ error }: { error: string | null }) {
  if (!error) return null;
  return <p id="auth-err" role="alert" className="-mt-1 rounded-[10px] bg-bad-bg px-3.5 py-2.5 text-[13.5px] text-bad">{error}</p>;
}
