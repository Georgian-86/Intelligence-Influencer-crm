"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight, ChevronDown, LoaderCircle, Lock } from "lucide-react";
import { clsx } from "clsx";
import { submitEnquiry } from "@/app/brands/actions";
import { CITIES } from "@/lib/constants";

type Field = "company" | "contact_name" | "email" | "phone" | "requirement";
type Errors = Partial<Record<Field, string>>;

const BUDGETS = ["Under ₹1 lakh", "₹1–5 lakh", "₹5–15 lakh", "₹15 lakh+", "Not sure yet"];
const MIN_REQ = 20;

function validate(fd: FormData): Errors {
  const v = (k: string) => String(fd.get(k) ?? "").trim();
  const e: Errors = {};
  if (!v("company")) e.company = "Enter your company or brand name.";
  if (!v("contact_name")) e.contact_name = "Enter your name.";
  const email = v("email");
  if (!email) e.email = "Enter your work email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = "Enter a valid email, like name@company.com.";
  const phone = v("phone");
  if (phone && phone.replace(/\D/g, "").length < 10) e.phone = "Enter a 10-digit mobile number, or leave it blank.";
  const req = v("requirement");
  if (!req) e.requirement = "Tell us what you need.";
  else if (req.length < MIN_REQ) e.requirement = `Add a little more detail (at least ${MIN_REQ} characters).`;
  return e;
}

export function EnquiryForm({ serverError }: { serverError?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [reqLen, setReqLen] = useState(0);
  const count = Object.keys(errors).length;

  const revalidate = (field?: Field) => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    // Don't nag about an empty field the user merely tabbed through before their first submit.
    if (field && !touched && !String(fd.get(field) ?? "").trim() && !errors[field]) return;
    const all = validate(fd);
    setErrors((prev) => {
      if (!field) return all;
      // On blur, only update the field the user just left (plus clear fixed ones).
      const next: Errors = {};
      for (const k of Object.keys(prev) as Field[]) if (all[k]) next[k] = all[k];
      if (all[field]) next[field] = all[field];
      return next;
    });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const all = validate(new FormData(e.currentTarget));
    setTouched(true);
    setErrors(all);
    const first = Object.keys(all)[0];
    if (first) {
      e.preventDefault();
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
  };

  return (
    <form ref={formRef} action={submitEnquiry} onSubmit={onSubmit} noValidate className="relative space-y-5">
      <div id="form-status" aria-live="polite" className="empty:hidden">
        {serverError && !touched && (
          <Banner>{serverError}</Banner>
        )}
        {touched && count > 0 && (
          <Banner>{count === 1 ? "One field needs your attention." : `${count} fields need your attention.`}</Banner>
        )}
      </div>

      {/* honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input name="company" label="Company / brand" autoComplete="organization" error={errors.company} onBlur={() => revalidate("company")} required />
        <Input name="contact_name" label="Your name" autoComplete="name" error={errors.contact_name} onBlur={() => revalidate("contact_name")} required />
        <Input name="email" type="email" label="Work email" autoComplete="email" inputMode="email" placeholder="name@company.com" error={errors.email} onBlur={() => revalidate("email")} required />
        <Input name="phone" type="tel" label="Phone / WhatsApp" autoComplete="tel" inputMode="tel" placeholder="+91" hint="Optional" error={errors.phone} onBlur={() => revalidate("phone")} />
      </div>

      <div>
        <label htmlFor="f-city" className="label">City</label>
        <div className="relative">
          <select id="f-city" name="city" className="input min-h-12 appearance-none pr-10" defaultValue="">
            <option value="">Multiple cities / pan-India</option>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden="true" />
        </div>
      </div>

      <fieldset>
        <legend className="label">Budget (approx.) <span className="font-normal text-mute/80">· optional</span></legend>
        <div className="flex flex-wrap gap-2">
          {BUDGETS.map((b) => (
            <label key={b} className="relative">
              <input type="radio" name="budget" value={b} className="peer sr-only" />
              <span className="flex min-h-11 items-center rounded-xl border border-line bg-ink-2 px-3.5 text-sm text-mute transition-[border-color,background-color,color] duration-150 hover:border-line-2 hover:text-fog peer-checked:border-brand peer-checked:bg-brand/10 peer-checked:text-fog peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink">
                {b}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="f-requirement" className="label">What do you need?</label>
          <span className={clsx("text-xs tabular-nums", reqLen > 0 && reqLen < MIN_REQ ? "text-warn" : "text-mute")} aria-hidden="true">
            {reqLen}
          </span>
        </div>
        <textarea
          id="f-requirement"
          name="requirement"
          rows={5}
          required
          aria-invalid={!!errors.requirement}
          aria-describedby={errors.requirement ? "f-requirement-err" : "f-requirement-hint"}
          onBlur={() => revalidate("requirement")}
          onChange={(e) => { setReqLen(e.target.value.trim().length); if (errors.requirement) revalidate("requirement"); }}
          className={clsx("input resize-y leading-relaxed", errors.requirement && "border-bad focus:border-bad focus:ring-bad/15")}
          placeholder="e.g. 40 food creators in Pune + Mumbai for a menu launch, reels + stories, plus 20 promoters for 6 campus activations in March."
        />
        {errors.requirement ? (
          <FieldError id="f-requirement-err">{errors.requirement}</FieldError>
        ) : (
          <p id="f-requirement-hint" className="mt-1.5 text-xs text-mute">Goal, talent type, how many, cities and dates — whatever you know so far.</p>
        )}
      </div>

      <Submit />
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-mute">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" /> We only use these details to reply to your enquiry.
      </p>
    </form>
  );
}

function Input({ name, label, error, hint, type = "text", ...rest }: {
  name: Field; label: string; error?: string; hint?: string; type?: string; required?: boolean;
  autoComplete?: string; placeholder?: string; inputMode?: "email" | "tel" | "text"; onBlur?: () => void;
}) {
  const id = `f-${name}`;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="label">{label}</label>
        {hint && <span className="text-xs text-mute">{hint}</span>}
      </div>
      <input
        id={id}
        name={name}
        type={type}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={clsx("input min-h-12", error && "border-bad focus:border-bad focus:ring-bad/15")}
        {...rest}
      />
      {error && <FieldError id={`${id}-err`}>{error}</FieldError>}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#ff7a70]">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {children}
    </p>
  );
}

function Banner({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-center gap-2 rounded-xl border border-bad/40 bg-bad/10 px-3.5 py-2.5 text-sm text-[#ff9a92]">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {children}
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary group min-h-12 w-full text-[15px]">
      {pending ? (
        <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending…</>
      ) : (
        <>Send requirement <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" /></>
      )}
    </button>
  );
}
