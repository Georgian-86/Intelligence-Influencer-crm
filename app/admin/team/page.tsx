import { Building2, KeyRound, UserPlus } from "lucide-react";
import { Field, Notice } from "@/components/ui";
import { Avatar, Panel, ScreenHeader } from "@/components/crm/primitives";
import { createClient } from "@/lib/supabase/server";
import { requirePlatform } from "@/lib/session";
import { addMember, removeMember } from "../actions";

type Member = {
  user_id: string; org_id: string; role: string;
  profiles: { full_name: string | null; email: string } | null;
  organizations: { name: string; type: string } | null;
};

export default async function Team({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requirePlatform("member.manage");
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: orgs }, { data: roles }, { data: members }] = await Promise.all([
    supabase.from("organizations").select("id, name, type").order("type"),
    supabase.from("roles").select("key, label, scope"),
    supabase.from("memberships").select("user_id, org_id, role, profiles(full_name, email), organizations(name, type)"),
  ]);
  const list = (members ?? []) as unknown as Member[];
  const byOrg = new Map<string, { name: string; type: string; members: Member[] }>();
  for (const m of list) {
    const g = byOrg.get(m.org_id) ?? { name: m.organizations?.name ?? "—", type: m.organizations?.type ?? "", members: [] };
    g.members.push(m);
    byOrg.set(m.org_id, g);
  }
  const groups = [...byOrg.entries()].sort((a, b) => (a[1].type === "platform" ? -1 : b[1].type === "platform" ? 1 : a[1].name.localeCompare(b[1].name)));
  const roleLabel = (k: string) => roles?.find((r) => r.key === k)?.label ?? k;

  return (
    <>
      <ScreenHeader eyebrow="Settings" title="Team & roles" subtitle="Give Vigor staff (and later partner agencies) access to the CRM and admin panel." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {!groups.length && <p className="text-sm text-mute">No members yet.</p>}
          {groups.map(([orgId, g]) => (
            <Panel key={orgId} icon={<Building2 className="h-4 w-4" />} bodyClassName="p-0 sm:p-0"
              title={<>{g.name} <span className="rounded bg-ink-3 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-mute">{g.type}</span></>}
              actions={<span className="text-xs text-mute">{g.members.length} member{g.members.length === 1 ? "" : "s"}</span>}>
              <ul className="divide-y divide-line">
                {g.members.map((m) => (
                  <li key={`${m.user_id}-${m.org_id}`} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <Avatar name={m.profiles?.full_name ?? m.profiles?.email} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{m.profiles?.full_name ?? "—"}</div>
                      <div className="truncate text-xs text-mute">{m.profiles?.email}</div>
                    </div>
                    <span className="chip shrink-0 border-brand/30 text-brand-2">{roleLabel(m.role)}</span>
                    <form action={removeMember}>
                      <input type="hidden" name="user_id" value={m.user_id} />
                      <input type="hidden" name="org_id" value={m.org_id} />
                      <button className="btn-quiet min-h-9 px-2.5 text-xs hover:text-bad" aria-label={`Remove ${m.profiles?.email ?? "member"} from ${g.name}`}>Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>

        <div className="space-y-6">
          <Panel title="Add member" icon={<UserPlus className="h-4 w-4" />} className="h-fit">
            <form action={addMember} className="space-y-4">
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
          </Panel>

          {(roles?.length ?? 0) > 0 && (
            <Panel title="Roles" icon={<KeyRound className="h-4 w-4" />}>
              <ul className="space-y-2 text-sm">
                {roles!.map((r) => (
                  <li key={r.key} className="flex items-center justify-between gap-2">
                    <span>{r.label}</span>
                    <span className="rounded bg-ink-3 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-mute">{r.scope}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
