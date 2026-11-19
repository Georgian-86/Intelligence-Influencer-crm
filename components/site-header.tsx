import { getUser } from "@/lib/session";
import { HeaderBar } from "@/components/landing/header-bar";

/**
 * Session-aware header for app-adjacent pages (login, register, onboarding).
 * The bar is fixed, so a spacer keeps content clear of it. Marketing pages render
 * <HeaderBar /> directly so they stay static and their heroes can sit under the glass.
 */
export async function SiteHeader() {
  const user = await getUser();
  return (
    <>
      <HeaderBar loggedIn={!!user} />
      <div aria-hidden className="h-20 sm:h-24" />
    </>
  );
}
