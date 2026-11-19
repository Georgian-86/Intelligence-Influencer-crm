import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/kit";
import { EnquiryBoard } from "@/components/crm/enquiry-board";
import { PageHeader } from "@/components/crm/ui";
import { can, requireAgency } from "@/lib/session";
import { crmNow, listEnquiries } from "../_lib/data";

export default async function Enquiries() {
  const agency = await requireAgency("enquiry.view");
  const items = await listEnquiries();
  const open = items.filter((e) => e.status === "new").length;
  return (
    <>
      <PageHeader title="Enquiries" subtitle={`${open} new brand lead${open === 1 ? "" : "s"} from WhatsApp, email, the website and referrals`} />
      {items.length === 0
        ? <EmptyState icon={<Inbox className="h-5 w-5" />} title="No enquiries yet" body="Leads from the “For brands” page and forwarded WhatsApp messages land here." />
        : <EnquiryBoard items={items.filter((e) => e.status !== "closed")} now={crmNow()} canConvert={can(agency, "campaign.manage")} />}
    </>
  );
}
