import Link from "next/link";
import { ArrowLeft, Clapperboard } from "lucide-react";
import { EmptyState } from "@/components/kit";
import { PageTitle } from "@/components/brand-portal/parts";
import { ReviewRoom } from "@/components/brand-portal/review-room";
import { requireBrand } from "@/lib/brand-access";
import { CHANGE_REASONS, getPortalCampaign, REVIEWS } from "@/lib/demo/portal";

export const metadata = { title: "Review content" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const brand = await requireBrand();
  const { id } = await params;
  const campaign = brand.demo ? getPortalCampaign(id) : undefined;
  const items = brand.demo ? REVIEWS.filter((r) => r.campaign_id === id) : [];
  return (
    <>
      <Link href="/brand" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-mute hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Overview</Link>
      <PageTitle
        eyebrow={campaign?.name ?? "Content review"}
        title="Review content"
        subtitle={items.length ? <>{items.length} drafts are waiting. You have 24 hours per draft; after that Vigor follows up so the posting schedule holds.</> : undefined}
      />
      {items.length ? <ReviewRoom items={items} reasons={CHANGE_REASONS} /> : (
        <EmptyState icon={<Clapperboard className="h-5 w-5" />} title="You're all caught up"
          body="New drafts land here after Vigor's QA. We'll message you on WhatsApp when one is ready."
          action={<Link href="/brand" className="btn-ghost">Back to overview</Link>} />
      )}
    </>
  );
}
