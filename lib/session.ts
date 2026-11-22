import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { isDemo } from "@/lib/demo";
import { DEMO_COOKIE, PERSONA_USERS, isPersona, type DemoPersona } from "@/lib/demo/persona";

/** Demo mode only: the persona picked on /login, or null when signed out. */
export const getDemoPersona = cache(async (): Promise<DemoPersona | null> => {
  if (!isDemo()) return null;
  const v = (await cookies()).get(DEMO_COOKIE)?.value;
  return isPersona(v) ? v : null;
});

export const getUser = cache(async () => {
  if (isDemo()) {
    const persona = await getDemoPersona();
    if (!persona) return null;
    const u = PERSONA_USERS[persona];
    return { id: u.id, email: u.email, user_metadata: { full_name: u.name } } as unknown as import("@supabase/supabase-js").User;
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

export async function requireUser(next = "/dashboard") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export type OrgAccess = {
  orgId: string;
  orgName: string;
  orgType: "platform" | "agency" | "brand";
  role: string;
  perms: Set<string>;
};

/** All org memberships of the current user with their permission sets. */
export const getAccess = cache(async (): Promise<OrgAccess[]> => {
  if (isDemo()) {
    // Each demo persona holds only the membership a real user of that kind would have.
    const all = new Set(["*"]);
    const persona = await getDemoPersona();
    if (persona === "admin") return [{ orgId: "demo-platform", orgName: "Vigor Platform", orgType: "platform", role: "platform_ops", perms: all }];
    if (persona === "agency") return [{ orgId: "demo-agency", orgName: "Vigor Launchpad", orgType: "agency", role: "org_owner", perms: all }];
    if (persona === "brand") return [{ orgId: "demo-brand", orgName: "Domino's India", orgType: "brand", role: "brand_admin", perms: all }];
    return [];
  }
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("memberships")
    .select("org_id, role, organizations(name, type)")
    .eq("user_id", user.id);
  const { data: rolePerms } = await supabase.from("role_permissions").select("role, permission");
  return (memberships ?? []).map((m) => {
    const org = m.organizations as unknown as { name: string; type: OrgAccess["orgType"] };
    return {
      orgId: m.org_id,
      orgName: org?.name ?? "",
      orgType: org?.type ?? "agency",
      role: m.role,
      perms: new Set((rolePerms ?? []).filter((rp) => rp.role === m.role).map((rp) => rp.permission)),
    };
  });
});

export function can(access: OrgAccess | undefined, perm: string) {
  return !!access && (access.perms.has("*") || access.perms.has(perm));
}

/** The agency workspace the CRM operates on (first agency membership for Phase 1). */
/** Whether the signed-in user has a creator profile (decides if "My talent dashboard" is offered). */
export const hasTalentProfile = cache(async (): Promise<boolean> => {
  if (isDemo()) return (await getDemoPersona()) === "creator";
  const user = await getUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase.from("talent_profiles").select("id").eq("user_id", user.id).maybeSingle();
  return !!data;
});

export async function requireAgency(perm = "talent.view") {
  await requireUser("/crm");
  const access = await getAccess();
  const agency = access.find((a) => a.orgType === "agency" && can(a, perm));
  if (!agency) redirect("/no-access?area=crm");
  return agency;
}

export async function requirePlatform(perm = "talent.view") {
  await requireUser("/admin");
  const access = await getAccess();
  const platform = access.find((a) => a.orgType === "platform" && can(a, perm));
  if (!platform) redirect("/no-access?area=admin");
  return platform;
}

export const getMyTalent = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("talent_profiles").select("*").eq("user_id", user.id).maybeSingle();
  return data;
});
