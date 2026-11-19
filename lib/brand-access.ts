import "server-only";
import { redirect } from "next/navigation";
import { getAccess, getUser, requireUser, type OrgAccess } from "@/lib/session";
import { isDemo } from "@/lib/demo";
import { BRAND_ORG } from "@/lib/demo/portal";

export type BrandAccess = OrgAccess & { userName: string; email?: string; demo: boolean };

/**
 * Gate for the brand portal (/brand). In demo mode the signed-in user is a Domino's India
 * brand manager; live, the user needs a membership in an organisation of type "brand".
 * Brands never receive creator contact details (decision log D4).
 */
export async function requireBrand(): Promise<BrandAccess> {
  if (isDemo()) {
    const access = await getAccess();
    const brand = access.find((a) => a.orgType === "brand");
    return {
      ...(brand ?? { orgId: "demo-brand", orgType: "brand", role: "brand_admin", perms: new Set(["*"]) }),
      orgName: BRAND_ORG.name,
      userName: BRAND_ORG.contact,
      email: BRAND_ORG.email,
      demo: true,
    };
  }
  await requireUser("/brand");
  const [access, user] = await Promise.all([getAccess(), getUser()]);
  const brand = access.find((a) => a.orgType === "brand");
  if (!brand) redirect("/no-access?area=brand");
  const meta = (user?.user_metadata ?? {}) as { full_name?: string };
  return { ...brand, userName: meta.full_name ?? user?.email?.split("@")[0] ?? "You", email: user?.email ?? undefined, demo: false };
}
