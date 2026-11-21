"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw, Send } from "lucide-react";
import { refreshCampaignMetrics, shareShortlist } from "@/app/crm/actions";
import { toast } from "./toast";

/** "Share with brand": publishes every shortlisted-or-later creator to the brand portal. */
export function ShareShortlistButton({ campaignId, pending, brand, linked }: { campaignId: string; pending: number; brand: string; linked: boolean }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => start(async () => {
        const r = await shareShortlist(campaignId);
        if (!r.ok) { toast(r.error ?? "Couldn't share", { tone: "error" }); return; }
        toast(`Shared ${r.shared} creator${r.shared === 1 ? "" : "s"} with ${brand}`);
        router.refresh();
      })}
      className="btn-ghost btn-sm"
      title={linked ? `Send the shortlist to ${brand}'s portal for approval` : "Link a brand account in Plan & billing first"}
    >
      <Send className="h-3.5 w-3.5" /> Share with brand{pending > 0 && <span className="rounded-full bg-cobalt px-1.5 text-[11px] font-bold text-white">{pending}</span>}
    </button>
  );
}

export function RefreshMetricsButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => start(async () => {
        const r = await refreshCampaignMetrics(campaignId);
        if (!r.ok) { toast(r.error ?? "Couldn't refresh", { tone: "error" }); return; }
        toast(r.updated ? `Updated numbers for ${r.updated} post${r.updated === 1 ? "" : "s"}` : "No new numbers yet. Instagram posts update after the creator's next sync.");
        router.refresh();
      })}
      className="btn-ghost btn-sm"
    >
      <RefreshCw className={busy ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /> Refresh numbers
    </button>
  );
}
