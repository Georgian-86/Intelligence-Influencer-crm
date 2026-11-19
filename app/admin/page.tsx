import Link from "next/link";
import { AlertTriangle, Check, Clock3, MapPin, ShieldCheck, UserPlus, X } from "lucide-react";
import { clsx } from "clsx";
import { Badge, Notice, fmtNum } from "@/components/ui";
import { Avatar, EmptyState, KpiTile, ScreenHeader, TabLinks, TagList } from "@/components/crm/primitives";
import { fmtEr, timeAgo } from "@/components/crm/format";
import { TriageKeys } from "@/components/admin/triage-keys";
import { createClient } from "@/lib/supabase/server";
import { can, requirePlatform } from "@/lib/session";
import { RANKS, TALENT_STATUSES } from "@/lib/constants";
import { quickReview } from "./actions";

type Row = {
  id: string; display_name: string; city: string | null; is_influencer: boolean; is_event_talent: boolean; categories: string[];
  rank: string; status: string; created_at: string;
  social_accounts: { handle: string; followers: number | null; engagement_rate: number | null; fetch_status: string; profile_pic_url: string | null }[] | null;
};

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string; error?: string }> }) {
  const platform = await requirePlatform();
  const sp = await searchParams;
  const status = (TALENT_STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status! : "pending";
  const kind = sp.kind === "influencer" || sp.kind === "event" ? sp.kind : "";
  const supabase = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const [counts, week] = await Promise.all([
    Promise.all(TALENT_STATUSES.map((s) => supabase.from("talent_profiles").select("id", { count: "exact", head: true }).eq("status", s))),
    supabase.from("talent_profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
  ]);
  let q = supabase
    .from("talent_profiles")
    .select("id, display_name, city, is_influencer, is_event_talent, categories, rank, status, created_at, social_accounts(handle, followers, engagement_rate, fetch_status, profile_pic_url)")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .limit(300);
  if (kind === "influencer") q = q.eq("is_influencer", true);
  if (kind === "event") q = q.eq("is_event_talent", true);
  const { data } = await q;
  const rows = (data ?? []) as unknown as Row[];
  const canReview = can(platform, "talent.approve");
  const count = (s: string) => counts[TALENT_STATUSES.indexOf(s as (typeof TALENT_STATUSES)[number])].count ?? 0;
  const link = (s: string, k: string) => `/admin?status=${s}${k ? `&kind=${k}` : ""}`;
  const back = link(status, kind);

  return (
    <>
      <TriageKeys />
      <ScreenHeader eyebrow="Admin" title="Talent screening" subtitle="Review new registrations, interview event talent and assign ranks." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="Awaiting review" value={count("pending")} icon={<Clock3 className="h-4 w-4" />} accent href={link("pending", "")} />
        <KpiTile label="In screening" value={count("screening")} icon={<ShieldCheck className="h-4 w-4" />} href={link("screening", "")} hint="Interviews / checks" />
        <KpiTile label="Approved" value={count("approved")} icon={<Check className="h-4 w-4" />} href={link("approved", "")} hint="Live in the pool" />
        <KpiTile label="Joined this week" value={week.count ?? 0} icon={<UserPlus className="h-4 w-4" />} hint="All statuses" />
      </div>

      {sp.error && <div className="mb-4"><Notice kind="error">{sp.error}</Notice></div>}

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <TabLinks label="Filter by status" items={TALENT_STATUSES.map((s) => ({ href: link(s, kind), label: s, count: count(s), active: s === status }))} />
        </div>
        <div role="group" aria-label="Talent type" className="inline-flex rounded-xl border border-line bg-ink p-1">
          {[["", "All"], ["influencer", "Influencers"], ["event", "Event"]].map(([k, l]) => (
            <Link key={k} href={link(status, k)} aria-current={kind === k ? "page" : undefined}
              className={clsx("inline-flex min-h-9 items-center rounded-lg px-3 text-xs font-medium", kind === k ? "bg-ink-3 text-fog" : "text-mute hover:text-fog")}>
              {l}
            </Link>
          ))}
        </div>
      </div>

      {canReview && rows.length > 0 && (
        <p className="mb-3 hidden text-xs text-mute md:block">
          Keyboard: <kbd className="rounded border border-line bg-ink-3 px-1">j</kbd>/<kbd className="rounded border border-line bg-ink-3 px-1">k</kbd> move ·
          {" "}<kbd className="rounded border border-line bg-ink-3 px-1">Enter</kbd> open ·
          {" "}<kbd className="rounded border border-line bg-ink-3 px-1">a</kbd> approve ·
          {" "}<kbd className="rounded border border-line bg-ink-3 px-1">s</kbd> screening ·
          {" "}<kbd className="rounded border border-line bg-ink-3 px-1">x</kbd> reject
        </p>
      )}

      {!rows.length ? (
        <EmptyState icon={<ShieldCheck className="h-5 w-5" />} title={`No ${status} talent`}>
          {status === "pending" ? "The queue is clear. New registrations will appear here." : "Nothing here for this filter."}
        </EmptyState>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {rows.map((t) => {
            const ig = t.social_accounts?.[0];
            return (
              <li key={t.id} data-triage-row className="group flex flex-wrap items-center gap-3 px-3 py-3 transition-colors focus-within:bg-ink-3/50 hover:bg-ink-3/30 sm:px-4 lg:flex-nowrap">
                <Link href={`/admin/talent/${t.id}`} data-triage-link className="flex min-w-0 flex-1 items-center gap-3 rounded-lg">
                  <Avatar src={ig?.profile_pic_url} name={t.display_name} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium group-hover:text-brand">{t.display_name}</span>
                      <Badge value={t.rank} />
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-mute">
                      {ig ? <span>@{ig.handle}</span> : <span>No Instagram</span>}
                      {ig?.fetch_status === "error" && <span className="inline-flex items-center gap-1 text-bad"><AlertTriangle aria-hidden className="h-3 w-3" />fetch failed</span>}
                      {t.city && <span className="inline-flex items-center gap-1"><MapPin aria-hidden className="h-3 w-3" />{t.city}</span>}
                      <span>{[t.is_influencer && "Influencer", t.is_event_talent && "Event"].filter(Boolean).join(" · ")}</span>
                    </span>
                  </span>
                </Link>

                <div className="hidden w-48 shrink-0 xl:block"><TagList items={t.categories} max={2} /></div>
                <dl className="flex shrink-0 gap-4 text-right text-xs tabular-nums">
                  <div><dt className="text-mute">Followers</dt><dd className="font-semibold">{fmtNum(ig?.followers)}</dd></div>
                  <div><dt className="text-mute">ER</dt><dd className="font-semibold">{fmtEr(ig?.engagement_rate)}</dd></div>
                  <div className="hidden sm:block"><dt className="text-mute">Joined</dt><dd>{timeAgo(t.created_at)}</dd></div>
                </dl>

                {canReview && (
                  <form action={quickReview} className="flex w-full shrink-0 items-center gap-1.5 sm:w-auto">
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="back" value={back} />
                    <label htmlFor={`rank-${t.id}`} className="sr-only">Rank for {t.display_name}</label>
                    <select id={`rank-${t.id}`} name="rank" defaultValue={t.rank} className="input w-28 py-1.5 text-xs capitalize">
                      {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {t.status !== "approved" && (
                      <button name="status" value="approved" data-triage-key="a" title="Approve (a)"
                        className="btn min-h-9 border border-ok/40 px-3 py-1 text-xs text-ok hover:bg-ok/10">
                        <Check aria-hidden className="h-3.5 w-3.5" /> Approve
                      </button>
                    )}
                    {t.status === "pending" && (
                      <button name="status" value="screening" data-triage-key="s" title="Move to screening (s)"
                        className="btn min-h-9 border border-info/40 px-2.5 py-1 text-xs text-info hover:bg-info/10" aria-label={`Move ${t.display_name} to screening`}>
                        <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {t.status !== "rejected" && (
                      <button name="status" value="rejected" data-triage-key="x" title="Reject (x)"
                        className="btn-danger min-h-9 px-2.5 py-1 text-xs" aria-label={`Reject ${t.display_name}`}>
                        <X aria-hidden className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {t.status === "approved" && (
                      <button name="status" value="approved" className="btn-ghost min-h-9 px-3 py-1 text-xs">Set rank</button>
                    )}
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
