import { AppShell, type NavItem } from "@/components/app-shell";
import { requireBrand } from "@/lib/brand-access";
import { getBrandCampaigns } from "@/lib/brand-data";
import { signOut } from "@/app/auth-actions";

export default async function BrandLayout({ children }: { children: React.ReactNode }) {
  const brand = await requireBrand();
  const campaigns = await getBrandCampaigns(brand);
  const active = campaigns.filter((c) => c.status !== "completed");
  const shortlistCount = active.reduce((a, c) => a + c.shortlist_pending, 0);
  const reviewCount = active.reduce((a, c) => a + c.reviews_pending, 0);
  const shortlistId = (active.find((c) => c.shortlist_pending > 0) ?? active.find((c) => c.phase === "shortlist") ?? active[0])?.id;
  const reviewId = (active.find((c) => c.reviews_pending > 0) ?? active.find((c) => c.phase === "content" || c.phase === "live") ?? active[0])?.id;
  const reportId = (active.find((c) => c.phase === "live") ?? campaigns.find((c) => c.deliverables_live > 0) ?? active[0])?.id;
  const nav: NavItem[] = [{ href: "/brand", label: "Overview", icon: "LayoutDashboard" }];
  if (shortlistId) nav.push({ href: `/brand/campaigns/${shortlistId}/shortlist`, label: "Shortlist", icon: "UserRoundCheck", badge: shortlistCount || undefined, group: "Approvals" });
  if (reviewId) nav.push({ href: `/brand/campaigns/${reviewId}/review`, label: "Content review", icon: "Clapperboard", badge: reviewCount || undefined, group: "Approvals" });
  if (reportId) nav.push({ href: `/brand/reports/${reportId}`, label: "Reports", icon: "ChartColumnBig", group: "Results" });
  nav.push({ href: "/brand/new-brief", label: "New brief", icon: "Plus", group: "Results" });
  return (
    <AppShell area="Brand" accent="flame" orgName={brand.orgName} userName={brand.userName} email={brand.email} signOutAction={brand.demo ? undefined : signOut} nav={nav}>
      {children}
    </AppShell>
  );
}
