import Link from "next/link";
import { redirect } from "next/navigation";
import { clsx } from "clsx";
import { Lock, Megaphone } from "lucide-react";
import { BriefCard } from "@/components/talent/brief-card";
import { EmptyState, TalentHeader } from "@/components/talent/bits";
import type { TalentBrief } from "@/components/talent/model";
import { createClient } from "@/lib/supabase/server";
import { getMyTalent } from "@/lib/session";
import { mismatches } from "@/lib/match";

const VIEWS = [
  { key: "new", label: "New for you" },
  { key: "applied", label: "You're in" },
  { key: "all", label: "All" },
] as const;

export default async function TalentBriefs({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const sp = await searchParams;
  const talent = await getMyTalent();
  if (!talent) redirect("/onboarding");
  if (talent.status !== "approved") {
    return (
      <>
        <TalentHeader eyebrow="Briefs" title="Open briefs" />
        <EmptyState icon={Lock} title="Briefs unlock after approval"
          action={<Link href="/dashboard/profile" className="btn-ghost min-h-11">Polish your profile</Link>}>
          The Vigor team is reviewing your profile. A complete bio, rates and samples help you get approved faster —
          as soon as you are, briefs matching your niche and city appear here.
        </EmptyState>
      </>
    );
  }
  const supabase = await createClient();
  const [{ data: briefs }, { data: ig }, { data: mine }] = await Promise.all([
    supabase.from("briefs").select("*").eq("status", "open").order("created_at", { ascending: false }),
    supabase.from("social_accounts").select("followers, engagement_rate").eq("talent_id", talent.id).maybeSingle(),
    supabase.from("intents").select("brief_id, stage").eq("talent_id", talent.id),
  ]);
  const applied = new Map((mine ?? []).map((i) => [i.brief_id, i.stage]));
  const rows = (briefs ?? []).map((b) => ({ b: b as TalentBrief, miss: mismatches(b, { ...talent, ...(ig ?? {}) }) }));
  const eligible = rows.filter((r) => r.miss.length === 0).map((r) => r.b);
  const notMatching = rows.length - eligible.length;
  const fresh = eligible.filter((b) => !applied.has(b.id));
  const mineList = eligible.filter((b) => applied.has(b.id));

  const view = (VIEWS.find((v) => v.key === sp.view)?.key ?? (fresh.length ? "new" : "all")) as (typeof VIEWS)[number]["key"];
  const list = view === "new" ? fresh : view === "applied" ? mineList : eligible;
  const counts = { new: fresh.length, applied: mineList.length, all: eligible.length };

  return (
    <>
      <TalentHeader
        eyebrow="Briefs"
        title="Open briefs"
        subtitle={`${eligible.length} brief${eligible.length === 1 ? "" : "s"} match your profile. Tap “I'm in” and the Vigor team takes it from there.`}
      />

      {eligible.length > 0 && (
        <nav aria-label="Filter briefs" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={`/dashboard/briefs?view=${v.key}`}
              aria-current={view === v.key ? "page" : undefined}
              className={clsx(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors",
                view === v.key ? "border-brand/50 bg-brand/10 text-fog" : "border-line bg-ink-2 text-mute hover:border-line-2 hover:text-fog",
              )}
            >
              {v.label}
              <span className={clsx("rounded-full px-1.5 text-xs tabular-nums", view === v.key ? "bg-brand text-black" : "bg-ink-3 text-mute")}>{counts[v.key]}</span>
            </Link>
          ))}
        </nav>
      )}

      {eligible.length === 0 ? (
        <EmptyState icon={Megaphone} title="No matching briefs right now"
          action={<Link href="/dashboard/profile" className="btn-ghost min-h-11">Update categories &amp; cities</Link>}>
          New campaigns are posted every week — we&apos;ll show them here the moment they match you.
          {notMatching > 0 && <> There {notMatching === 1 ? "is" : "are"} {notMatching} other open brief{notMatching === 1 ? "" : "s"} outside your current niche, city or reach.</>}
        </EmptyState>
      ) : list.length === 0 ? (
        <EmptyState icon={Megaphone}
          title={view === "new" ? "You've raised your hand on every match" : "You haven't raised your hand yet"}
          action={<Link href={`/dashboard/briefs?view=${view === "new" ? "applied" : "new"}`} className="btn-ghost min-h-11">{view === "new" ? "See briefs you're in" : "See new briefs"}</Link>}>
          {view === "new" ? "Nice work. New briefs land every week — check back soon." : "Pick a brief that fits and tap “I'm in”. It takes one second."}
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {list.map((b) => <li key={b.id}><BriefCard b={b} stage={applied.get(b.id)} /></li>)}
        </ul>
      )}

      {eligible.length > 0 && notMatching > 0 && (
        <p className="mt-6 text-center text-xs text-mute">
          {notMatching} more open brief{notMatching === 1 ? "" : "s"} didn&apos;t match your niche, city or reach.{" "}
          <Link href="/dashboard/profile" className="text-brand-2 underline-offset-4 hover:underline">Update your profile</Link> to widen your matches.
        </p>
      )}
    </>
  );
}
