import { Building2, UserPlus } from "lucide-react";
import { ActionNotice } from "@/components/admin/ui";
import { getBrandOrgs } from "@/components/admin/data";
import { requirePlatform } from "@/lib/session";
import { createBrandOrg, inviteBrandUser, removeMember } from "../actions";

export const metadata = { title: "Brands" };

export default async function Brands({ searchParams }: { searchParams: Promise<{ error?: string; done?: string; demo?: string; saved?: string }> }) {
  await requirePlatform("member.manage");
  const sp = await searchParams;
  const brands = await getBrandOrgs();
  const invites = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) || brands.some((b) => b.id === "demo-brand");

  return (
    <>
      <div className="mb-8">
        <h1 className="text-[24px] leading-tight sm:text-[26px]">Brands</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-mute">Brand workspaces and the people who sign in to the brand portal. They only ever see campaigns linked to their workspace, never creator contact details.</p>
      </div>
      <ActionNotice sp={sp} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {brands.length === 0 && <div className="card p-8 text-center text-[14px] text-mute">No brand workspaces yet. Create the first one on the right.</div>}
          {brands.map((b) => (
            <section key={b.id} aria-labelledby={`b-${b.id}`} className="card overflow-hidden">
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
                <h2 id={`b-${b.id}`} className="flex items-center gap-2 text-[16px] font-semibold"><Building2 className="h-4 w-4 text-mute" /> {b.name}</h2>
                <span className="text-[12.5px] text-mute">Since {b.created}</span>
              </header>
              <div className="grid gap-5 p-5 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-[12.5px] font-semibold uppercase tracking-wide text-mute">People</h3>
                  {b.people.length === 0 ? <p className="text-[13px] text-mute">Nobody yet.</p> : (
                    <ul className="divide-y divide-line text-[13.5px]">
                      {b.people.map((p) => (
                        <li key={p.user_id} className="flex items-center gap-3 py-2">
                          <span className="min-w-0 flex-1"><span className="block truncate font-medium">{p.name}</span><span className="block truncate text-[12px] text-mute">{p.email} · {p.role}</span></span>
                          <form action={removeMember}><input type="hidden" name="user_id" value={p.user_id} /><input type="hidden" name="org_id" value={b.id} /><button className="btn-quiet btn-sm text-mute hover:text-bad" aria-label={`Remove ${p.name}`}>Remove</button></form>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form action={inviteBrandUser} className="mt-3 flex flex-wrap gap-2">
                    <input type="hidden" name="org_id" value={b.id} />
                    <label className="min-w-0 flex-1"><span className="sr-only">Email</span><input name="email" type="email" required className="input" placeholder="name@brand.com" /></label>
                    <label><span className="sr-only">Role</span><select name="role" className="input"><option value="brand_admin">Admin</option><option value="brand_member">Viewer</option></select></label>
                    <button className="btn-ghost btn-sm"><UserPlus className="h-3.5 w-3.5" /> Add</button>
                  </form>
                </div>
                <div>
                  <h3 className="mb-2 text-[12.5px] font-semibold uppercase tracking-wide text-mute">Linked campaigns</h3>
                  {b.campaigns.length === 0 ? <p className="text-[13px] text-mute">None yet. Link one from the campaign&apos;s Plan &amp; billing tab in the CRM.</p> : (
                    <ul className="space-y-1.5 text-[13.5px]">{b.campaigns.map((c) => <li key={c.id} className="flex items-center justify-between gap-2"><span className="truncate">{c.name}</span><span className="chip">{c.status}</span></li>)}</ul>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>

        <form action={createBrandOrg} className="card h-fit space-y-4 p-6">
          <h2 className="flex items-center gap-2 text-[16px] font-semibold"><Building2 className="h-4 w-4" /> New brand workspace</h2>
          <label className="block"><span className="label">Brand name</span><input name="name" required className="input" placeholder="Brewhouse Coffee" /></label>
          <label className="block"><span className="label">First admin&apos;s email <span className="font-normal text-mute">(optional)</span></span><input name="email" type="email" className="input" placeholder="marketing@brand.com" /></label>
          <button className="btn-primary w-full">Create workspace</button>
          <p className="text-[12px] text-mute">{invites ? "New people get an email invite that signs them straight into the brand portal." : "Invites by email need SUPABASE_SERVICE_ROLE_KEY. Until then, people must sign up first and you add them here."}</p>
        </form>
      </div>
    </>
  );
}
