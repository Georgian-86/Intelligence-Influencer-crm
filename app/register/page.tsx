import type { Metadata } from "next";
import { AuthScreen } from "@/components/onboarding/auth-screen";
import { isDemo } from "@/lib/demo";

export const metadata: Metadata = {
  title: "Join as a creator",
  description: "Create your Vigor Talent profile in a minute: sign in with Google or WhatsApp and we fetch your Instagram stats for you.",
  alternates: { canonical: "/register" },
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ type?: string; error?: string; next?: string }> }) {
  const sp = await searchParams;
  const type = sp.type === "event" ? "event" : "influencer";
  const next = sp.next?.startsWith("/") && !sp.next.startsWith("//") ? sp.next : type === "event" ? "/onboarding?type=event" : "/onboarding";
  return <AuthScreen mode="register" next={next} type={type} demo={isDemo()} notice={sp.error ? { kind: "error", text: sp.error } : null} />;
}
