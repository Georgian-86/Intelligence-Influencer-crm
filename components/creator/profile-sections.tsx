"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Check, Copy, LoaderCircle, Pencil, Plus, Share2, X } from "lucide-react";
import { clsx } from "clsx";
import { updateProfile, type ProfilePatch } from "@/app/dashboard/actions";
import { CITIES, INFLUENCER_NICHES, LANGUAGES } from "@/lib/constants";

/** Card with view/edit modes; saves through updateProfile and shows inline status. */
function Editable({ id, title, sub, view, edit, onSave, empty }: {
  id: string; title: string; sub?: string; view: ReactNode; edit: ReactNode; onSave: () => ProfilePatch; empty?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const save = () => start(async () => {
    const r = await updateProfile(onSave());
    setStatus(r.ok ? { ok: true, text: "Saved" } : { ok: false, text: r.error });
    if (r.ok) { setEditing(false); setTimeout(() => setStatus(null), 2500); }
  });
  return (
    <section id={id} className="card scroll-mt-24 p-5 sm:p-6" aria-labelledby={`${id}-h`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={`${id}-h`} className="font-display text-[18px] font-semibold tracking-[-0.02em]">{title}</h2>
          {sub && <p className="mt-0.5 text-[13px] text-mute">{sub}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span aria-live="polite" className={clsx("text-[12.5px] font-medium", status?.ok ? "text-ok" : "text-bad")}>{status?.text}</span>
          {!editing && (
            <button type="button" onClick={() => setEditing(true)} className="btn-quiet btn-sm min-h-11 sm:min-h-9" aria-label={`Edit ${title}`}>
              {empty ? <><Plus className="h-3.5 w-3.5" /> Add</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
            </button>
          )}
        </div>
      </div>
      <div className="mt-4">
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
            {edit}
            <div className="flex gap-2 pt-1">
              <button className="btn-primary" disabled={pending}>{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save</button>
              <button type="button" className="btn-ghost" onClick={() => { setEditing(false); setStatus(null); }}><X className="h-4 w-4" /> Cancel</button>
            </div>
          </form>
        ) : view}
      </div>
    </section>
  );
}

function Chips({ options, value, onChange, max }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" role="checkbox" aria-checked={on} onClick={() => onChange(on ? value.filter((x) => x !== o) : max && value.length >= max ? value : [...value, o])}
            className={clsx("inline-flex min-h-10 items-center gap-1 rounded-full border px-3.5 text-[13.5px] font-medium transition-colors", on ? "border-cobalt bg-cobalt text-white" : "border-line bg-surface text-ink-2 hover:border-line-2")}>
            {on && <Check className="h-3.5 w-3.5" strokeWidth={2.6} />}{o}
          </button>
        );
      })}
    </div>
  );
}

const Dl = ({ rows }: { rows: [string, ReactNode][] }) => (
  <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
    {rows.map(([k, v]) => (
      <div key={k} className="min-w-0 border-b border-line pb-3">
        <dt className="text-[12.5px] text-mute">{k}</dt>
        <dd className="mt-0.5 truncate text-[14.5px] font-medium">{v}</dd>
      </div>
    ))}
  </dl>
);
const missing = (t: string) => <span className="font-normal text-faint">{t}</span>;

