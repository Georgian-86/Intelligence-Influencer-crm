import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { SIDEBAR_COOKIE } from "@/components/crm/shell-config";
import { roleLabel } from "@/components/crm/format";
import { createClient } from "@/lib/supabase/server";
import { can, getAccess, getUser, requireAgency } from "@/lib/session";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const agency = await requireAgency();
  const user = await getUser();
  const access = await getAccess();
  const links = [{ href: "/dashboard", label: "My talent dashboard" }];
  if (access.some((a) => a.orgType === "platform")) links.unshift({ href: "/admin", label: "Admin panel" });

  const showEnquiries = can(agency, "enquiry.view");
  let newEnquiries = 0;
  if (showEnquiries) {
    const supabase = await createClient();
    const { count } = await supabase.from("brand_enquiries").select("id", { count: "exact", head: true }).eq("status", "new");
    newEnquiries = count ?? 0;
  }
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";

  return (
    <AppShell
      area="CRM"
      orgName={agency.orgName}
      role={roleLabel(agency.role)}
      email={user?.email}
      switchLinks={links}
      searchAction="/crm/talent"
      searchPlaceholder="Search talent by name or @handle"
      defaultCollapsed={collapsed}
      nav={[
        { href: "/crm", label: "Overview", icon: "home", exact: true, section: "Workspace" },
        { href: "/crm/talent", label: "Talent pool", icon: "users", section: "Workspace" },
        { href: "/crm/campaigns", label: "Campaigns & briefs", icon: "campaigns", match: ["/crm/briefs"], section: "Bookings" },
        ...(showEnquiries
          ? [{ href: "/crm/enquiries", label: "Brand enquiries", icon: "inbox" as const, badge: newEnquiries, section: "Bookings" }]
          : []),
      ]}
    >
      {children}
    </AppShell>
  );
}
