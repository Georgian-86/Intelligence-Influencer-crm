import { getUser } from "@/lib/session";
import { HeaderBar } from "@/components/landing/header-bar";

/** Sticky marketing header. Server part resolves the session; the bar itself is a small client island. */
export async function SiteHeader() {
  const user = await getUser();
  return <HeaderBar loggedIn={!!user} />;
}
