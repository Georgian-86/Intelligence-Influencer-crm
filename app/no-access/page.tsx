import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default async function NoAccess({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const { area } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">No access</h1>
        <p className="mt-2 text-mute">
          Your account doesn&apos;t have a role in the {area === "admin" ? "admin panel" : "CRM"}. Ask a Vigor admin to add you.
        </p>
        <Link href="/dashboard" className="btn-ghost mt-6">Go to my dashboard</Link>
      </main>
    </>
  );
}
