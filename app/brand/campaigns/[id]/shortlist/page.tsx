import Link from "next/link";
import { ArrowLeft, UserRoundCheck } from "lucide-react";
import { EmptyState } from "@/components/kit";
import { PageTitle, shortDate } from "@/components/brand-portal/parts";
import { ShortlistDeck } from "@/components/brand-portal/shortlist-deck";
import { requireBrand } from "@/lib/brand-access";
import { getPortalCampaign, SHORTLISTS, SHORTLIST_TARGET } from "@/lib/demo/portal";

export const metadata = { title: "Approve shortlist" };

export default async function ShortlistPage({ params }: { params: Promise<{ id: string }> }) {
  const brand = await requireBrand();
  const { id } = await params;
  const campaign = brand.demo ? getPortalCampaign(id) : undefined;
  const creators = brand.demo ? SHORTLISTS[id] ?? [] : [];

  return (
    <>
      <Link href="/brand" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-mute hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Overview</Link>
      <PageTitle
        eyebrow={campaign ? `${campaign.name} · goes live ${shortDate(campaign.go_live)}` : "Shortlist"}
        title="Approve your creators"
        subtitle={creators.length
          ? <>Vigor picked {creators.length} creators for this brief. Approve {SHORTLIST_TARGET}, pass on the rest, or ask us anything. Decisions are due tomorrow, 6 pm.</>
          : undefined}
      />
      {creators.length ? (
        <ShortlistDeck creators={creators} target={SHORTLIST_TARGET} campaignName={campaign?.name ?? "this campaign"} deliverable="1 Reel + 3 Stories with link sticker" />
      ) : (
        <EmptyState icon={<UserRoundCheck className="h-5 w-5" />} title="Nothing to approve right now"
          body="When Vigor sends a new shortlist for this campaign it will appear here, and we'll ping you on WhatsApp."
          action={<Link href="/brand" className="btn-ghost">Back to overview</Link>} />
      )}
    </>
  );
}
