import { AppShell } from "@/components/app-shell";
import { getAccess, getUser, hasTalentProfile, requirePlatform } from "@/lib/session";
import { isDemo } from "@/lib/demo";
import { signOut } from "@/app/auth-actions";
import { getPlatformOverview } from "@/components/admin/data";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const platform = await requirePlatform();
  const [user, access, overview] = await Promise.all([getUser(), getAccess(), getPlatformOverview()]);
  // Switch links follow the user's real memberships only.
  const links: { href: string; label: string }[] = [];
  if (access.some((a) => a.orgType === "agency")) links.push({ href: "/crm", label: "Agency CRM" });
  if (access.some((a) => a.orgType === "brand")) links.push({ href: "/brand", label: "Brand portal" });
  if (await hasTalentProfile()) links.push({ href: "/dashboard", label: "My talent dashboard" });
  const demo = isDemo();
  return (
    <AppShell
      area="Admin"
      orgName={platform.orgName}
      userName={demo ? "Sahil Desai" : undefined}
      email={demo ? "sahil@vigorlaunchpad.com" : user?.email}
      switchLinks={links}
      signOutAction={signOut}
      nav={[
        { href: "/admin", label: "Screening", icon: "ShieldCheck", badge: overview.kpis.pending || undefined },
        { href: "/admin/brands", label: "Brands", icon: "Building2" },
        { href: "/admin/team", label: "Team & roles", icon: "Users" },
      ]}
    >
      {children}
    </AppShell>
  );
}
