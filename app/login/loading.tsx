import { AuthShellSkeleton } from "@/components/onboarding/auth-shell";

export default function Loading() {
  return (
    <>
      <div aria-hidden="true" className="h-16 border-b border-white/[0.07]" />
      <AuthShellSkeleton fields={2} />
    </>
  );
}
