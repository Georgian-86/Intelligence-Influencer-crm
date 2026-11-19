import { AppShell } from "@/components/app-shell";
import { requireBrand } from "@/lib/brand-access";
import { signOut } from "@/app/auth-actions";
import { PORTAL_CAMPAIGNS, SHORTLISTS, REVIEWS } from "@/lib/demo/portal";

export default async function BrandLayout({ children }: { children: React.ReactNode }) {
  const brand = await requireBrand();
  const shortlistCount = brand.demo ? (SHORTLISTS.k6?.length ?? 0) : undefined;
  const reviewCount = brand.demo ? REVIEWS.length : undefined;
  const live = PORTAL_CAMPAIGNS.find((c) => c.phase === "live")?.id ?? "k1";
  return (
    <AppShell
      area="Brand"
      accent="flame"
      orgName={brand.orgName}
      userName={brand.userName}
      email={brand.email}
      signOutAction={brand.demo ? undefined : signOut}
      nav={[
        { href: "/brand", label: "Overview", icon: "LayoutDashboard" },
        { href: "/brand/campaigns/k6/shortlist", label: "Shortlist", icon: "UserRoundCheck", badge: shortlistCount, group: "Approvals" },
        { href: "/brand/campaigns/k1/review", label: "Content review", icon: "Clapperboard", badge: reviewCount, group: "Approvals" },
        { href: `/brand/reports/${live}`, label: "Reports", icon: "ChartColumnBig", group: "Results" },
        { href: "/brand/new-brief", label: "New brief", icon: "Plus", group: "Results" },
      ]}
    >
      {children}
    </AppShell>
  );
}
