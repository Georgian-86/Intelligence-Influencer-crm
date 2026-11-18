import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { TalentForm } from "@/components/talent-form";
import { createClient } from "@/lib/supabase/server";
import { getMyTalent } from "@/lib/session";

export default async function EditProfile({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const talent = await getMyTalent();
  if (!talent) redirect("/onboarding");
  const supabase = await createClient();
  const [{ data: contact }, { data: ig }, { data: media }] = await Promise.all([
    supabase.from("talent_contacts").select("phone, whatsapp").eq("talent_id", talent.id).maybeSingle(),
    supabase.from("social_accounts").select("handle").eq("talent_id", talent.id).eq("platform", "instagram").maybeSingle(),
    supabase.from("talent_media").select("url").eq("talent_id", talent.id).order("created_at"),
  ]);
  return (
    <>
      <PageHeader title="Edit profile" subtitle="Keep your details current so we can match you to the right briefs." />
      <TalentForm talent={talent} contact={contact} instagram={ig?.handle} media={(media ?? []).map((m) => m.url)}
        defaultType="influencer" back="/dashboard/profile" error={sp.error} submitLabel="Save changes" />
    </>
  );
}
