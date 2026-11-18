import Link from "next/link";
import { Badge, Empty, PageHeader, fmtNum } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requirePlatform } from "@/lib/session";
import { TALENT_STATUSES } from "@/lib/constants";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string }> }) {
  await requirePlatform();
  const sp = await searchParams;
  const status = (TALENT_STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status! : "pending";
  const supabase = await createClient();
  const counts = await Promise.all(
    TALENT_STATUSES.map((s) => supabase.from("talent_profiles").select("id", { count: "exact", head: true }).eq("status", s)),
  );
  let q = supabase
    .from("talent_profiles")
    .select("id, display_name, city, is_influencer, is_event_talent, categories, rank, created_at, social_accounts(handle, followers, engagement_rate, fetch_status)")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .limit(300);
  if (sp.kind === "influencer") q = q.eq("is_influencer", true);
  if (sp.kind === "event") q = q.eq("is_event_talent", true);
  const { data } = await q;

  return (
    <>
      <PageHeader title="Talent screening" subtitle="Review new registrations, interview event talent and assign ranks." />
      <div className="mb-4 flex flex-wrap gap-2">
        {TALENT_STATUSES.map((s, i) => (
          <Link key={s} href={`/admin?status=${s}${sp.kind ? `&kind=${sp.kind}` : ""}`}
            className={`chip px-3 py-1 text-sm capitalize ${s === status ? "border-brand text-brand" : "text-mute"}`}>
            {s} · {counts[i].count ?? 0}
          </Link>
        ))}
        <span className="mx-2 border-l border-line" />
        {[["", "All"], ["influencer", "Influencers"], ["event", "Event talent"]].map(([k, l]) => (
          <Link key={k} href={`/admin?status=${status}${k ? `&kind=${k}` : ""}`} className={`chip px-3 py-1 text-sm ${(sp.kind ?? "") === k ? "border-brand text-brand" : "text-mute"}`}>{l}</Link>
        ))}
      </div>
      {!data?.length ? <Empty title={`No ${status} talent`} /> : (
        <div className="card overflow-x-auto">
          <table className="table w-full min-w-[760px]">
            <thead><tr><th>Talent</th><th>City</th><th>Type</th><th>Instagram</th><th>Followers</th><th>Eng.</th><th>Rank</th><th>Registered</th></tr></thead>
            <tbody>
              {data.map((t) => {
                const ig = (t.social_accounts as unknown as { handle: string; followers: number | null; engagement_rate: number | null; fetch_status: string }[])?.[0];
                return (
                  <tr key={t.id}>
                    <td><Link href={`/admin/talent/${t.id}`} className="font-medium hover:text-brand">{t.display_name}</Link>
                      <div className="text-xs text-mute">{t.categories.slice(0, 3).join(", ")}</div></td>
                    <td>{t.city}</td>
                    <td className="text-xs text-mute">{[t.is_influencer && "Influencer", t.is_event_talent && "Event"].filter(Boolean).join(" · ")}</td>
                    <td className="text-mute">{ig ? `@${ig.handle}` : "—"}{ig?.fetch_status === "error" && <span className="ml-1 text-bad">⚠</span>}</td>
                    <td>{fmtNum(ig?.followers)}</td>
                    <td>{ig?.engagement_rate != null ? `${ig.engagement_rate}%` : "—"}</td>
                    <td><Badge value={t.rank} /></td>
                    <td className="text-mute">{new Date(t.created_at).toLocaleDateString("en-IN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
