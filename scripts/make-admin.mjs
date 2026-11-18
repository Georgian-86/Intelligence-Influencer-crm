// Usage: npm run make-admin -- someone@example.com
// Grants super_admin on the platform org and org_owner on the Vigor Marketing agency.
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error("Usage: npm run make-admin -- <email>");
  process.exit(1);
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data: profile, error } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
if (error || !profile) {
  console.error(`No account for ${email}. Sign up on the site first.`);
  process.exit(1);
}
const rows = [
  { user_id: profile.id, org_id: "00000000-0000-0000-0000-000000000001", role: "super_admin" },
  { user_id: profile.id, org_id: "00000000-0000-0000-0000-000000000002", role: "org_owner" },
];
const { error: e2 } = await db.from("memberships").upsert(rows, { onConflict: "user_id,org_id" });
if (e2) {
  console.error(e2.message);
  process.exit(1);
}
console.log(`${email} is now super admin + Vigor Marketing owner.`);
