"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin, Phone, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";
import { CITIES } from "@/lib/constants";
import { CITY_SUGGESTIONS, COURSE_SUGGESTIONS, graduationYears } from "@/lib/colleges";
import { InstagramIcon } from "@/components/brand/icons";
import { completeOnboarding, type OnboardingState } from "@/app/onboarding/actions";
import { IgMiniChip, IgPreviewCard } from "@/components/onboarding/ig-preview-card";
import { CollegePicker, type CollegeValue } from "@/components/onboarding/college-picker";
import { parseHandle, useIgPreview } from "@/components/onboarding/use-ig-preview";

const EASE = [0.2, 0.8, 0.2, 1] as const;

type StepKey = "instagram" | "roles" | "name" | "city" | "college" | "phone";

const TOP_NICHES = ["Lifestyle", "Fashion", "Beauty", "Food", "Travel", "Fitness", "Tech", "Comedy", "Student / Campus", "Dance", "Music", "Gaming"];
const TOP_ROLES = [
  "Brand Promoter", "Event Host / Emcee", "Anchor", "Brand Activation Staff", "Hospitality Staff", "DJ",
  "Dancer", "Singer", "Musician", "Stand-up Comedian", "Camera Operator", "Event Content Creator",
];

const COPY: Record<StepKey, { title: string; sub: string }> = {
  instagram: { title: "What's your Instagram?", sub: "Paste your profile link or @handle. We pull your followers and engagement for you." },
  roles: { title: "What do you do at events?", sub: "Pick everything that fits. You can add more roles and rates later." },
  name: { title: "What should brands call you?", sub: "Your name or creator name, as you'd like it on briefs." },
  city: { title: "Where are you based?", sub: "We match you to briefs and campuses in your city first." },
  college: { title: "Are you in college?", sub: "Campus creators get college campaigns, fests and ambassador programmes." },
  phone: { title: "Where can we WhatsApp you?", sub: "Brief matches and booking updates arrive here. Never shown publicly." },
};

