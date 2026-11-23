/**
 * Demo mode has no real accounts, so the "signed-in user" is a persona kept in a cookie.
 * Each persona gets exactly the memberships a real user of that kind would have, so demo
 * mode shows the same role boundaries as production.
 */
export const DEMO_COOKIE = "vtn_demo_as";
export const DEMO_PERSONAS = ["creator", "agency", "admin", "brand"] as const;
export type DemoPersona = (typeof DEMO_PERSONAS)[number];

export const isPersona = (v: unknown): v is DemoPersona => typeof v === "string" && (DEMO_PERSONAS as readonly string[]).includes(v);

export const PERSONA_HOME: Record<DemoPersona, string> = { creator: "/dashboard", agency: "/crm", admin: "/admin", brand: "/brand" };

/** Which persona may open a path. Paths not listed are public. */
export function personaForPath(path: string): DemoPersona | "any" | null {
  if (path.startsWith("/crm")) return "agency";
  if (path.startsWith("/admin")) return "admin";
  if (path === "/brand" || path.startsWith("/brand/")) return "brand";
  if (path.startsWith("/dashboard")) return "creator";
  if (path.startsWith("/onboarding")) return "any";
  return null;
}

export const PERSONA_USERS: Record<DemoPersona, { id: string; email: string; name: string; label: string; blurb: string }> = {
  creator: { id: "demo-user", email: "aanya.mehta@nmims.edu", name: "Aanya Mehta", label: "Creator", blurb: "Aanya, a campus creator: briefs, applications, drafts and payouts" },
  agency: { id: "demo-am", email: "kunal@vigorlaunchpad.com", name: "Kunal Shah", label: "Agency team", blurb: "Kunal, an account manager: talent, campaigns, review and the cockpit" },
  admin: { id: "demo-admin", email: "sahil@vigorlaunchpad.com", name: "Sahil Desai", label: "Platform admin", blurb: "Sahil, platform ops: screening, team, roles and brand workspaces" },
  brand: { id: "demo-brand-user", email: "priya.nair@dominos.co.in", name: "Priya Nair", label: "Brand client", blurb: "Priya at Domino's: shortlist approvals, content review and reports" },
};
