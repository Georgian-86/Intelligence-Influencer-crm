"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseInstagramHandle, syncInstagramAccount } from "@/lib/instagram";

const str = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v || null;
};
const int = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").replace(/[^\d]/g, "");
  return v ? parseInt(v, 10) : null;
};
const list = (f: FormData, k: string) => f.getAll(k).map(String).filter(Boolean);

export async function saveTalentProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const back = String(formData.get("back") ?? "/onboarding");
  const fail = (msg: string) => redirect(`${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent(msg)}`);

  const isInfluencer = formData.get("is_influencer") === "on";
  const isEvent = formData.get("is_event_talent") === "on";
  const displayName = str(formData, "display_name");
  const phone = str(formData, "phone");
  const city = str(formData, "city");
  const igInput = str(formData, "instagram");
  const handle = igInput ? parseInstagramHandle(igInput) : null;

  if (!displayName || !phone || !city) return fail("Name, phone and city are required.");
  if (!isInfluencer && !isEvent) return fail("Choose at least one: influencer or event talent.");
  if (isInfluencer && !handle) return fail("Add a valid Instagram profile link or handle.");
  if (formData.get("consent_share") !== "on") return fail("Please accept the profile sharing consent to join the network.");

  const profile = {
    user_id: auth.user.id,
    display_name: displayName,
    city,
    gender: str(formData, "gender"),
    date_of_birth: str(formData, "date_of_birth"),
    languages: list(formData, "languages"),
    bio: str(formData, "bio"),
    is_influencer: isInfluencer,
    is_event_talent: isEvent,
    categories: [...list(formData, "niches"), ...list(formData, "event_categories")],
    skills: list(formData, "skills"),
    experience_years: int(formData, "experience_years"),
    experience_notes: str(formData, "experience_notes"),
    rate_half_day: int(formData, "rate_half_day"),
    rate_full_day: int(formData, "rate_full_day"),
    rate_per_post: int(formData, "rate_per_post"),
    rate_notes: str(formData, "rate_notes"),
    consent_share: true,
  };

  const { data: talent, error } = await supabase
    .from("talent_profiles")
    .upsert(profile, { onConflict: "user_id" })
    .select("id")
    .single();
  if (error || !talent) return fail("Could not save your profile. " + (error?.message ?? ""));

  await supabase.from("talent_contacts").upsert({
    talent_id: talent.id,
    email: auth.user.email,
    phone,
    whatsapp: str(formData, "whatsapp") ?? phone,
  });

  // Portfolio / performance video links
  const links = list(formData, "media_url").filter((u) => /^https?:\/\//i.test(u)).slice(0, 5);
  await supabase.from("talent_media").delete().eq("talent_id", talent.id);
  if (links.length) {
    await supabase.from("talent_media").insert(links.map((url) => ({ talent_id: talent.id, url, kind: "video" })));
  }

  // Instagram account (replace if handle changed)
  const { data: existing } = await supabase
    .from("social_accounts")
    .select("id, handle")
    .eq("talent_id", talent.id)
    .eq("platform", "instagram")
    .maybeSingle();
  let syncId: string | null = null;
  if (!isInfluencer && existing) {
    await supabase.from("social_accounts").delete().eq("id", existing.id);
  } else if (handle && existing?.handle !== handle) {
    if (existing) await supabase.from("social_accounts").delete().eq("id", existing.id);
    const { data: acc, error: accErr } = await supabase
      .from("social_accounts")
      .insert({ talent_id: talent.id, platform: "instagram", handle, url: `https://www.instagram.com/${handle}/` })
      .select("id")
      .single();
    if (accErr) {
      return fail(
        accErr.code === "23505"
          ? `@${handle} is already registered in the network. Contact us if this is your account.`
          : "Could not save Instagram account.",
      );
    }
    syncId = acc.id;
  }
  if (syncId) {
    const id = syncId;
    after(async () => {
      await syncInstagramAccount(id);
    });
  }

  revalidatePath("/dashboard");
  redirect(back.startsWith("/onboarding") ? "/dashboard?welcome=1" : "/dashboard?saved=1");
}
