import { clsx } from "clsx";
import { CircleCheck, FileText, Wallet } from "lucide-react";
import { EmptyState } from "@/components/kit";
import { lakh, shortDate } from "@/components/crm/format";
import { can, type OrgAccess } from "@/lib/session";
import { isDemo } from "@/lib/demo";
import { createInvoice, setInvoiceStatus, updateCampaignPlan, updatePayout } from "../../actions";
import { campaignPlanOptions, liveInvoices, livePayouts, type InvoiceVM, type PayoutVM } from "../../_lib/execution";
import type { CampaignWorkspace } from "../../_lib/data";

const inr = (n: number | null | undefined) => (n == null ? "—" : `₹${n.toLocaleString("en-IN")}`);

const PAY_TONE: Record<PayoutVM["status"], string> = { pending: "bg-canvas-2 text-ink-2", approved: "bg-info-bg text-info", paid: "bg-ok-bg text-ok", failed: "bg-bad-bg text-bad" };
const INV_TONE: Record<InvoiceVM["status"], string> = { draft: "bg-canvas-2 text-ink-2", sent: "bg-warn-bg text-warn", paid: "bg-ok-bg text-ok", void: "bg-canvas-2 text-faint line-through" };

/** Plan & billing tab: campaign plan + brand link, creator payouts and brand invoices. */
export async function MoneyTab({ agency, ws }: { agency: OrgAccess; ws: CampaignWorkspace }) {
  const c = ws.campaign;
  const demo = isDemo();
  const finance = can(agency, "finance.manage");
  const [opts, payouts, invoices] = demo
    ? [{ brands: [], team: [] }, [] as PayoutVM[], [] as InvoiceVM[]]
    : await Promise.all([campaignPlanOptions(agency.orgId), livePayouts(agency.orgId, c.id), liveInvoices(agency.orgId, c.id)]);
  const back = `/crm/campaigns/${c.id}?tab=money`;
  const creatorCost = payouts.reduce((a, p) => a + p.amount, 0);
  const billed = invoices.filter((i) => i.status !== "void" && i.status !== "draft").reduce((a, i) => a + i.amount, 0);
  const collected = invoices.filter((i) => i.status === "paid").reduce((a, i) => a + i.amount, 0);
  const margin = c.budget ? c.budget - creatorCost : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Campaign budget" value={lakh(c.budget)} hint="What the brand pays, before GST" />
        <Stat label="Creator cost" value={lakh(creatorCost)} hint={`${payouts.length} bookings`} />
        <Stat label="Gross margin" value={margin != null ? lakh(margin) : "—"} hint={margin != null && c.budget ? `${Math.round((margin / c.budget) * 100)}% of budget` : "Set a budget to see margin"} tone={margin != null && c.budget && margin / c.budget < 0.25 ? "warn" : undefined} />
        <Stat label="Collected" value={lakh(collected)} hint={`${lakh(billed)} invoiced`} />
      </div>

      {can(agency, "campaign.manage") && (
        <section className="card p-5" aria-labelledby="plan">
          <h2 id="plan" className="font-display text-[16px] font-semibold">Plan</h2>
          <p className="mb-4 text-[12.5px] text-mute">Targets drive the health badge and the brand&apos;s overview. Linking a brand account gives them the portal: shortlist approvals, content review and the live report.</p>
          <form action={updateCampaignPlan} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input type="hidden" name="id" value={c.id} />
            <Field label="Budget (₹)" name="budget" value={c.budget} numeric />
            <Field label="Creators to book" name="creators_target" value={c.target} numeric />
            <Field label="Start" name="start_date" value={c.start} type="date" />
            <Field label="End" name="end_date" value={c.end} type="date" />
            <Field label="Content goes live" name="go_live" value={c.goLive ?? null} type="date" />
            <Field label="Target views" name="views_target" value={c.targets?.views ?? null} numeric />
            <Field label="Target reach" name="reach_target" value={c.targets?.reach ?? null} numeric />
            <Field label="Target engagement %" name="er_target" value={c.targets?.er ?? null} numeric />
            <label className="text-[12.5px] font-medium text-ink-2">Owner
              <select name="owner_id" defaultValue={c.ownerId ?? ""} className="input mt-1 h-10">
                <option value="">Unassigned</option>
                {opts.team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label className="text-[12.5px] font-medium text-ink-2 sm:col-span-2">Brand portal account
              <select name="brand_org_id" defaultValue={c.brandOrgId ?? ""} className="input mt-1 h-10">
                <option value="">Not linked (brand works over WhatsApp / email)</option>
                {opts.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <span className="mt-1 block text-[11.5px] font-normal text-mute">Brand accounts are created by platform admins under Admin → Brands.</span>
            </label>
            <div className="flex items-end"><button className="btn-primary h-10 w-full">Save plan</button></div>
          </form>
        </section>
      )}

      <section className="card overflow-hidden" aria-labelledby="payouts">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
          <h2 id="payouts" className="font-display text-[16px] font-semibold">Creator payouts</h2>
          <p className="text-[12.5px] text-mute">Created when a creator is confirmed. Approve after content is live; mark paid with the bank UTR.</p>
        </div>
        {payouts.length === 0 ? (
          <div className="p-5"><EmptyState icon={<Wallet className="h-5 w-5" />} title="No payouts yet" body="Confirm creators in the pipeline and their payouts appear here." /></div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13.5px] [&_td]:border-t [&_td]:border-line [&_td]:px-5 [&_td]:py-2.5 [&_th]:px-5 [&_th]:py-2 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-mute">
              <thead><tr><th>Creator</th><th className="!text-right">Fee</th><th className="!text-right">TDS</th><th className="!text-right">Net</th><th>Due</th><th>Status</th><th>{finance ? "Update" : ""}</th></tr></thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold">{p.name}{!p.delivered && p.status === "pending" && <span className="ml-2 text-[11.5px] font-normal text-mute">awaiting delivery</span>}</td>
                    <td className="text-right tabular-nums">{inr(p.amount)}</td>
                    <td className="text-right tabular-nums text-ink-2">{inr(p.tds)}</td>
                    <td className="text-right font-semibold tabular-nums">{inr(p.amount - p.tds)}</td>
                    <td className="tabular-nums text-ink-2">{p.status === "paid" ? <span className="inline-flex items-center gap-1 text-ok"><CircleCheck className="h-3.5 w-3.5" />{shortDate(p.paidAt?.slice(0, 10))}</span> : shortDate(p.due)}</td>
                    <td><span className={clsx("inline-flex h-6 items-center rounded-full px-2 text-[12px] font-semibold capitalize", PAY_TONE[p.status])}>{p.status}</span>{p.utr && <div className="mt-0.5 text-[11px] text-mute">UTR {p.utr}</div>}</td>
                    <td>
                      {finance && p.status !== "paid" && (
                        <form action={updatePayout} className="flex items-center gap-1.5">
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="back" value={back} />
                          <input name="tds" defaultValue={p.tds || ""} placeholder="TDS" inputMode="numeric" aria-label="TDS amount" className="input h-8 w-20 text-[12.5px]" />
                          <input name="utr" defaultValue={p.utr ?? ""} placeholder="UTR" aria-label="Bank UTR" className="input h-8 w-28 text-[12.5px]" />
                          <select name="status" defaultValue={p.status} aria-label="Payout status" className="input h-8 w-28 text-[12.5px]">
                            {["pending", "approved", "paid", "failed"].map((st) => <option key={st} value={st} disabled={!p.delivered && (st === "approved" || st === "paid")}>{st}</option>)}
                          </select>
                          <button className="btn-quiet btn-sm h-8">Save</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-5" aria-labelledby="invoices">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="invoices" className="font-display text-[16px] font-semibold">Brand invoices</h2>
          <p className="text-[12.5px] text-mute">Numbered VIG-year-#### · GST added on top</p>
        </div>
        {invoices.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-[13px] text-mute"><FileText className="h-4 w-4" /> No invoices yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {invoices.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 py-2.5 text-[13.5px]">
                <span className="w-32 font-semibold tabular-nums">{i.number}</span>
                <span className="min-w-0 flex-1 text-ink-2">{i.label ?? "Invoice"} · issued {shortDate(i.issued)}{i.due ? ` · due ${shortDate(i.due)}` : ""}</span>
                <span className="tabular-nums">{inr(i.amount)} <span className="text-[12px] text-mute">+ {inr(i.gst)} GST</span></span>
                <span className={clsx("inline-flex h-6 items-center rounded-full px-2 text-[12px] font-semibold capitalize", INV_TONE[i.status])}>{i.status}</span>
                {finance && i.status !== "paid" && i.status !== "void" && (
                  <span className="flex gap-1">
                    {(i.status === "draft" ? ["sent", "void"] : ["paid", "void"]).map((st) => (
                      <form key={st} action={setInvoiceStatus}>
                        <input type="hidden" name="id" value={i.id} /><input type="hidden" name="status" value={st} /><input type="hidden" name="back" value={back} />
                        <button className="btn-quiet btn-sm h-8 capitalize">{st === "sent" ? "Mark sent" : st === "paid" ? "Mark paid" : "Void"}</button>
                      </form>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {finance && (
          <form action={createInvoice} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1.4fr_1fr_0.6fr_1fr_auto_auto] sm:items-end">
            <input type="hidden" name="campaign_id" value={c.id} />
            <label className="text-[12.5px] font-medium text-ink-2">Label<input name="label" placeholder="e.g. 50% advance" className="input mt-1 h-10" /></label>
            <label className="text-[12.5px] font-medium text-ink-2">Amount before GST (₹)<input name="amount" inputMode="numeric" required className="input mt-1 h-10" /></label>
            <label className="text-[12.5px] font-medium text-ink-2">GST %<input name="gst_pct" defaultValue="18" inputMode="decimal" className="input mt-1 h-10" /></label>
            <label className="text-[12.5px] font-medium text-ink-2">Due<input type="date" name="due_date" className="input mt-1 h-10" /></label>
            <button name="send" value="0" className="btn-ghost h-10">Save draft</button>
            <button name="send" value="1" className="btn-primary h-10">Create &amp; mark sent</button>
          </form>
        )}
        {!finance && <p className="mt-3 text-[12px] text-mute">Only agency owners and admins can raise invoices and pay creators.</p>}
      </section>
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "warn" }) {
  return (
    <div className="card p-4">
      <div className="text-[13px] font-medium text-mute">{label}</div>
      <div className={clsx("mt-1.5 font-display text-[24px] font-semibold tabular-nums tracking-[-0.03em]", tone === "warn" && "text-warn")}>{value}</div>
      {hint && <div className="mt-1 text-[12px] text-mute">{hint}</div>}
    </div>
  );
}

function Field({ label, name, value, type = "text", numeric }: { label: string; name: string; value: number | string | null; type?: string; numeric?: boolean }) {
  return (
    <label className="text-[12.5px] font-medium text-ink-2">{label}
      <input name={name} type={type} defaultValue={value ?? ""} inputMode={numeric ? "decimal" : undefined} className="input mt-1 h-10" />
    </label>
  );
}
