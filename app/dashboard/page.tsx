import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Notice, PageHeader, Stat } from "@/components/ui";
import { IgCard } from "@/components/ig-card";
import { createClient } from "@/lib/supabase/server";
import { getMyTalent } from "@/lib/session";
import { RANK_LABEL, type Rank } from "@/lib/constants";
import { refreshMyInstagram } from "./actions";

const statusCopy: Record<string, string> = {
  pending: "Your profile is waiting for review by the Vigor team.",
  screening: "You're being screened — we may contact you for a short virtual interview.",
  approved: "You're approved! Browse open briefs and raise your hand.",
  rejected: "Your profile wasn't approved this time. Update it and our team will take another look.",
  suspended: "Your profile is currently suspended. Contact the Vigor team.",
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ welcome?: string; saved?: string; refresh?: string }> }) {
  const sp = await searchParams;
  const talent = await getMyTalent();
  if (!talent) redirect("/onboarding");
  const supabase = await createClient();
  const [{ data: ig }, { data: intents }, { count: openBriefs }] = await Promise.all([
    supabase.from("social_accounts").select("*").eq("talent_id", talent.id).eq("platform", "instagram").maybeSingle(),
    supabase.from("intents").select("id, stage").eq("talent_id", talent.id),
    supabase.from("briefs").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  const active = (intents ?? []).filter((i) => !["rejected", "dropped", "delivered"].includes(i.stage)).length;
  const confirmed = (intents ?? []).filter((i) => i.stage === "confirmed" || i.stage === "delivered").length;

  return (
    <>
      <PageHeader title={`Hi, ${talent.display_name.split(" ")[0]}`} subtitle={talent.city ?? undefined}
        actions={<Link href="/dashboard/profile" className="btn-ghost">Edit profile</Link>} />
      <div className="space-y-6">
        {sp.welcome && <Notice kind="ok">Profile submitted! We&apos;re fetching your Instagram data and the team will review you shortly.</Notice>}
        {sp.saved && <Notice kind="ok">Profile saved.</Notice>}
        {sp.refresh === "wait" && <Notice>Metrics were refreshed less than an hour ago — try again later.</Notice>}
        <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <div className="flex items-center gap-2"><Badge value={talent.status} /><Badge value={talent.rank} label={RANK_LABEL[talent.rank as Rank]} /></div>
            <p className="mt-2 text-sm text-mute">{statusCopy[talent.status]}</p>
          </div>
          {talent.status === "approved" && <Link href="/dashboard/briefs" className="btn-primary">View open briefs</Link>}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Open briefs" value={talent.status === "approved" ? openBriefs ?? 0 : "—"} hint={talent.status === "approved" ? undefined : "Visible after approval"} />
          <Stat label="Active applications" value={active} />
          <Stat label="Campaigns confirmed" value={confirmed} />
        </div>
        {ig && (
          <IgCard acc={ig} action={
            <form action={refreshMyInstagram}>
              <input type="hidden" name="account_id" value={ig.id} />
              <button className="btn-ghost py-1.5 text-xs">Refresh</button>
            </form>
          } />
        )}
        <div className="card p-5 text-sm">
          <div className="font-semibold">How ranks work</div>
          <p className="mt-1 text-mute">
            Bronze → Silver → Gold → Platinum. Upload performance videos, complete campaigns, earn good client
            ratings and show up reliably to move up.
          </p>
        </div>
      </div>
    </>
  );
}
