import type { Stage } from "@/lib/constants";

/** Main pipeline flow, left → right. */
export const FLOW_STAGES = ["interested", "shortlisted", "contacted", "negotiating", "confirmed", "delivered"] as const satisfies readonly Stage[];
/** Terminal "out" stages, shown in a separate lane. */
export const OUT_STAGES = ["rejected", "dropped"] as const satisfies readonly Stage[];

export const STAGE_LABEL: Record<Stage, string> = {
  interested: "Interested",
  shortlisted: "Shortlisted",
  contacted: "Contacted",
  negotiating: "Negotiating",
  confirmed: "Confirmed",
  delivered: "Delivered",
  rejected: "Rejected",
  dropped: "Dropped",
};

/** Dot colour per stage (token classes only). */
export const STAGE_DOT: Record<Stage, string> = {
  interested: "bg-info",
  shortlisted: "bg-brand",
  contacted: "bg-brand-2",
  negotiating: "bg-warn",
  confirmed: "bg-ok",
  delivered: "bg-ok",
  rejected: "bg-bad",
  dropped: "bg-mute",
};

export function nextStage(stage: string): Stage | null {
  const i = (FLOW_STAGES as readonly string[]).indexOf(stage);
  return i >= 0 && i < FLOW_STAGES.length - 1 ? FLOW_STAGES[i + 1] : null;
}
