import Link from "next/link";
import { ArrowLeft, UserRoundCheck } from "lucide-react";
import { EmptyState } from "@/components/kit";
import { PageTitle, shortDate } from "@/components/brand-portal/parts";
import { ShortlistDeck } from "@/components/brand-portal/shortlist-deck";
import { requireBrand } from "@/lib/brand-access";
import { getBrandCampaign, getShortlist } from "@/lib/brand-data";

export const metadata = { title: "Approve shortlist" };

export default async function ShortlistPage({ params }: { params: Promise<{ id: string }> }) {
  const brand = await requireBrand();
  const { id } = await params;
  const [campaign, { creators, target, deliverable }] = await Promise.all([getBrandCampaign(brand, id), getShortlist(brand, id).catch(() => ({ creators: [], target: 0, deliverable: "" }))]);
  const open = creators.filter((c) => !c.decision).length;

  return (
    <>
      <Link href="/brand" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-mute hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Overview</Link>
      <PageTitle
        eyebrow={campaign ? `${campaign.name} · goes live ${shortDate(campaign.go_live)}` : "Shortlist"}
        title="Approve your creators"
        subtitle={creators.length
          ? brand.demo
            ? <>Vigor picked {creators.length} creators for this brief. Approve {target}, pass on the rest, or ask us anything. Decisions are due tomorrow, 6 pm.</>
            : <>Vigor picked {creators.length} creator{creators.length === 1 ? "" : "s"} for this brief{open < creators.length ? `, ${open} still waiting on you` : ""}. Approve, pass, or ask us anything. You can change a decision until contracts are signed.</>
          : undefined}
      />
      {creators.length ? (
        <ShortlistDeck creators={creators} target={target} campaignName={campaign?.name ?? "this campaign"} deliverable={deliverable} campaignId={id} amName={campaign?.owner_name ?? "Your account manager"} />
      ) : (
        <EmptyState icon={<UserRoundCheck className="h-5 w-5" />} title="Nothing to approve right now"
          body="When Vigor sends a new shortlist for this campaign it will appear here, and we'll ping you on WhatsApp."
          action={<Link href="/brand" className="btn-ghost">Back to overview</Link>} />
      )}
    </>
  );
}
