import Link from "next/link";
import { Logo } from "@/components/ui";
import { signOut } from "@/app/auth-actions";
import { getAccess, requireUser } from "@/lib/session";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/briefs", label: "Open briefs" },
  { href: "/dashboard/applications", label: "My applications" },
  { href: "/dashboard/profile", label: "Edit profile" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const access = await getAccess();
  const hasCrm = access.some((a) => a.orgType === "agency");
  const hasAdmin = access.some((a) => a.orgType === "platform");
  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-2 text-sm">
            {hasCrm && <Link href="/crm" className="btn-ghost py-1.5">CRM</Link>}
            {hasAdmin && <Link href="/admin" className="btn-ghost py-1.5">Admin</Link>}
            <span className="hidden text-mute sm:inline">{user.email}</span>
            <form action={signOut}><button className="btn-ghost py-1.5">Sign out</button></form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 text-sm">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-mute hover:border-brand hover:text-fog">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
