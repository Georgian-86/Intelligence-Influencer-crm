import { BriefComposer } from "@/components/crm/brief-composer";
import { PageHeader } from "@/components/crm/ui";
import { EmptyState } from "@/components/kit";
import { requireAgency } from "@/lib/session";
import { SAMPLE_BRAND_MESSAGE } from "@/lib/demo/crm";
import { listCampaignOptions, listTalent } from "../../_lib/data";

export default async function NewBrief({ searchParams }: { searchParams: Promise<{ campaign?: string; error?: string }> }) {
  const agency = await requireAgency("brief.manage");
  const sp = await searchParams;
  const [campaigns, talent] = await Promise.all([listCampaignOptions(agency.orgId), listTalent()]);
  return (
    <>
      <PageHeader back={{ href: "/crm/briefs", label: "Briefs" }} title="New brief" subtitle="Paste what the brand sent. We pull out the brief, you check it, matching creators update live." />
      {campaigns.length === 0
        ? <EmptyState title="Create a campaign first" body="Briefs live inside a campaign so budget, pipeline and reporting stay together." action={<a href="/crm/campaigns" className="btn-primary btn-sm">Go to campaigns</a>} />
        : <BriefComposer talent={talent} campaigns={campaigns} defaultCampaign={sp.campaign} sample={SAMPLE_BRAND_MESSAGE} error={sp.error} />}
    </>
  );
}