export function OnboardingFlow({ type, defaultName, defaultCity, cityFromGeo }: {
  type: "influencer" | "event"; defaultName: string; defaultCity: string; cityFromGeo: boolean;
}) {
  const steps: StepKey[] = type === "event" ? ["roles", "name", "city", "college", "phone"] : ["instagram", "name", "city", "college", "phone"];
  const reduce = useReducedMotion();
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(completeOnboarding, null);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState<{ step: StepKey; msg: string } | null>(null);

  const [ig, setIg] = useState("");
  const [niches, setNiches] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [name, setName] = useState(defaultName);
  const [nameTouched, setNameTouched] = useState(!!defaultName);
  const [city, setCity] = useState(defaultCity);
  const [inCollege, setInCollege] = useState<"yes" | "no" | null>(null);
  const [college, setCollege] = useState<CollegeValue>({ id: null, name: "" });
  const [course, setCourse] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);

  const { state: preview, lookup } = useIgPreview();
  const step = steps[idx];
  const last = idx === steps.length - 1;

  // Live auto-fill: use the Instagram display name if we don't have one yet.
  useEffect(() => {
    if (!nameTouched && preview.status === "ok" && preview.preview.fullName) setName(preview.preview.fullName);
  }, [preview, nameTouched]);

  // Server-side validation error → jump back to the step that needs fixing.
  useEffect(() => {
    if (!state?.error) return;
    const target = (state.step as StepKey) ?? "phone";
    const i = steps.indexOf(target);
    if (i >= 0) {
      setDir(i < idx ? -1 : 1);
      setIdx(i);
    }
    setError({ step: i >= 0 ? target : step, msg: state.error });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Clear a validation message as soon as the user edits something.
  useEffect(() => {
    setError((e) => (e && e.step === steps[idx] ? null : e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ig, name, city, phone, consent]);

  const validate = (k: StepKey): string | null => {
    switch (k) {
      case "instagram":
        if (!ig.trim()) return "Add your Instagram handle so we can fetch your stats.";
        return parseHandle(ig) ? null : "That doesn't look like an Instagram handle. Try @yourname or your profile link.";
      case "roles":
        return ig.trim() && !parseHandle(ig) ? "That Instagram handle doesn't look right — fix it or clear the field." : null;
      case "name":
        return name.trim() ? null : "Tell us what to call you.";
      case "city":
        return city.trim() ? null : "Pick or type your city.";
      case "college":
        return null;
      case "phone": {
        if (!phoneOk(phone)) return "Enter your 10-digit mobile number.";
        return consent ? null : "Please accept the profile sharing consent to join.";
      }
    }
  };

  const go = (to: number) => {
    setDir(to > idx ? 1 : -1);
    setIdx(to);
    setError(null);
  };

  const next = () => {
    const msg = validate(step);
    if (msg) {
      setError({ step, msg });
      return false;
    }
    if (step === "instagram" || step === "roles") lookup(ig);
    if (!last) go(idx + 1);
    return true;
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!last) {
      e.preventDefault();
      next();
      return;
    }
    for (const k of steps) {
      const msg = validate(k);
      if (msg) {
        e.preventDefault();
        go(steps.indexOf(k));
        setError({ step: k, msg });
        return;
      }
    }
  };

  const toggle = (list: string[], set: (v: string[]) => void, v: string, max: number) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : list.length >= max ? list : [...list, v]);

  const errFor = (k: StepKey) => (error?.step === k ? error.msg : null);
  const pct = Math.round(((idx + (last && pending ? 1 : 0)) / steps.length) * 100);
  const continueLabel = step === "college" && inCollege === null ? "Skip" : "Continue";

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="flex min-h-[calc(100dvh-4rem)] flex-col">
      {/* Everything the server action reads lives in these hidden inputs; visible controls are state-driven. */}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="instagram" value={ig} />
      <input type="hidden" name="display_name" value={name} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="phone" value={phone} />
      {consent && <input type="hidden" name="consent_share" value="on" />}
      {niches.map((n) => <input key={n} type="hidden" name="niches" value={n} />)}
      {roles.map((r) => <input key={r} type="hidden" name="event_categories" value={r} />)}
      <input type="hidden" name="edu_present" value="1" />
      <input type="hidden" name="in_college" value={inCollege ?? ""} />
      {inCollege === "yes" && (
        <>
          <input type="hidden" name="college_id" value={college.id ?? ""} />
          <input type="hidden" name="college_name" value={college.name} />
          <input type="hidden" name="course" value={course} />
          <input type="hidden" name="graduation_year" value={gradYear} />
        </>
      )}

      {/* Progress */}
      <div className="mx-auto w-full max-w-xl px-4 pt-6 sm:pt-10">
        <div className="flex items-center justify-between gap-3 text-xs text-mute">
          <span className="font-medium">
            Step <span className="tabular-nums text-fog">{idx + 1}</span> of {steps.length}
          </span>
          {type === "influencer" && idx > 0 ? <IgMiniChip state={preview} /> : <span>About 60 seconds</span>}
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-3"
          role="progressbar"
          aria-label="Onboarding progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div
            className="h-full origin-left rounded-full bg-gradient-to-r from-brand to-brand-2 transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{ transform: `scaleX(${Math.max(0.04, (idx + 1) / steps.length)})` }}
          />
        </div>
        <ol className="mt-3 hidden gap-1.5 sm:flex" aria-label="Steps">
          {steps.map((k, i) => (
            <li key={k}>
              <button
                type="button"
                onClick={() => i < idx && go(i)}
                disabled={i >= idx}
                aria-current={i === idx ? "step" : undefined}
                className={clsx(
                  "flex min-h-8 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium capitalize transition-colors",
                  i < idx ? "border-ok/40 text-ok hover:bg-ok/10" : i === idx ? "border-brand/50 text-fog" : "border-line text-mute",
                )}
              >
                {i < idx && <Check className="h-3 w-3" aria-hidden="true" />}
                {k === "instagram" ? "Instagram" : k}
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* Stage */}
      <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-6 pt-8">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.section
            key={step}
            aria-labelledby={`step-${step}-title`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 16 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -16 * dir }}
            transition={{ duration: reduce ? 0.1 : 0.22, ease: EASE }}
          >
            <FocusOnMount />
            <h1 id={`step-${step}-title`} className="text-balance text-[1.75rem] font-extrabold leading-tight tracking-[-0.03em] text-fog sm:text-4xl">
              {COPY[step].title}
            </h1>
            <p className="mt-2 text-pretty text-[15px] text-mute">{COPY[step].sub}</p>

            <div className="mt-6 space-y-5">
              {step === "instagram" && (
                <>
                  <HandleInput value={ig} onChange={setIg} onCommit={lookup} error={errFor("instagram")} autoFocus />
                  <IgPreviewCard state={preview} onRetry={() => { lookup(""); lookup(ig); }} />
                  <ChipGroup
                    legend="What do you post about?"
                    hint="Optional · up to 3"
                    options={TOP_NICHES}
                    selected={niches}
                    onToggle={(v) => toggle(niches, setNiches, v, 3)}
                  />
                </>
              )}

              {step === "roles" && (
                <>
                  <ChipGroup legend="Your roles" hint="Optional · pick any" options={TOP_ROLES} selected={roles} onToggle={(v) => toggle(roles, setRoles, v, 8)} autoFocus />
                  <div className="space-y-3 border-t border-line pt-5">
                    <label htmlFor="ig-handle" className="label">Also a creator? Instagram (optional)</label>
                    <HandleInput value={ig} onChange={setIg} onCommit={lookup} error={errFor("roles")} />
                    {preview.status !== "idle" && <IgPreviewCard state={preview} onRetry={() => { lookup(""); lookup(ig); }} />}
                  </div>
                </>
              )}

              {step === "name" && (
                <TextStep
                  id="display-name"
                  label="Name"
                  value={name}
                  onChange={(v) => { setName(v); setNameTouched(true); }}
                  autoComplete="name"
                  placeholder="e.g. Priya Sharma"
                  error={errFor("name")}
                  hint={preview.status === "ok" && !nameTouched ? "Filled in from your Instagram — edit if you like." : undefined}
                />
              )}

              {step === "city" && (
                <>
                  <TextStep
                    id="city"
                    label="City"
                    value={city}
                    onChange={setCity}
                    autoComplete="address-level2"
                    placeholder="e.g. Mumbai"
                    list="city-suggestions"
                    icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                    error={errFor("city")}
                    hint={cityFromGeo && city === defaultCity ? "Detected from your location — change it if that's wrong." : undefined}
                  />
                  <datalist id="city-suggestions">{CITY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
                  <div className="flex flex-wrap gap-2" aria-label="Popular cities">
                    {CITIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCity(c)}
                        aria-pressed={city === c}
                        className={clsx(
                          "min-h-11 rounded-full border px-4 text-sm font-medium transition-colors",
                          city === c ? "border-brand/60 bg-brand/10 text-fog" : "border-line text-mute hover:border-line-2 hover:text-fog",
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === "college" && (
                <>
                  <fieldset>
                    <legend className="sr-only">Are you in college?</legend>
                    <div className="grid grid-cols-2 gap-3">
                      {([["yes", "Yes, I'm a student"], ["no", "No, not right now"]] as const).map(([v, l], i) => (
                        <label
                          key={v}
                          className={clsx(
                            "flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 text-[15px] font-semibold transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/30",
                            inCollege === v ? "border-brand/60 bg-brand/10 text-fog" : "border-line bg-ink-2 text-mute hover:border-line-2 hover:text-fog",
                          )}
                        >
                          <input
                            type="radio"
                            name="in_college_choice"
                            value={v}
                            checked={inCollege === v}
                            onChange={() => setInCollege(v)}
                            data-autofocus={i === 0 ? "" : undefined}
                            className="sr-only"
                          />
                          <span className={clsx("grid h-5 w-5 shrink-0 place-items-center rounded-full border", inCollege === v ? "border-brand bg-brand text-black" : "border-line-2")} aria-hidden="true">
                            {inCollege === v && <Check className="h-3 w-3" />}
                          </span>
                          {l}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <AnimatePresence initial={false}>
                    {inCollege === "yes" && (
                      <motion.div
                        initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: reduce ? 0.1 : 0.22, ease: EASE }}
                        className="overflow-visible"
                      >
                        <div className="space-y-4 pt-1">
                          <div>
                            <label htmlFor="college" className="label">College {city && <span className="text-mute/70">· showing {city} first</span>}</label>
                            <CollegePicker id="college" city={city} value={college} onChange={setCollege} />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
                            <div>
                              <label htmlFor="course" className="label">Course</label>
                              <input id="course" list="course-suggestions" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. BMS, B.Com, B.Tech" className="input min-h-12" autoComplete="off" />
                              <datalist id="course-suggestions">{COURSE_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
                            </div>
                            <div>
                              <label htmlFor="grad-year" className="label">Graduating</label>
                              <select id="grad-year" value={gradYear} onChange={(e) => setGradYear(e.target.value)} className="input min-h-12">
                                <option value="">Year</option>
                                {graduationYears().map((y) => <option key={y} value={y}>{y}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {step === "phone" && (
                <>
                  <div>
                    <label htmlFor="phone" className="label">Mobile / WhatsApp number</label>
                    <div className={clsx("flex min-h-12 items-stretch overflow-hidden rounded-xl border bg-ink-2 transition-[border-color,box-shadow] focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15", errFor("phone") && !phoneOk(phone) ? "border-bad" : "border-line")}>
                      <span className="flex items-center gap-1.5 border-r border-line px-3 text-sm text-mute">
                        <Phone className="h-4 w-4" aria-hidden="true" /> +91
                      </span>
                      <input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d\s+-]/g, "").slice(0, 16))}
                        placeholder="98xxxxxxxx"
                        data-autofocus=""
                        aria-invalid={!!errFor("phone") || undefined}
                        aria-describedby={errFor("phone") ? "phone-error" : undefined}
                        className="min-w-0 flex-1 bg-transparent px-3 text-[15px] tracking-wide text-fog outline-none placeholder:text-mute/70 focus-visible:outline-none"
                      />
                    </div>
                  </div>
                  <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-line bg-ink-2/60 p-4 text-sm text-fog/90 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/30">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
                    <span>
                      I agree that my profile and public social metrics can be shown to Vigor and its partner agencies for campaign
                      matching. My phone and email are shared only with agencies whose briefs I respond to or who invite me.
                    </span>
                  </label>
                  <Recap name={name} city={city} handle={parseHandle(ig)} college={inCollege === "yes" ? college.name : ""} />
                  {errFor("phone") && <ErrorText id="phone-error">{errFor("phone")}</ErrorText>}
                </>
              )}

            </div>
          </motion.section>
        </AnimatePresence>
      </div>

      {/* Actions — sticky in the thumb zone on mobile */}
      <div className="sticky bottom-0 z-20 border-t border-white/[0.07] bg-ink/85 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:pb-10 sm:backdrop-blur-none">
        <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-4">
          {idx > 0 && (
            <button type="button" onClick={() => go(idx - 1)} className="btn-ghost min-h-12 w-12 shrink-0 p-0 sm:w-auto sm:px-4" aria-label="Back">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          {last ? (
            <button type="submit" disabled={pending} aria-busy={pending} className="btn-primary min-h-12 flex-1 text-[15px]">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              {pending ? "Creating your profile…" : "Join the network"}
            </button>
          ) : (
            <button type="submit" className="btn-primary min-h-12 flex-1 text-[15px]">
              {continueLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <p className="mx-auto mt-2 hidden max-w-xl px-4 text-xs text-mute sm:block">
          Press <kbd className="rounded border border-line bg-ink-3 px-1.5 py-0.5 font-sans text-[11px] text-fog">Enter</kbd> to continue
        </p>
      </div>
    </form>
  );
}

/** Mounted inside each step (after AnimatePresence's exit), moves focus to the step's [data-autofocus] control. */
function FocusOnMount() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      ref.current?.closest("section")?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return <span ref={ref} hidden />;
}

function phoneOk(v: string) {
  const d = v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  return d.length === 10 && /^[6-9]/.test(d);
}

function ErrorText({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p id={id} role="alert" className="text-sm font-medium text-bad">
      {children}
    </p>
  );
}

function HandleInput({ value, onChange, onCommit, error, autoFocus }: {
  value: string; onChange: (v: string) => void; onCommit: (v: string) => void; error: string | null; autoFocus?: boolean;
}) {
  return (
    <div>
      <div className={clsx("flex min-h-14 items-center gap-2 rounded-2xl border bg-ink-2 px-4 transition-[border-color,box-shadow] focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15", error ? "border-bad" : "border-line")}>
        <InstagramIcon className="h-5 w-5 shrink-0 text-mute" />
        <input
          id="ig-handle"
          type="text"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          aria-label="Instagram handle or profile link"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? "ig-error" : undefined}
          placeholder="@yourhandle or profile link"
          value={value}
          data-autofocus={autoFocus ? "" : undefined}
          onChange={(e) => onChange(e.target.value)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (text) setTimeout(() => onCommit(text), 0);
          }}
          onBlur={(e) => onCommit(e.target.value)}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-fog outline-none placeholder:text-mute/70 focus-visible:outline-none"
        />
      </div>
      {error && <ErrorText id="ig-error">{error}</ErrorText>}
    </div>
  );
}

function TextStep({ id, label, value, onChange, autoComplete, placeholder, error, hint, list, icon }: {
  id: string; label: string; value: string; onChange: (v: string) => void; autoComplete?: string; placeholder?: string;
  error: string | null; hint?: string; list?: string; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute">{icon}</span>}
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          list={list}
          data-autofocus=""
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={clsx("input min-h-14 rounded-2xl text-base", icon && "pl-10", error && "border-bad")}
        />
      </div>
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-ok">{hint}</p>}
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
    </div>
  );
}

function ChipGroup({ legend, hint, options, selected, onToggle, autoFocus }: {
  legend: string; hint?: string; options: string[]; selected: string[]; onToggle: (v: string) => void; autoFocus?: boolean;
}) {
  return (
    <fieldset>
      <legend className="label flex w-full items-center justify-between">
        <span>{legend}</span>
        {hint && <span className="font-normal text-mute/70">{hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o)}
              data-autofocus={autoFocus && i === 0 ? "" : undefined}
              className={clsx(
                "flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-[border-color,background-color,color] duration-150 active:scale-[0.98]",
                on ? "border-brand/60 bg-brand/10 text-fog" : "border-line text-mute hover:border-line-2 hover:text-fog",
              )}
            >
              {on && <Check className="h-3.5 w-3.5 text-brand" aria-hidden="true" />}
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Recap({ name, city, handle, college }: { name: string; city: string; handle: string | null; college: string }) {
  const bits = [name, city, handle && `@${handle}`, college].filter(Boolean);
  if (!bits.length) return null;
  return (
    <p className="text-xs text-mute">
      Joining as <span className="text-fog">{bits.join(" · ")}</span>
    </p>
  );
}
