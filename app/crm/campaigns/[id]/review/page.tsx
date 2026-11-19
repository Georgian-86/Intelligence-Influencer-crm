import Link from "next/link";
import { notFound } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { EmptyState } from "@/components/kit";
import { ReviewRoom } from "@/components/crm/review-room";
import { BrandTile } from "@/components/crm/ui";
import { requireAgency } from "@/lib/session";
import { getCreator } from "@/lib/demo/fixtures";
import { crmNow, getCampaignWorkspace, getSubmissions } from "../../../_lib/data";

export default async function ReviewRoomPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ d?: string }> }) {
  const agency = await requireAgency();
  const { id } = await params;
  const { d } = await searchParams;
  const ws = await getCampaignWorkspace(id, agency.orgId);
  if (!ws) notFound();
  const c = ws.campaign;
  const items = getSubmissions(id).map((s) => {
    const t = getCreator(s.creator_id);
    return { ...s, name: t?.display_name ?? "Creator", handle: t?.handle ?? "" };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/crm/campaigns/${id}`} className="inline-flex h-7 items-center text-[13px] font-medium text-mute hover:text-ink">← {c.name}</Link>
      </div>
      <header className="flex flex-wrap items-center gap-3">
        <BrandTile name={c.brand} hue={c.hue} size={40} />
        <div>
          <h1 className="font-display text-[24px] font-semibold leading-tight tracking-[-0.035em]">Content review</h1>
          <p className="text-[13px] text-mute">{c.brand} · {items.length} submissions · approvals are logged and shared with the brand when visible</p>
        </div>
      </header>
      {items.length === 0 ? (
        <EmptyState icon={<Clapperboard className="h-5 w-5" />} title="No drafts submitted yet" body="Confirmed creators upload drafts from their dashboard. Each version lands here with its own comment thread." />
      ) : (
        <ReviewRoom items={items} brand={c.brand} now={crmNow()} initialId={d} />
      )}
    </div>
  );
}
