import { AppShell, type NavItem } from "@/components/app-shell";
import { getAccess, getUser, requireAgency } from "@/lib/session";
import { isDemo } from "@/lib/demo";
import { Toaster } from "@/components/crm/toast";
import { listEnquiries } from "./_lib/data";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const agency = await requireAgency();
  const user = await getUser();
  const access = await getAccess();
  const enquiries = await listEnquiries().catch(() => []);
  const newEnquiries = enquiries.filter((e) => e.status === "new").length;
  const links = [{ href: "/dashboard", label: "My talent dashboard" }];
  if (access.some((a) => a.orgType === "platform")) links.unshift({ href: "/admin", label: "Admin panel" });
  const demo = isDemo();
  const nav: NavItem[] = [
    { href: "/crm", label: "Today", icon: "House", group: "Workspace" },
    { href: "/crm/talent", label: "Talent", icon: "Users", group: "Workspace" },
    { href: "/crm/campaigns", label: "Campaigns", icon: "Rocket", group: "Workspace" },
    { href: "/crm/briefs", label: "Briefs", icon: "FileText", group: "Workspace" },
    { href: "/crm/enquiries", label: "Enquiries", icon: "Inbox", group: "Workspace", badge: newEnquiries || undefined },
    { href: "/crm/cockpit", label: "Founder cockpit", icon: "Gauge", group: "Insights" },
  ];
  return (
    <AppShell
      area="CRM"
      orgName={agency.orgName}
      // Demo mode signs everyone in as the creator fixture; the CRM speaks as an account manager.
      userName={demo ? "Kunal Shah" : undefined}
      email={demo ? "kunal@vigorlaunchpad.com" : user?.email}
      switchLinks={links}
      nav={nav}
    >
      {children}
      <Toaster />
    </AppShell>
  );
}
