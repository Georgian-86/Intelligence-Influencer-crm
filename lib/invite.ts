import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE } from "@/lib/site";

export type AttachResult = { ok: true; invited: boolean } | { ok: false; error: string };

/**
 * Give `email` a role in `orgId`. Existing accounts are attached straight away. New people get a
 * Supabase invite email (when SUPABASE_SERVICE_ROLE_KEY is set) that signs them in and lands them on `next`.
 * The membership itself is written with the caller's client, so RLS still decides who may grant what.
 */
export async function attachMember(supabase: SupabaseClient, email: string, orgId: string, role: string, next = "/"): Promise<AttachResult> {
  let { data: profile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
  let invited = false;
  if (!profile) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, error: `No account found for ${email}. Ask them to sign up first, or set SUPABASE_SERVICE_ROLE_KEY to send invites.` };
    const redirectTo = `${SITE.url}/auth/callback?next=${encodeURIComponent(next)}`;
    const { data, error } = await createAdminClient().auth.admin.inviteUserByEmail(email, { redirectTo });
    if (error || !data.user) return { ok: false, error: `Could not send the invite: ${error?.message ?? "unknown error"}` };
    profile = { id: data.user.id };
    invited = true;
  }
  const { error } = await supabase.from("memberships").upsert({ user_id: profile.id, org_id: orgId, role }, { onConflict: "user_id,org_id" });
  if (error) {
    const msg = /cannot be used in a/i.test(error.message) ? "That role doesn't fit this kind of workspace. Pick a role for the same type (agency, brand or platform)." : error.message;
    return { ok: false, error: msg };
  }
  return { ok: true, invited };
}

export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "brand";
