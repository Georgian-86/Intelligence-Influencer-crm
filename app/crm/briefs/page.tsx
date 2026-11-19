import Link from "next/link";
import { FileText, WandSparkles } from "lucide-react";
import { EmptyState } from "@/components/kit";
import { BrandTile, PageHeader } from "@/components/crm/ui";
import { dueLabel, shortDate } from "@/components/crm/format";
import { can, requireAgency } from "@/lib/session";
import { crmNow, listBriefs } from "../_lib/data";

export default async function Briefs() {
  const agency = await requireAgency();
  const briefs = await listBriefs(agency.orgId);
  const now = crmNow();
  return (
    <>
      <PageHeader title="Briefs" subtitle={`${briefs.filter((b) => b.status === "open").length} open · creators see a brief only when they match it`}
        actions={can(agency, "brief.manage") && <Link href="/crm/briefs/new" className="btn-primary"><WandSparkles className="h-4 w-4" /> New brief from a message</Link>} />
      {briefs.length === 0 ? <EmptyState icon={<FileText className="h-5 w-5" />} title="No briefs yet" body="Paste a brand's WhatsApp or email and we'll structure it into a brief." action={<Link href="/crm/briefs/new" className="btn-primary btn-sm">New brief</Link>} /> : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-line">
            {briefs.map((b) => (
              <li key={b.id}>
                <Link href={`/crm/briefs/${b.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-canvas/60">
                  <BrandTile name={b.brand} hue={b.hue} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-semibold">{b.title}</div>
                    <div className="truncate text-[12.5px] text-mute">{b.brand} · {b.campaign}{b.cities.length ? ` · ${b.cities.join(", ")}` : ""}</div>
                  </div>
                  <div className="text-right text-[12.5px] tabular-nums text-mute"><strong className="text-[14px] font-semibold text-ink">{b.applicants}</strong> applicants{b.slots ? ` · ${b.slots} slots` : ""}</div>
                  <div className="w-28 text-right text-[12.5px] tabular-nums text-mute">{b.apply_by ? <>{shortDate(b.apply_by)} · {dueLabel(b.apply_by, now)}</> : "—"}</div>
                  <span className={`chip w-16 justify-center capitalize ${b.status === "open" ? "border-ok/30 bg-ok-bg text-ok" : ""}`}>{b.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
