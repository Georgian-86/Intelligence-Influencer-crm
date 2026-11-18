import { SiteHeader } from "@/components/site-header";
import { Field, Notice } from "@/components/ui";
import { CITIES } from "@/lib/constants";
import { submitEnquiry } from "./actions";

export default async function BrandsPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2">
        <div>
          <span className="chip border-brand/40 text-brand">For brands &amp; agencies</span>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Tell us who you need. We&apos;ll bring the shortlist.</h1>
          <p className="mt-4 text-mute">
            Influencers for a launch, promoters for a college activation, a host and DJ for your event — the
            Vigor team matches your brief to verified talent from our network, with real engagement data.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-mute">
            <li>• Creators with fetched follower and engagement metrics</li>
            <li>• Ranked, screened event talent across 10 cities</li>
            <li>• One team handling outreach, negotiation and confirmation</li>
          </ul>
        </div>
        <form action={submitEnquiry} className="card space-y-4 p-6">
          {sp.sent && <Notice kind="ok">Thanks! Our team will reach out within one working day.</Notice>}
          {sp.error && <Notice kind="error">{sp.error}</Notice>}
          <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company / brand"><input name="company" required className="input" /></Field>
            <Field label="Your name"><input name="contact_name" required className="input" /></Field>
            <Field label="Work email"><input name="email" type="email" required className="input" /></Field>
            <Field label="Phone"><input name="phone" className="input" /></Field>
            <Field label="City">
              <select name="city" className="input" defaultValue="">
                <option value="">Multiple / pan-India</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Budget (approx.)"><input name="budget" placeholder="e.g. ₹2–5 lakh" className="input" /></Field>
          </div>
          <Field label="What do you need?">
            <textarea name="requirement" required rows={5} className="input" placeholder="Campaign goal, talent type, number of creators/staff, dates, cities…" />
          </Field>
          <button className="btn-primary w-full">Send requirement</button>
        </form>
      </main>
    </>
  );
}
