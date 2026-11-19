import { TalentShell } from "@/components/talent/shell";
import { getAccess, getMyTalent, requireUser } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const [access, talent] = await Promise.all([getAccess(), getMyTalent()]);
  const switchLinks = [
    ...(access.some((a) => a.orgType === "agency") ? [{ href: "/crm", label: "CRM" }] : []),
    ...(access.some((a) => a.orgType === "platform") ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  const name = talent?.display_name ?? user.email?.split("@")[0] ?? "You";
  return (
    <TalentShell name={name} email={user.email} subtitle={talent?.city} switchLinks={switchLinks}>
      {children}
    </TalentShell>
  );
}
