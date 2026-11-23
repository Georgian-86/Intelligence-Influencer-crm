import { Clock, FileText, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/kit";
import { PageTitle } from "@/components/brand-portal/parts";
import { BriefForm } from "@/components/brand-portal/brief-form";
import { requireBrand } from "@/lib/brand-access";
import { getBrandOverview } from "@/lib/brand-data";

export const metadata = { title: "New brief" };

export default async function NewBrief() {
  const brand = await requireBrand();
  const { am } = await getBrandOverview(brand);
  const first = am.name.split(" ")[0];
  return (
    <>
      <PageTitle title="Start a new campaign" subtitle="Four answers and we'll come back with a plan, a creator shortlist and an estimate. No deck needed." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <BriefForm />
        <aside className="space-y-4">
          <div className="rounded-[14px] bg-night p-6 text-white">
            <div className="flex items-center gap-3">
              <Avatar name={am.name} hue={am.hue} size={44} />
              <div>
                <div className="font-semibold">Or just WhatsApp us</div>
                <div className="text-[12.5px] text-white/70">{am.name}, your account manager</div>
              </div>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-white/80">Paste the brief, forward the deck or send a voice note. We&apos;ll turn it into a plan.</p>
            {am.whatsapp && <a href={`https://wa.me/${am.whatsapp}?text=${encodeURIComponent(`Hi ${first}, new brief from ${brand.demo ? "Domino's" : brand.orgName}:`)}`} className="btn-flame mt-5 w-full"><MessageCircle className="h-4 w-4" /> Open WhatsApp</a>}
            <p className="mt-2 text-center text-[12px] text-white/60">{am.replies}</p>
          </div>
          <div className="card p-5 text-[13.5px]">
            <div className="font-semibold">What happens next</div>
            <ul className="mt-3 space-y-3 text-ink-2">
              <li className="flex gap-2.5"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" /> Plan and estimate within 4 working hours</li>
              <li className="flex gap-2.5"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" /> First shortlist within 24 hours of sign-off</li>
              <li className="flex gap-2.5"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" /> Approvals happen here, on any phone</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
