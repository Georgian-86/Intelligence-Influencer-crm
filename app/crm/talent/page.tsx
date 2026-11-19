import { TalentExplorer } from "@/components/crm/talent-explorer";
import { PageHeader } from "@/components/crm/ui";
import { can, requireAgency } from "@/lib/session";
import { SAVED_VIEWS } from "@/lib/demo/crm";
import { listOpenBriefs, listTalent } from "../_lib/data";

export default async function TalentSearch({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const agency = await requireAgency();
  const sp = await searchParams;
  const [rows, briefs] = await Promise.all([listTalent(), listOpenBriefs(agency.orgId)]);
  const qs = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : []))).toString();
  const campus = rows.filter((r) => r.campus).length;

  return (
    <>
      <PageHeader
        title="Talent"
        subtitle={<>{rows.length.toLocaleString("en-IN")} approved creators · {campus} on campus · ranked by fit for your open briefs</>}
      />
      <TalentExplorer rows={rows} briefs={briefs} initialQuery={qs} savedViews={SAVED_VIEWS} canExport={can(agency, "export")} canManage={can(agency, "pipeline.manage")} />
    </>
  );
}
