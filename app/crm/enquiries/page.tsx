import { Badge, Empty, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/session";
import { setEnquiryStatus } from "../actions";

export default async function Enquiries() {
  await requireAgency("enquiry.view");
  const supabase = await createClient();
  const { data } = await supabase.from("brand_enquiries").select("*").order("created_at", { ascending: false });
  return (
    <>
      <PageHeader title="Brand enquiries" subtitle="Requirements submitted from the public 'For brands' page." />
      {!data?.length ? <Empty title="No enquiries yet" /> : (
        <div className="space-y-3">
          {data.map((e) => (
            <div key={e.id} className="card p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{e.company} <span className="font-normal text-mute">· {e.contact_name}</span></div>
                  <div className="text-xs text-mute">
                    <a href={`mailto:${e.email}`} className="text-brand">{e.email}</a>{e.phone ? ` · ${e.phone}` : ""}{e.city ? ` · ${e.city}` : ""}{e.budget ? ` · ${e.budget}` : ""} · {new Date(e.created_at).toLocaleString("en-IN")}
                  </div>
                </div>
                <form action={setEnquiryStatus} className="flex items-center gap-2">
                  <Badge value={e.status} />
                  <input type="hidden" name="id" value={e.id} />
                  <select name="status" defaultValue={e.status} className="input w-32 py-1 text-xs">
                    {["new", "in_progress", "converted", "closed"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                  <button className="btn-ghost px-2 py-1 text-xs">Set</button>
                </form>
              </div>
              <p className="mt-3 whitespace-pre-line">{e.requirement}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
