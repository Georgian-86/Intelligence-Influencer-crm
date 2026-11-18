import { Field, Notice, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requirePlatform } from "@/lib/session";
import { addMember, removeMember } from "../actions";

export default async function Team({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requirePlatform("member.manage");
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: orgs }, { data: roles }, { data: members }] = await Promise.all([
    supabase.from("organizations").select("id, name, type").order("type"),
    supabase.from("roles").select("key, label, scope"),
    supabase.from("memberships").select("user_id, org_id, role, profiles(full_name, email), organizations(name, type)"),
  ]);
  return (
    <>
      <PageHeader title="Team & roles" subtitle="Give Vigor staff (and later partner agencies) access to the CRM and admin panel." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card overflow-x-auto lg:col-span-2">
          <table className="table w-full">
            <thead><tr><th>Member</th><th>Organisation</th><th>Role</th><th /></tr></thead>
            <tbody>
              {(members ?? []).map((m) => {
                const p = m.profiles as unknown as { full_name: string | null; email: string } | null;
                const o = m.organizations as unknown as { name: string; type: string } | null;
                return (
                  <tr key={`${m.user_id}-${m.org_id}`}>
                    <td><div className="font-medium">{p?.full_name ?? "—"}</div><div className="text-xs text-mute">{p?.email}</div></td>
                    <td>{o?.name} <span className="text-xs text-mute">({o?.type})</span></td>
                    <td>{roles?.find((r) => r.key === m.role)?.label ?? m.role}</td>
                    <td><form action={removeMember}><input type="hidden" name="user_id" value={m.user_id} /><input type="hidden" name="org_id" value={m.org_id} /><button className="text-xs text-mute hover:text-bad">Remove</button></form></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <form action={addMember} className="card h-fit space-y-4 p-5">
          <h2 className="font-semibold">Add member</h2>
          {sp.error && <Notice kind="error">{sp.error}</Notice>}
          {sp.saved && <Notice kind="ok">Member saved.</Notice>}
          <Field label="Email" hint="They must have signed up first."><input name="email" type="email" required className="input" /></Field>
          <Field label="Organisation">
            <select name="org_id" className="input">{(orgs ?? []).map((o) => <option key={o.id} value={o.id}>{o.name} ({o.type})</option>)}</select>
          </Field>
          <Field label="Role" hint="Platform roles apply to the Vigor Talent Network org; agency roles to agencies.">
            <select name="role" className="input">{(roles ?? []).map((r) => <option key={r.key} value={r.key}>{r.label} — {r.scope}</option>)}</select>
          </Field>
          <button className="btn-primary w-full">Save</button>
        </form>
      </div>
    </>
  );
}
