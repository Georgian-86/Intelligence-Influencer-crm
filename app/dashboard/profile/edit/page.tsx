import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TalentForm } from "@/components/talent-form";
import { isDemo } from "@/lib/demo";
import { getMyTalent } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getCreator } from "../../_lib/data";

/** Full details form (everything progressive profiling hasn't asked for yet). */
export default async function EditAll({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const c = await getCreator();
  if (!c) redirect("/onboarding");
  let talent: Record<string, unknown> | null, contact: { phone?: string | null; whatsapp?: string | null } | null, media: string[];
  if (isDemo()) {
    talent = { display_name: c.name, city: c.city, gender: c.gender, date_of_birth: c.dob, bio: c.bio, languages: c.languages, is_influencer: c.isInfluencer, is_event_talent: c.isEventTalent, categories: c.categories, skills: [], rate_per_post: c.ratePerPost, rate_full_day: c.rateFullDay, rate_notes: c.rateNotes, consent_share: true };
    contact = { phone: c.phone, whatsapp: c.whatsapp };
    media = c.portfolio;
  } else {
    talent = await getMyTalent();
    const supabase = await createClient();
    const [{ data: ct }, { data: m }] = await Promise.all([
      supabase.from("talent_contacts").select("phone, whatsapp").eq("talent_id", c.id).maybeSingle(),
      supabase.from("talent_media").select("url").eq("talent_id", c.id).order("created_at"),
    ]);
    contact = ct; media = (m ?? []).map((x) => x.url);
  }
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/profile" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[14px] font-medium text-mute hover:text-ink"><ArrowLeft className="h-4 w-4" /> Profile</Link>
      <h1 className="mt-2 font-display text-[34px] font-bold tracking-[-0.04em]">All details</h1>
      <p className="mb-6 mt-1 text-[15px] text-mute">Everything in one place. Most of this is optional — we ask when a brief needs it.</p>
      <TalentForm talent={talent} contact={contact} instagram={c.handle} media={media} defaultType="influencer" back="/dashboard/profile/edit" error={sp.error} submitLabel="Save changes" />
    </div>
  );
}
