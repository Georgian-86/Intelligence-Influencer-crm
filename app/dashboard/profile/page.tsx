import { redirect } from "next/navigation";
import { clsx } from "clsx";
import { Eye, MapPin } from "lucide-react";
import { Badge } from "@/components/ui";
import { TalentForm } from "@/components/talent-form";
import { InstagramIcon } from "@/components/brand/icons";
import { Avatar } from "@/components/talent/shell";
import { TalentHeader } from "@/components/talent/bits";
import { createClient } from "@/lib/supabase/server";
import { getMyTalent } from "@/lib/session";
import { RANK_LABEL, type Rank } from "@/lib/constants";

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
  const kinds = [talent.is_influencer && "Creator", talent.is_event_talent && "Event talent"].filter(Boolean) as string[];

  return (
    <>
      <TalentHeader eyebrow="Profile" title="Your profile" subtitle="This is what the Vigor team and brands see when matching you to briefs. Keep it current." />

      <section aria-label="Profile summary" className="card mb-6 overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <Avatar name={talent.display_name} className="h-16 w-16 text-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-fog">{talent.display_name}</h2>
              <Badge value={talent.status} />
              <Badge value={talent.rank} label={RANK_LABEL[talent.rank as Rank]} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-mute">
              {kinds.length > 0 && <span>{kinds.join(" · ")}</span>}
              {talent.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{talent.city}</span>}
              {ig?.handle && (
                <a href={`https://www.instagram.com/${ig.handle}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-fog">
                  <InstagramIcon className="h-3.5 w-3.5" />@{ig.handle}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 border-t border-line bg-ink/40 px-5 py-3 text-xs text-mute">
          <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Your phone and WhatsApp are kept off your public profile — the Vigor team uses them to reach you about briefs.
        </div>
      </section>

      <TalentForm talent={talent} contact={contact} instagram={ig?.handle} media={(media ?? []).map((m) => m.url)}
        defaultType="influencer" back="/dashboard/profile" error={sp.error} submitLabel="Save changes" />
    </>
  );
}
