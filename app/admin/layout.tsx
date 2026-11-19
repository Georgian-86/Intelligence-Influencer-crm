import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { SIDEBAR_COOKIE } from "@/components/crm/shell-config";
import { roleLabel } from "@/components/crm/format";
import { createClient } from "@/lib/supabase/server";
import { can, getAccess, getUser, requirePlatform } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const platform = await requirePlatform();
  const user = await getUser();
  const access = await getAccess();
  const links = [{ href: "/dashboard", label: "My talent dashboard" }];
  if (access.some((a) => a.orgType === "agency")) links.unshift({ href: "/crm", label: "CRM" });

  const supabase = await createClient();
  const { count: pending } = await supabase.from("talent_profiles").select("id", { count: "exact", head: true }).eq("status", "pending");
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";

  return (
    <AppShell
      area="Admin"
      orgName={platform.orgName}
      role={roleLabel(platform.role)}
      email={user?.email}
      switchLinks={links}
      defaultCollapsed={collapsed}
      nav={[
        { href: "/admin", label: "Talent screening", icon: "shield", match: ["/admin/talent"], exact: true, badge: pending ?? 0, section: "Network" },
        ...(can(platform, "member.manage")
          ? [{ href: "/admin/team", label: "Team & roles", icon: "team" as const, section: "Settings" }]
          : []),
      ]}
    >
      {children}
    </AppShell>
  );
}
