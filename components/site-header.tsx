import Link from "next/link";
import { Logo } from "@/components/ui";
import { getUser } from "@/lib/session";

export async function SiteHeader() {
  const user = await getUser();
  return (
    <header className="sticky top-0 z-20 border-b border-line/60 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/brands" className="hidden px-3 py-2 text-mute hover:text-fog sm:inline">For brands</Link>
          {user ? (
            <Link href="/dashboard" className="btn-primary">My dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 text-mute hover:text-fog">Log in</Link>
              <Link href="/join" className="btn-primary">Join</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
