import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { clsx } from "clsx";

/**
 * Progressive profiling (PRD A4): profile completeness % and the single next-best action.
 * Pure + server-component friendly (no hooks). Import `computeProfileStrength` for the numbers only.
 *
 * Usage (e.g. dashboard):
 *   <ProfileStrength talent={talent} contact={contact} instagram={ig} mediaCount={n} education={edu} />
 */

export type StrengthInput = {
  talent: {
    display_name?: string | null; city?: string | null; bio?: string | null; photo_url?: string | null;
    languages?: string[] | null; categories?: string[] | null; skills?: string[] | null;
    gender?: string | null; date_of_birth?: string | null;
    is_influencer?: boolean | null; is_event_talent?: boolean | null;
    rate_per_post?: number | null; rate_half_day?: number | null; rate_full_day?: number | null;
    experience_notes?: string | null;
  } | null;
  contact?: { phone?: string | null } | null;
  instagram?: { handle?: string | null; fetch_status?: string | null } | null;
  mediaCount?: number;
  education?: { college_id?: string | null; college_name?: string | null; course?: string | null; graduation_year?: number | null; verified_at?: string | null } | null;
};

export type StrengthItem = { key: string; label: string; action: string; href: string; weight: number; done: boolean };
export type StrengthResult = { percent: number; level: "starter" | "rising" | "strong" | "allstar"; items: StrengthItem[]; next: StrengthItem | null };

const has = (v?: string | null) => !!v && v.trim().length > 0;
const EDIT = "/dashboard/profile";

export function computeProfileStrength(input: StrengthInput): StrengthResult {
  const t = input.talent ?? {};
  const inf = !!t.is_influencer;
  const evt = !!t.is_event_talent;
  const cats = t.categories ?? [];
  const edu = input.education;

  const all: (StrengthItem & { applies: boolean })[] = [
    { key: "basics", label: "Name, city & phone", action: "Add your basics", href: `${EDIT}#basics`, weight: 20, applies: true,
      done: has(t.display_name) && has(t.city) && has(input.contact?.phone) },
    { key: "instagram", label: "Instagram connected", action: "Connect your Instagram", href: `${EDIT}#instagram`, weight: 15, applies: inf,
      done: has(input.instagram?.handle) },
    { key: "ig_synced", label: "Instagram stats synced", action: "Make your Instagram public so we can sync stats", href: `${EDIT}#instagram`, weight: 5, applies: inf && has(input.instagram?.handle),
      done: input.instagram?.fetch_status === "ok" },
    { key: "categories", label: inf ? "Content niches" : "Event roles", action: inf ? "Pick your content niches" : "Pick your event roles", href: `${EDIT}#${inf ? "instagram" : "event"}`, weight: 15, applies: true,
      done: cats.length > 0 },
    { key: "bio", label: "Short bio", action: "Write a two-line bio", href: `${EDIT}#basics`, weight: 10, applies: true, done: has(t.bio) },
    { key: "education", label: "College", action: "Add your college", href: `${EDIT}#education`, weight: 10, applies: true,
      done: !!edu && (has(edu.college_id) || has(edu.college_name) || has(edu.course)) },
    { key: "rates", label: "Rates", action: "Add your rates to get better-fit briefs", href: `${EDIT}#${inf ? "instagram" : "event"}`, weight: 10, applies: true,
      done: (inf && t.rate_per_post != null) || (evt && (t.rate_half_day != null || t.rate_full_day != null)) },
    { key: "media", label: "Portfolio links", action: "Add a portfolio or performance video", href: `${EDIT}#portfolio`, weight: 10, applies: true,
      done: (input.mediaCount ?? 0) > 0 },
    { key: "languages", label: "Languages", action: "Add languages you create in", href: `${EDIT}#basics`, weight: 5, applies: true,
      done: (t.languages ?? []).length > 0 },
    { key: "skills", label: "Experience", action: "Add your event experience", href: `${EDIT}#event`, weight: 5, applies: evt,
      done: (t.skills ?? []).length > 0 || has(t.experience_notes) },
    { key: "personal", label: "Gender & date of birth", action: "Add gender and date of birth for age-specific briefs", href: `${EDIT}#basics`, weight: 5, applies: true,
      done: has(t.gender) && has(t.date_of_birth) },
  ];
  const items = all.filter((i) => i.applies).map(({ applies: _a, ...rest }) => rest);
  const total = items.reduce((s, i) => s + i.weight, 0);
  const got = items.reduce((s, i) => s + (i.done ? i.weight : 0), 0);
  const percent = total ? Math.round((got / total) * 100) : 0;
  const next = [...items].filter((i) => !i.done).sort((a, b) => b.weight - a.weight)[0] ?? null;
  const level = percent >= 100 ? "allstar" : percent >= 75 ? "strong" : percent >= 45 ? "rising" : "starter";
  return { percent, level, items, next };
}

const LEVEL: Record<StrengthResult["level"], { label: string; tone: string }> = {
  starter: { label: "Getting started", tone: "text-warn" },
  rising: { label: "Rising", tone: "text-brand-2" },
  strong: { label: "Strong", tone: "text-info" },
  allstar: { label: "All-star", tone: "text-ok" },
};

export function ProfileStrength({ className, showChecklist = false, ...input }: StrengthInput & { className?: string; showChecklist?: boolean }) {
  const r = computeProfileStrength(input);
  const lvl = LEVEL[r.level];
  return (
    <section className={clsx("card p-5", className)} aria-labelledby="profile-strength-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="profile-strength-title" className="text-sm font-semibold text-fog">Profile strength</h2>
          <p className={clsx("mt-0.5 text-xs font-medium", lvl.tone)}>{lvl.label}</p>
        </div>
        <div className="text-2xl font-bold tabular-nums text-fog">{r.percent}%</div>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-ink-3"
        role="meter"
        aria-label="Profile strength"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={r.percent}
      >
        <div
          className="h-full origin-left rounded-full bg-gradient-to-r from-brand to-brand-2 transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
          style={{ transform: `scaleX(${Math.max(0.02, r.percent / 100)})` }}
        />
      </div>
      {r.next ? (
        <Link
          href={r.next.href}
          className="group mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-line bg-ink-3/50 px-3 py-2.5 text-sm transition-colors hover:border-brand/50"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-brand-2" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-fog">{r.next.action}</span>
            <span className="block text-xs text-mute">+{Math.round((r.next.weight / r.items.reduce((s, i) => s + i.weight, 0)) * 100)}% · brands see complete profiles first</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-mute transition-transform group-hover:translate-x-0.5 group-hover:text-fog" aria-hidden="true" />
        </Link>
      ) : (
        <p className="mt-4 flex items-center gap-2 text-sm text-ok"><Check className="h-4 w-4" aria-hidden="true" /> Your profile is complete.</p>
      )}
      {showChecklist && (
        <ul className="mt-4 grid gap-1.5 text-xs sm:grid-cols-2">
          {r.items.map((i) => (
            <li key={i.key} className={clsx("flex items-center gap-2", i.done ? "text-mute line-through decoration-line-2" : "text-fog/90")}>
              <span className={clsx("grid h-4 w-4 shrink-0 place-items-center rounded-full", i.done ? "bg-ok/15 text-ok" : "border border-line-2")} aria-hidden="true">
                {i.done && <Check className="h-2.5 w-2.5" />}
              </span>
              {i.label}
              <span className="sr-only">{i.done ? "(done)" : "(to do)"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
