"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBrand } from "@/lib/brand-access";

export type BriefState = { ok: boolean; error?: string; summary?: string } | null;

/** Brand brief request → lands in the agency's enquiries inbox (brand_enquiries). */
export async function submitBrief(_: BriefState, formData: FormData): Promise<BriefState> {
  const brand = await requireBrand();
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const goal = get("goal"), where = get("where"), budget = get("budget"), start = get("start"), end = get("end");
  if (!goal || !where || !budget || !start) return { ok: false, error: "Add a goal, where you want to run, a budget range and a start date." };
  if (end && end < start) return { ok: false, error: "The end date is before the start date." };
  const summary = `${goal} · ${where} · ${budget} · ${start}${end ? ` to ${end}` : ""}`;
  if (brand.demo) return { ok: true, summary };
  const supabase = await createClient();
  const { error } = await supabase.from("brand_enquiries").insert({
    company: brand.orgName, contact_name: brand.userName, email: brand.email ?? "unknown@brand", requirement: `[Brand portal brief] ${summary}`, budget,
  });
  if (error) return { ok: false, error: "Couldn't send the brief. Try again, or WhatsApp us." };
  return { ok: true, summary };
}

type Ok = { ok: boolean; error?: string };
const DECISION = { approve: "approved", pass: "passed", question: "question" } as const;

/** Shortlist room: send approve / pass / question for each creator back to the agency. */
export async function sendShortlistDecisions(campaignId: string, entries: { id: string; d: "approve" | "pass" | "question"; q: string | null }[]): Promise<Ok> {
  const brand = await requireBrand();
  if (brand.demo) return { ok: true };
  if (!entries.length) return { ok: false, error: "Make at least one decision first." };
  const supabase = await createClient();
  for (const e of entries.slice(0, 200)) {
    const { error } = await supabase.rpc("brand_decide", { p_intent: e.id, p_decision: DECISION[e.d], p_note: e.q });
    if (error) return { ok: false, error: /shortlist/i.test(error.message) ? "One of these creators is no longer on your shortlist. Refresh and try again." : "Couldn't send your decisions. Try again." };
  }
  revalidatePath("/brand", "layout");
  void campaignId;
  return { ok: true };
}

/** Content review room: approve, or request changes with reasons and a note. */
export async function brandReview(deliverableId: string, decision: "approve" | "changes" | "comment", reasons: string[] = [], note = ""): Promise<Ok> {
  const brand = await requireBrand();
  if (brand.demo) return { ok: true };
  const body = [reasons.length ? reasons.join(", ") : "", note.trim()].filter(Boolean).join(". ");
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_deliverable", { p_id: deliverableId, p_decision: decision, p_body: body });
  if (error) return { ok: false, error: /cannot review/i.test(error.message) ? "This draft is no longer shared with you." : error.message };
  revalidatePath("/brand", "layout");
  return { ok: true };
}
