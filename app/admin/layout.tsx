import { AppShell } from "@/components/app-shell";
import { getAccess, getUser, requirePlatform } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const platform = await requirePlatform();
  const user = await getUser();
  const access = await getAccess();
  const links = [{ href: "/dashboard", label: "My talent dashboard" }];
  if (access.some((a) => a.orgType === "agency")) links.unshift({ href: "/crm", label: "CRM" });
  return (
    <AppShell area="Admin" orgName={platform.orgName} email={user?.email} switchLinks={links} nav={[
      { href: "/admin", label: "Talent screening" },
      { href: "/admin/team", label: "Team & roles" },
    ]}>
      {children}
    </AppShell>
  );
}
