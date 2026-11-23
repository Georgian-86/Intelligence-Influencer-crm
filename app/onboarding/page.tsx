import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getMyTalent, requireUser } from "@/lib/session";
import { isDemo } from "@/lib/demo";
import { DEMO_BRIEFS } from "@/lib/demo/creator";
import { collegeFromEmail } from "@/lib/colleges";
import { CITIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Set up your profile", robots: { index: false } };

/** Map the edge's IP city header (Vercel / Cloudflare) onto our city list. */
function cityFromHeaders(h: Headers) {
  const raw = decodeURIComponent(h.get("x-vercel-ip-city") ?? h.get("cf-ipcity") ?? "").toLowerCase();
  if (!raw) return null;
  const alias: Record<string, string> = { bombay: "Mumbai", bengaluru: "Bangalore", "new delhi": "Delhi", gurugram: "Delhi", noida: "Delhi", "navi mumbai": "Mumbai", thane: "Mumbai" };
  return alias[raw] ?? CITIES.find((c) => c.toLowerCase() === raw) ?? null;
}

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await requireUser("/onboarding");
  const sp = await searchParams;
  const demo = isDemo();
  let openBriefs = DEMO_BRIEFS.filter((b) => b.status === "open").length;
  if (!demo) {
    if (await getMyTalent()) redirect("/dashboard");
    const supabase = await createClient();
    const { count } = await supabase.from("briefs").select("id", { count: "exact", head: true }).eq("status", "open");
    openBriefs = count ?? 0;
  }
  const college = collegeFromEmail(user.email);
  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
  return (
    <OnboardingFlow
      ctx={{
        demo,
        type: sp.type === "event" ? "event" : "influencer",
        email: user.email ?? null,
        name: meta.full_name ?? meta.name ?? null,
        phone: user.phone ? `+${user.phone.replace(/^\+/, "")}` : null,
        emailCollege: college ? { id: college.id, name: college.name, city: college.city } : null,
        ipCity: cityFromHeaders(await headers()),
        openBriefs,
      }}
    />
  );
}

/** Instagram fetches (Apify) take 10–30s; give server actions on these pages time to finish. */
export const maxDuration = 60;
