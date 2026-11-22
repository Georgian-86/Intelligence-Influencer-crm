import { AppShell, type NavItem } from "@/components/app-shell";
import { getAccess, getUser, hasTalentProfile, requireAgency } from "@/lib/session";
import { signOut } from "@/app/auth-actions";
import { isDemo } from "@/lib/demo";
import { Toaster } from "@/components/crm/toast";
import { listEnquiries } from "./_lib/data";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const agency = await requireAgency();
  const user = await getUser();
  const access = await getAccess();
  const enquiries = await listEnquiries().catch(() => []);
  const newEnquiries = enquiries.filter((e) => e.status === "new").length;
  // Switch links follow the user's real memberships only.
  const links: { href: string; label: string }[] = [];
  if (access.some((a) => a.orgType === "platform")) links.push({ href: "/admin", label: "Admin panel" });
  if (access.some((a) => a.orgType === "brand")) links.push({ href: "/brand", label: "Brand portal" });
  if (await hasTalentProfile()) links.push({ href: "/dashboard", label: "My talent dashboard" });
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
      userName={demo ? "Kunal Shah" : undefined}
      email={demo ? "kunal@vigorlaunchpad.com" : user?.email}
      switchLinks={links}
      signOutAction={signOut}
      nav={nav}
    >
      {children}
      <Toaster />
    </AppShell>
  );
}
