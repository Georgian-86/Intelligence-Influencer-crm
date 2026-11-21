import { clsx } from "clsx";
import { Check, Minus, UserPlus } from "lucide-react";
import { Avatar, Progress } from "@/components/kit";
import { ActionNotice } from "@/components/admin/ui";
import { getTeam } from "@/components/admin/data";
import { requirePlatform } from "@/lib/session";
import { addMember, removeMember } from "../actions";

export const metadata = { title: "Team & roles" };

export default async function Team({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; demo?: string; done?: string }> }) {
  await requirePlatform("member.manage");
  const sp = await searchParams;
  const team = await getTeam();
  const has = (perms: string[], p: string) => perms.includes("*") || perms.includes(p);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.035em] sm:text-[36px]">Team & roles</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-mute">Who can see and change what across the CRM, admin and finance.</p>
      </div>
      <ActionNotice sp={sp} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="members" className="card overflow-hidden">
          <header className="flex items-baseline justify-between border-b border-line px-5 py-4">
            <h2 id="members" className="text-[16px] font-semibold">Members</h2>
            <span className="text-[12.5px] tabular-nums text-mute">{team.members.length} active{team.invites.length ? ` · ${team.invites.length} invited` : ""}</span>
          </header>
          <div className="overflow-x-auto">
            <table className="table min-w-[640px]">
              <thead><tr><th>Member</th><th>Role</th><th>Workload</th><th>Last active</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {team.members.map((m) => (
                  <tr key={m.key}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} hue={m.hue} size={34} />
                        <div className="min-w-0"><div className="font-medium">{m.name}</div><div className="text-[12.5px] text-mute">{m.email}</div></div>
                      </div>
                    </td>
                    <td><span className="chip whitespace-nowrap">{m.role}</span></td>
                    <td className="w-40">
                      {m.load == null ? <span className="text-mute">—</span> : (
                        <div>
                          <div className={clsx("mb-1 text-[12.5px] font-semibold tabular-nums", m.load > 0.85 ? "text-bad" : "text-ink-2")}>{Math.round(m.load * 100)}%{m.load > 0.85 && " · over capacity"}</div>
                          <Progress value={m.load * 100} tone={m.load > 0.85 ? "bad" : "cobalt"} label={`${m.name} workload`} />
                        </div>
                      )}
                    </td>
                    <td className="text-mute">{m.last_active ?? "—"}</td>
                    <td className="text-right">
                      <form action={removeMember}><input type="hidden" name="user_id" value={m.user_id} /><input type="hidden" name="org_id" value={m.org_id} />
                        <button className="btn-quiet btn-sm text-mute hover:text-bad" aria-label={`Remove ${m.name}`}>Remove</button></form>
                    </td>
                  </tr>
                ))}
                {team.invites.map((i) => (
                  <tr key={i.email}>
                    <td><div className="flex items-center gap-3"><span className="grid h-[34px] w-[34px] place-items-center rounded-full border border-dashed border-line-2 text-mute"><UserPlus className="h-4 w-4" /></span><div><div className="font-medium">{i.email}</div><div className="text-[12.5px] text-mute">Invite sent {i.sent}</div></div></div></td>
                    <td><span className="chip whitespace-nowrap">{i.role}</span></td>
                    <td><span className="rounded-full bg-warn-bg px-2 py-0.5 text-[12px] font-medium text-warn">Pending</span></td>
                    <td className="text-mute">—</td><td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <form action={addMember} className="card h-fit space-y-4 p-6">
          <h2 className="flex items-center gap-2 text-[16px] font-semibold"><UserPlus className="h-4 w-4" /> Invite a teammate</h2>
          <label className="block"><span className="label">Work email</span><input name="email" type="email" required className="input" placeholder="name@vigorlaunchpad.com" /></label>
          <label className="block"><span className="label">Workspace</span>
            <select name="org_id" className="input">{team.orgs.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.type})</option>)}</select>
          </label>
          <label className="block"><span className="label">Role</span>
            <select name="role" className="input">{team.roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}</select>
          </label>
          <button className="btn-primary w-full">Send invite</button>
          <p className="text-[12px] text-mute">{process.env.SUPABASE_SERVICE_ROLE_KEY ? "New people get an email invite. People who already have an account are added straight away." : "People need an account first. Set SUPABASE_SERVICE_ROLE_KEY to send email invites."}</p>
        </form>
      </div>

      <section aria-labelledby="matrix" className="card mt-6 overflow-hidden">
        <header className="border-b border-line px-5 py-4">
          <h2 id="matrix" className="text-[16px] font-semibold">Role permissions</h2>
          <p className="text-[12.5px] text-mute">Read-only view. Roles are defined in the database.</p>
        </header>
        <div className="overflow-x-auto">
          <table className="table min-w-[720px]">
            <thead><tr><th>Permission</th>{team.matrix.map((r) => <th key={r.role} className="!text-center">{r.label}</th>)}</tr></thead>
            <tbody>
              {team.permissions.map((p) => (
                <tr key={p.key}>
                  <td><div className="font-medium">{p.label}</div><div className="text-[12px] text-faint">{p.key}</div></td>
                  {team.matrix.map((r) => (
                    <td key={r.role} className="text-center">
                      {has(r.perms, p.key)
                        ? <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-cobalt-50 text-cobalt"><Check className="h-3.5 w-3.5" strokeWidth={2.6} /><span className="sr-only">Allowed</span></span>
                        : <span className="inline-grid h-6 w-6 place-items-center text-faint"><Minus className="h-3.5 w-3.5" /><span className="sr-only">Not allowed</span></span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
