import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDemo } from "@/lib/demo/mode";
import { DEMO_COOKIE, PERSONA_HOME, isPersona, personaForPath } from "@/lib/demo/persona";

export async function middleware(request: NextRequest) {
  // Email links that fall back to the Site URL arrive as /?code=… — finish sign-in properly.
  const code = request.nextUrl.searchParams.get("code");
  if (code && !request.nextUrl.pathname.startsWith("/auth/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    url.search = `?code=${encodeURIComponent(code)}&next=/onboarding`;
    return NextResponse.redirect(url);
  }
  // Demo mode (no Supabase configured): fixture data, signed in as one persona picked on /login.
  // Each persona only opens its own area, like a real account would.
  if (isDemo()) {
    const path = request.nextUrl.pathname;
    const need = personaForPath(path);
    if (!need) return NextResponse.next({ request });
    const persona = request.cookies.get(DEMO_COOKIE)?.value;
    const url = request.nextUrl.clone();
    if (!isPersona(persona)) {
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(path)}`;
      return NextResponse.redirect(url);
    }
    if (need !== "any" && need !== persona) {
      url.pathname = need === "creator" ? PERSONA_HOME[persona] : "/no-access";
      url.search = need === "creator" ? "" : `?area=${need === "agency" ? "crm" : need}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const protectedArea = ["/dashboard", "/crm", "/admin", "/brand", "/onboarding"].some((p) => path === p || path.startsWith(p + "/"));
  if (protectedArea && !data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
