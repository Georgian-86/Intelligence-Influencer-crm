import Link from "next/link";
import { Building2, Inbox, IndianRupee, Mail, MapPin, Megaphone, Phone } from "lucide-react";
import { Badge } from "@/components/ui";
import { EmptyState, ScreenHeader, TabLinks } from "@/components/crm/primitives";
import { AutoSubmitSelect } from "@/components/crm/auto-submit";
import { timeAgo } from "@/components/crm/format";
import { createClient } from "@/lib/supabase/server";
import { can, requireAgency } from "@/lib/session";
import { setEnquiryStatus } from "../actions";

const STATUSES = ["new", "in_progress", "converted", "closed"] as const;

export default async function Enquiries({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const agency = await requireAgency("enquiry.view");
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("brand_enquiries").select("*").order("created_at", { ascending: false });
  const all = data ?? [];
  const filter = (STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status : undefined;
  const shown = filter ? all.filter((e) => e.status === filter) : all;
  const canCampaign = can(agency, "campaign.manage");

  return (
    <>
      <ScreenHeader eyebrow="Bookings" title="Brand enquiries" subtitle="Requirements submitted from the public “For brands” page." />

      <div className="mb-4">
        <TabLinks label="Filter by status" items={[
          { href: "/crm/enquiries", label: "All", count: all.length, active: !filter },
          ...STATUSES.map((s) => ({ href: `/crm/enquiries?status=${s}`, label: s.replace("_", " "), count: all.filter((e) => e.status === s).length, active: filter === s })),
        ]} />
      </div>

      {!shown.length ? (
        <EmptyState icon={<Inbox className="h-5 w-5" />} title={filter ? `No ${filter.replace("_", " ")} enquiries` : "No enquiries yet"}>
          New requirements from brands land here.
        </EmptyState>
      ) : (
        <ul className="grid gap-3">
          {shown.map((e) => (
            <li key={e.id} className={`card p-4 sm:p-5 ${e.status === "new" ? "border-l-2 border-l-brand" : ""}`}>
              <div className="flex flex-wrap items-start gap-3">
                <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-3 text-mute"><Building2 className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-sans text-base font-semibold tracking-normal">{e.company}</h2>
                    <Badge value={e.status} />
                    <time dateTime={e.created_at} title={new Date(e.created_at).toLocaleString("en-IN")} className="text-xs text-mute">{timeAgo(e.created_at)}</time>
                  </div>
                  <div className="mt-0.5 text-sm text-mute">{e.contact_name}</div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <a href={`mailto:${e.email}`} className="inline-flex min-h-8 items-center gap-1.5 text-brand hover:underline"><Mail aria-hidden className="h-3.5 w-3.5" />{e.email}</a>
                    {e.phone && <a href={`tel:${e.phone}`} className="inline-flex min-h-8 items-center gap-1.5 hover:text-brand"><Phone aria-hidden className="h-3.5 w-3.5 text-mute" />{e.phone}</a>}
                    {e.city && <span className="inline-flex min-h-8 items-center gap-1.5 text-mute"><MapPin aria-hidden className="h-3.5 w-3.5" />{e.city}</span>}
                    {e.budget && <span className="inline-flex min-h-8 items-center gap-1.5 text-mute"><IndianRupee aria-hidden className="h-3.5 w-3.5" />{e.budget}</span>}
                  </div>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  {canCampaign && e.status !== "closed" && (
                    <Link href={`/crm/campaigns?brand=${encodeURIComponent(e.company)}#new`} className="btn-ghost min-h-9 py-1.5 text-xs">
                      <Megaphone aria-hidden className="h-3.5 w-3.5" /> Start campaign
                    </Link>
                  )}
                  <form action={setEnquiryStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={e.id} />
                    <label htmlFor={`enq-${e.id}`} className="sr-only">Status for {e.company}</label>
                    <AutoSubmitSelect id={`enq-${e.id}`} name="status" defaultValue={e.status} className="input w-36 py-1.5 text-xs capitalize">
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </AutoSubmitSelect>
                    <noscript><button className="btn-ghost px-2 py-1 text-xs">Set</button></noscript>
                  </form>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-line rounded-xl border border-line bg-ink p-3 text-sm leading-relaxed">{e.requirement}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