export function AboutSection({ init }: { init: { bio: string | null; city: string | null; categories: string[]; languages: string[]; gender: string | null; dob: string | null } }) {
  const [v, setV] = useState(init);
  const [draft, setDraft] = useState(init);
  return (
    <Editable id="about" title="About" sub="Used to match you with briefs."
      onSave={() => { setV(draft); return { bio: draft.bio, city: draft.city, categories: draft.categories, languages: draft.languages, gender: draft.gender, dob: draft.dob }; }}
      view={
        <div className="space-y-4">
          {v.bio && <p className="max-w-[64ch] text-[15px] leading-relaxed text-ink-2">{v.bio}</p>}
          <Dl rows={[
            ["Niches", v.categories.length ? v.categories.join(", ") : missing("Add your niches")],
            ["City", v.city ?? missing("Add your city")],
            ["Languages", v.languages.length ? v.languages.join(", ") : missing("Add languages")],
            ["Date of birth", v.dob ? new Date(v.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : missing("Some brands need 18+ — add it")],
          ]} />
        </div>
      }
      edit={
        <>
          <div><label className="label" htmlFor="bio">Short bio</label><textarea id="bio" rows={3} className="textarea" value={draft.bio ?? ""} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} /></div>
          <div><span className="label">City</span><Chips options={CITIES} value={draft.city ? [draft.city] : []} onChange={(x) => setDraft({ ...draft, city: x.filter((c) => c !== draft.city)[0] ?? null })} /></div>
          <div><span className="label">Niches (up to 5)</span><Chips options={INFLUENCER_NICHES} value={draft.categories} max={5} onChange={(x) => setDraft({ ...draft, categories: x })} /></div>
          <div><span className="label">Languages you create in</span><Chips options={LANGUAGES} value={draft.languages} onChange={(x) => setDraft({ ...draft, languages: x })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="dob">Date of birth</label><input id="dob" type="date" className="input" value={draft.dob ?? ""} onChange={(e) => setDraft({ ...draft, dob: e.target.value || null })} /></div>
            <div><label className="label" htmlFor="gender">Gender</label>
              <select id="gender" className="input" value={draft.gender ?? ""} onChange={(e) => setDraft({ ...draft, gender: e.target.value || null })}>
                <option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="non-binary">Non-binary</option>
              </select>
            </div>
          </div>
        </>
      }
    />
  );
}

export function RatesSection({ init }: { init: { ratePerPost: number | null; rateFullDay: number | null; rateNotes: string | null } }) {
  const [v, setV] = useState(init);
  const [draft, setDraft] = useState(init);
  const fmt = (n: number | null) => (n ? `₹${n.toLocaleString("en-IN")}` : null);
  const num = (s: string) => { const d = s.replace(/\D/g, ""); return d ? Number(d) : null; };
  return (
    <Editable id="rates" title="Rates" sub="Private: only Vigor sees these, never brands." empty={!v.ratePerPost && !v.rateFullDay}
      onSave={() => { setV(draft); return draft; }}
      view={
        <div className="grid grid-cols-2 gap-3">
          {[["Per Reel / post", fmt(v.ratePerPost)], ["Event, full day", fmt(v.rateFullDay)]].map(([k, val]) => (
            <div key={k} className="rounded-[16px] bg-canvas p-4">
              <div className="text-[12.5px] text-mute">{k}</div>
              <div className="mt-1 font-display text-[24px] font-bold tracking-[-0.03em] tabular-nums">{val ?? <span className="text-[15px] font-medium text-faint">Not set</span>}</div>
            </div>
          ))}
          {v.rateNotes && <p className="col-span-2 text-[13.5px] text-mute">{v.rateNotes}</p>}
        </div>
      }
      edit={
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="rpp">Per Reel / post (₹)</label><input id="rpp" inputMode="numeric" className="input" value={draft.ratePerPost ?? ""} onChange={(e) => setDraft({ ...draft, ratePerPost: num(e.target.value) })} /></div>
            <div><label className="label" htmlFor="rfd">Event, full day (₹)</label><input id="rfd" inputMode="numeric" className="input" value={draft.rateFullDay ?? ""} onChange={(e) => setDraft({ ...draft, rateFullDay: num(e.target.value) })} /></div>
          </div>
          <div><label className="label" htmlFor="rn">Notes</label><input id="rn" className="input" placeholder="Packages, usage rights, travel…" value={draft.rateNotes ?? ""} onChange={(e) => setDraft({ ...draft, rateNotes: e.target.value })} /></div>
        </>
      }
    />
  );
}

export function ContactSection({ init }: { init: { whatsapp: string | null; email: string | null } }) {
  const [v, setV] = useState(init.whatsapp);
  const [draft, setDraft] = useState(init.whatsapp ?? "");
  return (
    <Editable id="contact" title="Contact" sub="Never shown to brands — Vigor mediates every collab." empty={!v}
      onSave={() => { setV(draft || null); return { whatsapp: draft || null }; }}
      view={<Dl rows={[["WhatsApp", v ?? missing("Add to get briefs instantly")], ["Email", init.email ?? missing("—")]]} />}
      edit={<div><label className="label" htmlFor="wa2">WhatsApp number</label><input id="wa2" inputMode="tel" className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="+91 98765 43210" /></div>}
    />
  );
}

export function PortfolioSection({ init }: { init: string[] }) {
  const [v, setV] = useState(init);
  const [draft, setDraft] = useState([...init, "", ""].slice(0, Math.max(3, init.length + 1)));
  return (
    <Editable id="portfolio" title="Portfolio" sub="Showreels, past campaigns, Drive folders." empty={!v.length}
      onSave={() => { const clean = draft.filter((u) => /^https?:\/\//i.test(u)); setV(clean); return { portfolio: clean }; }}
      view={v.length ? (
        <ul className="space-y-2">{v.map((u) => <li key={u}><a href={u} target="_blank" rel="noreferrer" className="block truncate text-[14px] font-medium text-cobalt hover:underline">{u.replace(/^https?:\/\//, "")}</a></li>)}</ul>
      ) : <p className="text-[14px] text-mute">Add work beyond Instagram — event clips, a showreel, a campaign you&apos;re proud of.</p>}
      edit={<div className="space-y-2">{draft.map((u, i) => <input key={i} className="input" inputMode="url" placeholder="https://…" aria-label={`Portfolio link ${i + 1}`} value={u} onChange={(e) => setDraft(draft.map((x, k) => (k === i ? e.target.value : x)))} />)}</div>}
    />
  );
}

export function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ url, title: "My Vigor Talent profile" });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch {}
  };
  return (
    <button type="button" onClick={share} className="btn-dark">
      {copied ? <><Check className="h-4 w-4" /> Link copied</> : <><Share2 className="h-4 w-4 sm:hidden" /><Copy className="hidden h-4 w-4 sm:block" /> Share profile</>}
    </button>
  );
}
