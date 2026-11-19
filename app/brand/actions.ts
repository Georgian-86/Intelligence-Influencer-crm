"use server";

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
