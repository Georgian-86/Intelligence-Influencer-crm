import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { TalentForm } from "@/components/talent-form";
import { getMyTalent, requireUser } from "@/lib/session";

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ type?: string; error?: string }> }) {
  await requireUser("/onboarding");
  const sp = await searchParams;
  const talent = await getMyTalent();
  if (talent) redirect(sp.error ? `/dashboard/profile?error=${encodeURIComponent(sp.error)}` : "/dashboard");
  const type = sp.type === "event" ? "event" : "influencer";
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-black tracking-tight">Build your profile</h1>
        <p className="mt-2 text-sm text-mute">After you submit, the Vigor team screens your profile. Once approved you&apos;ll see live campaign briefs.</p>
        <div className="mt-6">
          <TalentForm talent={null} contact={null} media={[]} defaultType={type} back={`/onboarding?type=${type}`} error={sp.error} submitLabel="Submit profile" />
        </div>
      </main>
    </>
  );
}
