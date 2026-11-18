import Link from "next/link";
import { Logo } from "@/components/ui";
import { signOut } from "@/app/auth-actions";

export function AppShell({
  area, orgName, email, nav, children, switchLinks,
}: {
  area: string;
  orgName: string;
  email?: string;
  nav: { href: string; label: string }[];
  switchLinks?: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-line bg-ink-2 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 p-4 lg:block">
          <Logo href={nav[0].href} />
          <div className="text-xs text-mute lg:mt-3">
            <span className="chip border-brand/40 text-brand">{area}</span> <span className="ml-1">{orgName}</span>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 text-sm lg:flex-col lg:px-3">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-mute hover:bg-ink-3 hover:text-fog">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden space-y-2 border-t border-line p-4 text-xs text-mute lg:block">
          {switchLinks?.map((s) => <Link key={s.href} href={s.href} className="block hover:text-fog">{s.label} →</Link>)}
          <div className="truncate pt-2">{email}</div>
          <form action={signOut}><button className="hover:text-fog">Sign out</button></form>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">{children}</main>
    </div>
  );
}
