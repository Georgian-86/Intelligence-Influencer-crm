import Link from "next/link";
import { redirect } from "next/navigation";
import { Empty, PageHeader, fmtINR } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getMyTalent } from "@/lib/session";
import { withdrawInterest } from "../actions";

const talentStage: Record<string, [string, string]> = {
  interested: ["Applied", "border-info/40 text-info"],
  shortlisted: ["Shortlisted", "border-brand/50 text-brand"],
  contacted: ["In discussion", "border-brand/50 text-brand"],
  negotiating: ["In discussion", "border-warn/40 text-warn"],
  confirmed: ["Confirmed", "border-ok/40 text-ok"],
  delivered: ["Completed", "border-ok/40 text-ok"],
  rejected: ["Not selected", "border-line text-mute"],
  dropped: ["Closed", "border-line text-mute"],
};

export default async function Applications() {
  const talent = await getMyTalent();
  if (!talent) redirect("/onboarding");
  const supabase = await createClient();
  const { data: intents } = await supabase
    .from("intents")
    .select("id, stage, source, quoted_rate, created_at, brief_id, briefs(title, brand_display)")
    .eq("talent_id", talent.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="My applications" />
      {!intents?.length ? (
        <Empty title="No applications yet"><Link href="/dashboard/briefs" className="text-brand hover:underline">Browse open briefs</Link></Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table w-full">
            <thead><tr><th>Brief</th><th>Status</th><th>Your fee</th><th>Date</th><th /></tr></thead>
            <tbody>
              {intents.map((i) => {
                const b = i.briefs as unknown as { title: string; brand_display: string | null } | null;
                const [label, cls] = talentStage[i.stage];
                return (
                  <tr key={i.id}>
                    <td><div className="font-medium">{b?.title ?? "Brief closed"}</div><div className="text-xs text-mute">{b?.brand_display ?? ""}{i.source === "invited" ? " · Invited by Vigor" : ""}</div></td>
                    <td><span className={`chip ${cls}`}>{label}</span></td>
                    <td>{fmtINR(i.quoted_rate)}</td>
                    <td className="text-mute">{new Date(i.created_at).toLocaleDateString("en-IN")}</td>
                    <td>
                      {i.stage === "interested" && (
                        <form action={withdrawInterest}><input type="hidden" name="intent_id" value={i.id} /><button className="text-xs text-mute hover:text-bad">Withdraw</button></form>
                      )}
                    </td>
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
