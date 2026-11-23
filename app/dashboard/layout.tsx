import { AppShell, type NavItem } from "@/components/app-shell";
import { signOut } from "@/app/auth-actions";
import { getAccess, requireUser } from "@/lib/session";
import { getBriefs, getCreator } from "./_lib/data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const [access, creator] = await Promise.all([getAccess(), getCreator()]);
  const matched = creator ? (await getBriefs(creator)).filter((b) => b.eligible && b.status === "open" && !b.applied).length : 0;
  const nav: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: "House", group: "Creator" },
    { href: "/dashboard/briefs", label: "Briefs", icon: "Megaphone", group: "Creator", badge: matched || undefined },
    { href: "/dashboard/applications", label: "Applications", icon: "ListChecks", group: "Creator" },
    { href: "/dashboard/profile", label: "Profile", icon: "UserRound", group: "Creator" },
  ];
  const switchLinks = [
    ...(access.some((a) => a.orgType === "agency") ? [{ href: "/crm", label: "Agency CRM" }] : []),
    ...(access.some((a) => a.orgType === "platform") ? [{ href: "/admin", label: "Admin" }] : []),
    ...(access.some((a) => a.orgType === "brand") ? [{ href: "/brand", label: "Brand portal" }] : []),
  ];
  return (
    <AppShell area="Creator" orgName="Vigor Talent" email={user.email ?? undefined} userName={creator?.name} nav={nav} switchLinks={switchLinks} signOutAction={signOut}>
      {children}
    </AppShell>
  );
}

/** Instagram fetches (Apify) take 10–30s; give server actions on these pages time to finish. */
export const maxDuration = 60;
