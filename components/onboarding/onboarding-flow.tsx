"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Rocket } from "lucide-react";
import { clsx } from "clsx";
import { Logo } from "@/components/brand/logo";
import { completeOnboarding, fetchInstagramPreview } from "@/app/onboarding/actions";
import { PHONE_KEY } from "./auth-form";
import { PreviewCard } from "./preview-card";
import { StepInstagram, type FetchPhase } from "./step-instagram";
import { StepCollege } from "./step-college";
import { StepGoals } from "./step-goals";
import { Launch } from "./launch";
import type { Draft, OnboardingContext, Step } from "./types";

const DRAFT_KEY = "vtn:onboarding:v1";
const STEPS = ["Instagram", "College", "Goals"] as const;
const EASE = [0.16, 1, 0.3, 1] as const;

function initialDraft(ctx: OnboardingContext): Draft {
  return {
    handle: "", preview: null, confirmed: false, manual: false,
    fullName: ctx.name ?? "", city: ctx.ipCity, bio: null, niches: [], languages: [],
    inCollege: null, college: null, gradYear: null,
    interests: ctx.type === "event" ? ["Event hosting & promoting"] : ["Instagram collabs"],
    whatsapp: (ctx.phone ?? "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""), whatsappAlerts: !!ctx.phone,
  };
}

const stepDone = (d: Draft, s: Step) =>
  s === 1 ? d.confirmed : s === 2 ? d.inCollege === false || (d.inCollege === true && !!d.college && !!d.gradYear) : d.interests.length > 0;

export function OnboardingFlow({ ctx }: { ctx: OnboardingContext }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [d, setD] = useState<Draft>(() => initialDraft(ctx));
  const [step, setStep] = useState<Step>(1);
  const [phase, setPhase] = useState<FetchPhase>("input");
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState<{ msg: string; code: string | null } | null>(null);
  const [bioCollege, setBioCollege] = useState<{ id: string; name: string; city: string } | null>(null);
  const [launching, setLaunching] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [ready, setReady] = useState(false);
  const dir = useRef(1);

  const set = useCallback((p: Partial<Draft>) => { setD((cur) => ({ ...cur, ...p })); setErr(null); }, []);

  /* restore draft + step from localStorage / URL */
  useEffect(() => {
    let draft = initialDraft(ctx);
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as Draft | null;
      if (saved) draft = { ...draft, ...saved };
      const ph = localStorage.getItem(PHONE_KEY);
      if (ph && !draft.whatsapp) draft = { ...draft, whatsapp: ph.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""), whatsappAlerts: true };
    } catch {}
    const want = Number(new URLSearchParams(location.search).get("step")) as Step;
    let s: Step = 1;
    if (want === 2 && stepDone(draft, 1)) s = 2;
    if (want === 3 && stepDone(draft, 1) && stepDone(draft, 2)) s = 3;
    setD(draft); setStep(s);
    setPhase(draft.preview || draft.manual ? "review" : "input");
    setEditing(draft.manual);
    setReady(true);
    const onPop = () => {
      const n = Number(new URLSearchParams(location.search).get("step")) || 1;
      dir.current = -1; setStep(Math.min(3, Math.max(1, n)) as Step); setErr(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (ready) try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {} }, [d, ready]);

  const goTo = (s: Step, mode: "push" | "replace" = "push") => {
    dir.current = s > step ? 1 : -1;
    const url = new URL(location.href);
    url.searchParams.set("step", String(s));
    history[mode === "push" ? "pushState" : "replaceState"](null, "", url);
    setStep(s); setErr(null);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const doFetch = () => {
    if (!d.handle.trim()) { setErr({ msg: "Type your Instagram handle to continue.", code: "invalid" }); return; }
    setPhase("fetching"); setErr(null);
    const t0 = Date.now();
    start(async () => {
      const r = await fetchInstagramPreview(d.handle);
      const wait = Math.max(0, 1500 - (Date.now() - t0));
      if (wait) await new Promise((res) => setTimeout(res, wait));
      if (!r.ok) { setPhase("error"); setErr({ msg: r.error, code: r.code }); return; }
      const p = r.preview;
      setBioCollege(r.college);
      setD((cur) => ({
        ...cur, preview: p, manual: false, handle: p.handle, fullName: cur.fullName || p.fullName || "", city: p.city ?? cur.city, bio: p.bio,
        niches: p.niches.length ? p.niches : cur.niches, languages: p.languages, gradYear: cur.gradYear ?? p.gradYear,
      }));
      setEditing(false); setPhase("review");
    });
  };

  const onManual = () => {
    const keep = err?.code === "unavailable" || err?.code === "private";
    setD((cur) => ({ ...cur, manual: true, preview: null, handle: keep ? cur.handle : "", languages: cur.languages.length ? cur.languages : ["English"] }));
    setErr(null); setEditing(true); setPhase("review");
  };
  const onRetry = () => { setD((cur) => ({ ...cur, preview: null, confirmed: false, manual: false, handle: "" })); setPhase("input"); setEditing(false); setErr(null); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pending || launching) return;
    if (step === 1) {
      if (phase === "input" || phase === "error") return doFetch();
      if (phase !== "review") return;
      if (!d.fullName.trim()) { setEditing(true); return setErr({ msg: "Add your name so brands know who you are.", code: null }); }
      if (!d.city) { setEditing(true); return setErr({ msg: "Pick your city — we match briefs by city.", code: null }); }
      set({ confirmed: true });
      return goTo(2);
    }
    if (step === 2) {
      if (d.inCollege === null) return setErr({ msg: "Choose Yes or No to continue.", code: null });
      if (d.inCollege && !d.college) return setErr({ msg: "Pick your college, or add it if it isn't listed.", code: null });
      if (d.inCollege && !d.gradYear) return setErr({ msg: "Choose your graduation year.", code: null });
      return goTo(3);
    }
    if (!d.interests.length) return setErr({ msg: "Pick at least one thing you'd like to do.", code: null });
    start(async () => {
      const r = await completeOnboarding({
        handle: d.handle || null, fullName: d.fullName, city: d.city, bio: d.bio, niches: d.niches, languages: d.languages,
        inCollege: !!d.inCollege, college: d.inCollege ? d.college : null, gradYear: d.inCollege ? d.gradYear : null,
        interests: d.interests, whatsapp: d.whatsapp ? `+91${d.whatsapp.replace(/\D/g, "")}` : null, whatsappAlerts: d.whatsappAlerts && !!d.whatsapp, type: ctx.type,
      });
      if (!r.ok) { if (r.step !== step) goTo(r.step); setErr({ msg: r.error, code: null }); return; }
      setLaunching(r.redirectTo);
    });
  };

  const finish = useCallback(() => {
    if (!launching) return;
    try { localStorage.removeItem(DRAFT_KEY); localStorage.removeItem(PHONE_KEY); } catch {}
    router.push(launching);
  }, [launching, router]);

  const fetching = phase === "fetching";
  const suggestion = ctx.emailCollege ? { ...ctx.emailCollege, source: "email" as const } : bioCollege ? { ...bioCollege, source: "bio" as const } : null;
  const primary =
    step === 1
      ? phase === "review" ? (d.manual ? "Continue" : "Yes, that's me") : fetching ? "Fetching your profile" : "Fetch my profile"
      : step === 2 ? "Continue" : "Launch my profile";

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center gap-4 px-5 sm:px-8">
          <Logo compact className="sm:hidden" href="/" />
          <Logo className="hidden sm:inline-flex" href="/" />
          <nav aria-label="Onboarding progress" className="ml-auto flex flex-1 items-center justify-end gap-3 sm:max-w-[420px]">
            <ol className="flex flex-1 items-center gap-1.5">
              {STEPS.map((label, i) => {
                const n = (i + 1) as Step;
                const done = n < step, on = n === step;
                return (
                  <li key={label} className="flex-1" aria-current={on ? "step" : undefined}>
                    <span className="sr-only">{`Step ${n}: ${label}${done ? " (done)" : ""}`}</span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-canvas-2" aria-hidden>
                      <div className="h-full origin-left rounded-full bg-cobalt transition-transform duration-500 ease-out-expo" style={{ transform: `scaleX(${done ? 1 : on ? 0.5 : 0})` }} />
                    </div>
                    <div className={clsx("mt-1.5 hidden text-[11.5px] font-semibold sm:block", on ? "text-ink" : done ? "text-cobalt-700" : "text-faint")} aria-hidden>
                      {done && <Check className="-mt-0.5 mr-0.5 inline h-3 w-3" strokeWidth={3} />}{label}
                    </div>
                  </li>
                );
              })}
            </ol>
            <span className="shrink-0 text-[12.5px] font-semibold tabular-nums text-mute sm:hidden">{step}/3</span>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto grid max-w-[1120px] gap-12 px-5 pb-40 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16 lg:pb-20 lg:pt-14">
        <form onSubmit={submit} noValidate className="min-w-0 lg:max-w-[540px]">
          {step > 1 && (
            <div className="mb-6 lg:hidden"><PreviewCard d={d} fetching={false} variant="mini" /></div>
          )}
          <AnimatePresence mode="wait" initial={false} custom={dir.current}>
            <motion.div key={step}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir.current * 24 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir.current * -24 }}
              transition={{ duration: reduce ? 0.1 : 0.32, ease: EASE }}>
              {step === 1 && (
                <>
                  <StepInstagram d={d} set={set} phase={ready ? phase : "input"} error={err?.msg ?? null} errorCode={err?.code ?? null}
                    onFetch={doFetch} onRetry={onRetry} onManual={onManual} editing={editing} setEditing={setEditing} />
                  {(fetching || phase === "review") && !d.manual && (
                    <div className="mt-6 lg:hidden"><PreviewCard d={d} fetching={fetching} /></div>
                  )}
                </>
              )}
              {step === 2 && <StepCollege d={d} set={set} suggestion={suggestion} error={err?.msg ?? null} />}
              {step === 3 && <StepGoals d={d} set={set} error={err?.msg ?? null} phoneFromAuth={!!ctx.phone} />}
            </motion.div>
          </AnimatePresence>

          {/* actions: thumb-zone bar on mobile, inline on desktop */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/92 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <div className="mx-auto flex max-w-[540px] items-center gap-3 lg:mx-0">
              {step > 1 && (
                <button type="button" onClick={() => goTo((step - 1) as Step, "replace")} className="btn-ghost btn-lg w-13 shrink-0 px-0 lg:w-auto lg:px-6" aria-label="Back">
                  <ArrowLeft className="h-4 w-4" /><span className="hidden lg:inline">Back</span>
                </button>
              )}
              <button type="submit" disabled={fetching || pending || !!launching} className="btn-primary btn-lg flex-1 lg:flex-none lg:min-w-[220px]">
                {fetching || (pending && step === 3) ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {pending && step === 3 ? "Launching" : primary}
                {!fetching && !pending && (step === 3 ? <Rocket className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />)}
              </button>
            </div>
            <p className="mx-auto mt-2 hidden max-w-[540px] text-[12px] text-mute lg:mx-0 lg:block">
              Press <kbd className="rounded border border-line bg-surface px-1 font-sans text-[11px] font-semibold">Enter</kbd> to continue. Your answers are saved on this device.
            </p>
          </div>
        </form>

        <aside className="hidden lg:block" aria-label="Live profile preview">
          <div className="sticky top-28">
            <div className="mb-3 flex items-center justify-between text-[13px]">
              <span className="font-semibold text-ink-2">Your profile, as brands see it</span>
              <span className="inline-flex items-center gap-1.5 text-mute"><span className="h-1.5 w-1.5 rounded-full bg-ok" />Live preview</span>
            </div>
            <PreviewCard d={d} fetching={fetching} />
            <p className="mt-4 text-[12.5px] leading-relaxed text-mute">Date of birth, rates and portfolio can wait. We&apos;ll ask when a brief needs them.</p>
          </div>
        </aside>
      </main>

      <AnimatePresence>{launching && <Launch firstName={(d.fullName || "creator").split(" ")[0]} openBriefs={ctx.openBriefs} onDone={finish} />}</AnimatePresence>
    </div>
  );
}
