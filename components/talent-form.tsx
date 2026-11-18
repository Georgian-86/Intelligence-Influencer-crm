import { CheckGroup, Field, Notice } from "@/components/ui";
import { CITIES, EVENT_CATEGORY_GROUPS, INFLUENCER_NICHES, LANGUAGES, SKILLS, EVENT_CATEGORIES } from "@/lib/constants";
import { saveTalentProfile } from "@/app/onboarding/actions";

type Talent = Record<string, any> | null;

export function TalentForm({
  talent, contact, instagram, media, defaultType, back, error, submitLabel,
}: {
  talent: Talent;
  contact: { phone?: string | null; whatsapp?: string | null } | null;
  instagram?: string | null;
  media: string[];
  defaultType: "influencer" | "event";
  back: string;
  error?: string;
  submitLabel: string;
}) {
  const isInf = talent ? talent.is_influencer : defaultType === "influencer";
  const isEvt = talent ? talent.is_event_talent : defaultType === "event";
  const cats: string[] = talent?.categories ?? [];
  const mediaSlots = [...media, "", "", ""].slice(0, Math.max(3, media.length));

  return (
    <form action={saveTalentProfile} className="space-y-6">
      <input type="hidden" name="back" value={back} />
      {error && <Notice kind="error">{error}</Notice>}

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">I&apos;m joining as</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="is_influencer" defaultChecked={isInf} className="accent-[#ff6a1a]" /> Influencer / creator</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_event_talent" defaultChecked={isEvt} className="accent-[#ff6a1a]" /> Event talent</label>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Basic details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name"><input name="display_name" required defaultValue={talent?.display_name ?? ""} className="input" /></Field>
          <Field label="City">
            <select name="city" required defaultValue={talent?.city ?? ""} className="input">
              <option value="" disabled>Select city</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
              <option>Other</option>
            </select>
          </Field>
          <Field label="Phone"><input name="phone" required defaultValue={contact?.phone ?? ""} className="input" placeholder="+91 98xxxxxxxx" /></Field>
          <Field label="WhatsApp (if different)"><input name="whatsapp" defaultValue={contact?.whatsapp ?? ""} className="input" /></Field>
          <Field label="Gender">
            <select name="gender" defaultValue={talent?.gender ?? ""} className="input">
              <option value="">Prefer not to say</option>
              <option>Female</option><option>Male</option><option>Non-binary</option>
            </select>
          </Field>
          <Field label="Date of birth"><input type="date" name="date_of_birth" defaultValue={talent?.date_of_birth ?? ""} className="input" /></Field>
        </div>
        <Field label="Short bio"><textarea name="bio" rows={3} defaultValue={talent?.bio ?? ""} className="input" placeholder="What you do, your style, brands you've worked with…" /></Field>
        <Field label="Languages"><CheckGroup name="languages" options={LANGUAGES} selected={talent?.languages ?? []} columns={3} /></Field>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Influencer details <span className="text-xs font-normal text-mute">(if joining as a creator)</span></h2>
        <Field label="Instagram profile link" hint="We fetch your public followers, posts and engagement automatically.">
          <input name="instagram" defaultValue={instagram ? `https://www.instagram.com/${instagram}/` : ""} className="input" placeholder="https://www.instagram.com/yourhandle/" />
        </Field>
        <Field label="Content niches"><CheckGroup name="niches" options={INFLUENCER_NICHES} selected={cats} columns={3} /></Field>
        <Field label="Rate per post / reel (₹, optional)"><input name="rate_per_post" inputMode="numeric" defaultValue={talent?.rate_per_post ?? ""} className="input" /></Field>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Event talent details <span className="text-xs font-normal text-mute">(if joining as event talent)</span></h2>
        {Object.entries(EVENT_CATEGORY_GROUPS).map(([group, items]) => (
          <Field key={group} label={group}>
            <CheckGroup name="event_categories" options={items} selected={cats.filter((c) => EVENT_CATEGORIES.includes(c))} columns={3} />
          </Field>
        ))}
        <Field label="Skills / event types"><CheckGroup name="skills" options={SKILLS} selected={talent?.skills ?? []} columns={3} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Years of experience"><input name="experience_years" inputMode="numeric" defaultValue={talent?.experience_years ?? ""} className="input" /></Field>
          <Field label="Half-day rate (₹)"><input name="rate_half_day" inputMode="numeric" defaultValue={talent?.rate_half_day ?? ""} className="input" /></Field>
          <Field label="Full-day rate (₹)"><input name="rate_full_day" inputMode="numeric" defaultValue={talent?.rate_full_day ?? ""} className="input" /></Field>
        </div>
        <Field label="Past events / campaigns"><textarea name="experience_notes" rows={3} defaultValue={talent?.experience_notes ?? ""} className="input" placeholder="e.g. Royal Enfield campus activation, Domino's college campaign…" /></Field>
        <Field label="Rate notes"><input name="rate_notes" defaultValue={talent?.rate_notes ?? ""} className="input" placeholder="Packages, travel, outstation charges…" /></Field>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Portfolio &amp; performance videos</h2>
        <p className="text-sm text-mute">Links to YouTube, Google Drive, Instagram reels or your website.</p>
        <div className="space-y-2">
          {mediaSlots.map((m, i) => (
            <input key={i} name="media_url" defaultValue={m} className="input" placeholder="https://…" />
          ))}
        </div>
      </section>

      <section className="card space-y-3 p-6">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="consent_share" defaultChecked={talent?.consent_share ?? false} className="mt-1 accent-[#ff6a1a]" />
          <span>
            I agree that my profile and public social metrics can be shown to Vigor and its partner agencies for
            campaign matching. My phone and email are shared only with agencies whose briefs I respond to or who invite me.
          </span>
        </label>
        <button className="btn-primary w-full sm:w-auto">{submitLabel}</button>
      </section>
    </form>
  );
}
