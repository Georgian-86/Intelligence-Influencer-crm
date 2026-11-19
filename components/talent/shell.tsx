import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { signOut } from "@/app/auth-actions";
import { SideNav, TabBar } from "./nav";

type Props = {
  name: string;
  email?: string | null;
  subtitle?: string | null;
  switchLinks?: { href: string; label: string }[];
  badges?: Partial<Record<string, number>>;
  children: React.ReactNode;
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "V";
}

export function Avatar({ name, className = "h-9 w-9 text-xs" }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-2 to-brand font-display font-bold text-black ${className}`}>
      {initials(name)}
    </span>
  );
}

function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOut}>
      <button
        className={compact
          ? "grid h-11 w-11 place-items-center rounded-xl text-mute transition-colors hover:bg-ink-3 hover:text-fog"
          : "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-mute transition-colors hover:bg-ink-3 hover:text-fog"}
        aria-label="Sign out"
      >
        <LogOut className="h-[18px] w-[18px]" aria-hidden />
        {!compact && "Sign out"}
      </button>
    </form>
  );
}

/**
 * Talent (creator / event talent) app shell.
 * Mobile: slim top bar + fixed bottom tab bar. Desktop (lg+): sticky left sidebar.
 */
export function TalentShell({ name, email, subtitle, switchLinks = [], badges, children }: Props) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <a href="#talent-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-black">
        Skip to content
      </a>

      {/* Desktop sidebar. Kept rendered (invisible, zero-size) below lg rather than display:none, because
          LogoMark's SVG gradient uses a fixed id and the first instance in the DOM must stay paintable. */}
      <aside className="sticky top-0 flex h-dvh flex-col border-r border-line bg-ink-2/70 p-4 max-lg:invisible max-lg:fixed max-lg:h-0 max-lg:w-0 max-lg:overflow-hidden max-lg:border-0 max-lg:p-0">
        <div className="px-1 pb-6 pt-1"><Logo href="/dashboard" /></div>
        <SideNav badges={badges} />
        <div className="mt-auto space-y-1 border-t border-line pt-4">
          {switchLinks.map((s) => (
            <Link key={s.href} href={s.href} className="flex min-h-10 items-center rounded-xl px-3 text-sm text-mute transition-colors hover:bg-ink-3 hover:text-fog">
              Switch to {s.label} →
            </Link>
          ))}
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={name} />
            <div className="min-w-0 text-sm">
              <div className="truncate font-medium">{name}</div>
              <div className="truncate text-xs text-mute">{email ?? subtitle}</div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-x-0 border-t-0 px-4 lg:hidden">
        <Logo href="/dashboard" compact />
        <div className="flex items-center gap-1">
          {switchLinks.map((s) => (
            <Link key={s.href} href={s.href} className="btn-quiet min-h-11 px-3 text-xs">{s.label}</Link>
          ))}
          <SignOutButton compact />
        </div>
      </header>

      <main id="talent-main" className="relative isolate min-w-0 overflow-x-clip px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden">
          <div className="absolute left-1/2 top-[-12rem] h-[24rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_106_26/0.12),transparent)]" />
        </div>
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      <TabBar badges={badges} />
    </div>
  );
}
