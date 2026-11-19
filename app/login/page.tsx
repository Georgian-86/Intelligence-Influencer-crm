import type { Metadata } from "next";
import { AuthScreen } from "@/components/onboarding/auth-screen";
import { isDemo } from "@/lib/demo";

export const metadata: Metadata = { title: "Log in", alternates: { canonical: "/login" }, robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; checkEmail?: string; confirmed?: string; expired?: string }> }) {
  const sp = await searchParams;
  const next = sp.next?.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/dashboard";
  const notice = sp.error
    ? { kind: "error" as const, text: sp.error }
    : sp.expired
      ? { kind: "error" as const, text: "That sign-in link has expired or was opened on another device. Sign in again below." }
      : sp.checkEmail
        ? { kind: "ok" as const, text: "Check your inbox and confirm your email, then sign in here." }
        : sp.confirmed
          ? { kind: "ok" as const, text: "Your email is confirmed. Sign in to continue." }
          : null;
  return <AuthScreen mode="login" next={next} type="influencer" demo={isDemo()} notice={notice} />;
}
