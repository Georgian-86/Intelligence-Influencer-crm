import Link from "next/link";
import { redirect } from "next/navigation";
import { clsx } from "clsx";
import { Inbox } from "lucide-react";
import { ApplicationCard, type TalentApplication } from "@/components/talent/application-card";
import { EmptyState, TalentHeader } from "@/components/talent/bits";
import { isClosed } from "@/components/talent/model";
import { createClient } from "@/lib/supabase/server";
import { getMyTalent } from "@/lib/session";

const VIEWS = [
  { key: "active", label: "In progress", test: (s: string) => !isClosed(s) && s !== "delivered" },
  { key: "done", label: "Completed", test: (s: string) => s === "delivered" },
  { key: "closed", label: "Closed", test: (s: string) => isClosed(s) },
  { key: "all", label: "All", test: () => true },
] as const;

export default async function Applications({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const sp = await searchParams;
  const talent = await getMyTalent();
  if (!talent) redirect("/onboarding");
  const supabase = await createClient();
  const { data: intents } = await supabase
    .from("intents")
    .select("id, stage, source, quoted_rate, agreed_rate, created_at, updated_at, brief_id, briefs(title, brand_display, event_date)")
    .eq("talent_id", talent.id)
    .order("created_at", { ascending: false });

  const apps: TalentApplication[] = (intents ?? []).map((i) => ({ ...i, brief: i.briefs as unknown as TalentApplication["brief"] }));
  const counts = Object.fromEntries(VIEWS.map((v) => [v.key, apps.filter((a) => v.test(a.stage)).length])) as Record<(typeof VIEWS)[number]["key"], number>;
  const view = VIEWS.find((v) => v.key === sp.view) ?? (counts.active ? VIEWS[0] : VIEWS[3]);
  // Most recently moved first, so fresh status changes are on top.
  const list = apps.filter((a) => view.test(a.stage))
    .sort((x, y) => new Date(y.updated_at ?? y.created_at).getTime() - new Date(x.updated_at ?? x.created_at).getTime());

  return (
    <>
      <TalentHeader
        eyebrow="Applications"
        title="Where you stand"
        subtitle="Every brief you've raised your hand for, and exactly which stage it's at. No guessing, no ghosting."
      />

      {apps.length === 0 ? (
        <EmptyState icon={Inbox} title="No applications yet"
          action={talent.status === "approved"
            ? <Link href="/dashboard/briefs" className="btn-primary min-h-11">Browse open briefs</Link>
            : <Link href="/dashboard/profile" className="btn-ghost min-h-11">Complete your profile</Link>}>
          {talent.status === "approved"
            ? "Tap “I'm in” on any brief that fits you. You'll track it here from Applied all the way to Completed."
            : "Once you're approved you can apply to briefs — and follow every one here from Applied to Completed."}
        </EmptyState>
      ) : (
        <>
          <nav aria-label="Filter applications" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {VIEWS.map((v) => (
              <Link
                key={v.key}
                href={`/dashboard/applications?view=${v.key}`}
                aria-current={view.key === v.key ? "page" : undefined}
                className={clsx(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors",
                  view.key === v.key ? "border-brand/50 bg-brand/10 text-fog" : "border-line bg-ink-2 text-mute hover:border-line-2 hover:text-fog",
                )}
              >
                {v.label}
                <span className={clsx("rounded-full px-1.5 text-xs tabular-nums", view.key === v.key ? "bg-brand text-black" : "bg-ink-3 text-mute")}>{counts[v.key]}</span>
              </Link>
            ))}
          </nav>

          {list.length === 0 ? (
            <EmptyState icon={Inbox} title={`Nothing ${view.key === "done" ? "completed" : view.key === "closed" ? "closed" : "in progress"} yet`}
              action={<Link href="/dashboard/applications?view=all" className="btn-ghost min-h-11">See all applications</Link>}>
              {view.key === "done" ? "Confirmed campaigns move here once you've delivered." : view.key === "closed" ? "Good news — none of your applications have been closed." : "Apply to a new brief to get things moving."}
            </EmptyState>
          ) : (
            <ul className="space-y-4">
              {list.map((a) => <li key={a.id}><ApplicationCard a={a} /></li>)}
            </ul>
          )}
        </>
      )}
    </>
  );
}
