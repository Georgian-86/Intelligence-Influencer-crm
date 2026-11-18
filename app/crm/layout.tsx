import { AppShell } from "@/components/app-shell";
import { getAccess, getUser, requireAgency } from "@/lib/session";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const agency = await requireAgency();
  const user = await getUser();
  const access = await getAccess();
  const links = [{ href: "/dashboard", label: "My talent dashboard" }];
  if (access.some((a) => a.orgType === "platform")) links.unshift({ href: "/admin", label: "Admin panel" });
  return (
    <AppShell area="CRM" orgName={agency.orgName} email={user?.email} switchLinks={links} nav={[
      { href: "/crm", label: "Overview" },
      { href: "/crm/talent", label: "Talent pool" },
      { href: "/crm/campaigns", label: "Campaigns & briefs" },
      { href: "/crm/enquiries", label: "Brand enquiries" },
    ]}>
      {children}
    </AppShell>
  );
}
