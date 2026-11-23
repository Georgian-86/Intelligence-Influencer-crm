import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getAccess, getUser, hasTalentProfile } from "@/lib/session";
import { signOut } from "@/app/auth-actions";

const AREA: Record<string, string> = { admin: "admin panel", crm: "agency CRM", brand: "brand portal" };

export default async function NoAccess({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const { area } = await searchParams;
  const [user, access, creator] = await Promise.all([getUser(), getAccess(), hasTalentProfile()]);
  const home = access.some((a) => a.orgType === "platform") ? { href: "/admin", label: "Go to the admin panel" }
    : access.some((a) => a.orgType === "agency") ? { href: "/crm", label: "Go to the CRM" }
    : access.some((a) => a.orgType === "brand") ? { href: "/brand", label: "Go to the brand portal" }
    : creator ? { href: "/dashboard", label: "Go to my dashboard" } : { href: "/", label: "Go home" };
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">No access</h1>
        <p className="mt-2 text-mute">
          {user?.email ? <><b className="font-semibold text-ink-2">{user.email}</b> doesn&apos;t</> : "Your account doesn't"} have a role in the {AREA[area ?? ""] ?? "CRM"}. Ask a Vigor admin to add you.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href={home.href} className="btn-ghost">{home.label}</Link>
          {user && <form action={signOut}><button className="btn-quiet">Sign in as someone else</button></form>}
        </div>
      </main>
    </>
  );
}
