"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitEnquiry(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  if (get("website")) redirect("/brands?sent=1"); // honeypot
  const row = {
    company: get("company"),
    contact_name: get("contact_name"),
    email: get("email").toLowerCase(),
    phone: get("phone") || null,
    city: get("city") || null,
    requirement: get("requirement"),
    budget: get("budget") || null,
  };
  if (!row.company || !row.contact_name || !row.email || !row.requirement) {
    redirect("/brands?error=" + encodeURIComponent("Please fill in company, name, email and requirement."));
  }
  const supabase = await createClient();
  const { error } = await supabase.from("brand_enquiries").insert(row);
  if (error) redirect("/brands?error=" + encodeURIComponent("Could not send your enquiry. Please try again."));
  redirect("/brands?sent=1");
}
