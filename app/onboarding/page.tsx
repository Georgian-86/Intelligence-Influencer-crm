import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getMyTalent, requireUser } from "@/lib/session";
import { cityFromGeoHeaders } from "@/lib/colleges";

export const metadata: Metadata = { title: "Set up your profile", robots: { index: false } };

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ type?: string; error?: string }> }) {
  const user = await requireUser("/onboarding");
  const sp = await searchParams;
  const talent = await getMyTalent();
  if (talent) redirect(sp.error ? `/dashboard/profile?error=${encodeURIComponent(sp.error)}` : "/dashboard");
  const type = sp.type === "event" ? "event" : "influencer";

  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
  const defaultName = String(meta.full_name ?? meta.name ?? "").trim().slice(0, 80);
  const geoCity = cityFromGeoHeaders(await headers());

  return (
    <>
      <SiteHeader />
      <main id="main" className="relative overflow-x-clip">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] overflow-hidden">
          <div className="absolute left-1/2 top-[-16rem] h-[30rem] w-[52rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_106_26/0.14),transparent)]" />
        </div>
        <div className="relative">
          <OnboardingFlow type={type} defaultName={defaultName} defaultCity={geoCity ?? ""} cityFromGeo={!!geoCity} />
        </div>
      </main>
    </>
  );
}
