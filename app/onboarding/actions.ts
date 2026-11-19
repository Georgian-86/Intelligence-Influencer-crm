"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseInstagramHandle, syncInstagramAccount } from "@/lib/instagram";
import { canonicalCity, UUID_RE } from "@/lib/colleges";

type Supa = Awaited<ReturnType<typeof createClient>>;

const str = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v || null;
};
const int = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").replace(/[^\d]/g, "");
  return v ? parseInt(v, 10) : null;
};
const list = (f: FormData, k: string) => f.getAll(k).map(String).filter(Boolean);

/**
 * Create / replace / remove the talent's Instagram account row and queue an Apify sync.
 * Returns an error message for the UI, or null.
 */
async function upsertInstagram(supabase: Supa, talentId: string, handle: string | null, isInfluencer: boolean) {
  const { data: existing } = await supabase
    .from("social_accounts")
    .select("id, handle")
    .eq("talent_id", talentId)
    .eq("platform", "instagram")
    .maybeSingle();
  let syncId: string | null = null;
  if (!isInfluencer && existing) {
    await supabase.from("social_accounts").delete().eq("id", existing.id);
  } else if (handle && existing?.handle !== handle) {
    if (existing) await supabase.from("social_accounts").delete().eq("id", existing.id);
    const { data: acc, error: accErr } = await supabase
      .from("social_accounts")
      .insert({ talent_id: talentId, platform: "instagram", handle, url: `https://www.instagram.com/${handle}/` })
      .select("id")
      .single();
    if (accErr) {
      return accErr.code === "23505"
        ? `@${handle} is already registered in the network. Contact us if this is your account.`
        : "Could not save Instagram account.";
    }
    syncId = acc.id;
  }
  if (syncId) {
    const id = syncId;
    // Reuse the profile the onboarding preview just fetched (same server instance) instead of paying Apify twice.
    after(async () => {
      await syncInstagramAccount(id, { maxAgeMs: 15 * 60_000 });
    });
  }
  return null;
}

/**
 * Education fields (talent_education, migration 0005). Only touched when the form carries `edu_present`.
 * Never fails the whole save: if the table isn't migrated yet the rest of the profile still saves.
 */
async function saveEducation(supabase: Supa, talentId: string, f: FormData) {
  if (!f.has("edu_present")) return;
  try {
    if (f.get("in_college") !== "yes") {
      await supabase.from("talent_education").delete().eq("talent_id", talentId);
      return;
    }
    const rawId = str(f, "college_id");
    let collegeId = rawId && UUID_RE.test(rawId) ? rawId : null;
    const collegeName = str(f, "college_name")?.slice(0, 160) ?? null;
    if (!collegeId && collegeName) {
      const { data: match } = await supabase.from("colleges").select("id").ilike("name", collegeName.replace(/[%_\\]/g, "\\$&")).limit(1).maybeSingle();
      collegeId = match?.id ?? null;
    }
    const year = int(f, "graduation_year");
    const course = str(f, "course")?.slice(0, 80) ?? null;
    if (!collegeId && !collegeName && !course && !year) return;
    const row: Record<string, unknown> = {
      talent_id: talentId,
      college_id: collegeId,
      college_name: collegeName,
      course,
      graduation_year: year && year >= 1980 && year <= 2100 ? year : null,
    };
    if (f.has("college_email")) {
      const email = str(f, "college_email")?.toLowerCase() ?? null;
      row.college_email = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
    }
    const { error } = await supabase.from("talent_education").upsert(row, { onConflict: "talent_id" });
    if (error) console.warn("talent_education not saved:", error.message);
  } catch (e) {
    console.warn("talent_education not saved:", e);
  }
}

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

  await saveEducation(supabase, talent.id, formData);

  // Instagram account (replace if handle changed)
  const igError = await upsertInstagram(supabase, talent.id, handle, isInfluencer);
  if (igError) return fail(igError);

  revalidatePath("/dashboard");
  redirect(back.startsWith("/onboarding") ? "/dashboard?welcome=1" : "/dashboard?saved=1");
}

/** Is this IG handle already claimed by another talent? (service role; false when unknown) */
async function handleTakenByOther(handle: string, userId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const { data } = await createAdminClient()
      .from("social_accounts")
      .select("talent_profiles(user_id)")
      .eq("platform", "instagram")
      .eq("handle", handle)
      .maybeSingle();
    const owner = (data?.talent_profiles as unknown as { user_id?: string } | null)?.user_id;
    return !!data && owner !== userId;
  } catch {
    return false;
  }
}

export type OnboardingState = { error?: string; step?: string } | null;

/**
 * 60-second onboarding (PRD A2). Writes the same rows as saveTalentProfile — talent_profiles,
 * talent_contacts, social_accounts (+ Apify sync) — plus talent_education. Used with useActionState so
 * the stepper keeps its state on validation errors.
 */
export async function completeOnboarding(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/onboarding");

  const { data: already } = await supabase.from("talent_profiles").select("id").eq("user_id", auth.user.id).maybeSingle();
  if (already) redirect("/dashboard");

  const type = formData.get("type") === "event" ? "event" : "influencer";
  const igInput = str(formData, "instagram");
  const handle = igInput ? parseInstagramHandle(igInput) : null;
  const displayName = str(formData, "display_name")?.slice(0, 80) ?? null;
  const city = canonicalCity(str(formData, "city"));
  const phone = str(formData, "phone");
  const phoneDigits = (phone ?? "").replace(/\D/g, "");

  if (igInput && !handle) return { error: "That doesn't look like an Instagram handle. Try @yourname or your profile link.", step: "instagram" };
  if (type === "influencer" && !handle) return { error: "Add your Instagram handle so we can fetch your stats.", step: "instagram" };
  if (!displayName) return { error: "Tell us what to call you.", step: "name" };
  if (!city) return { error: "Which city are you based in?", step: "city" };
  if (phoneDigits.length < 10 || phoneDigits.length > 13) return { error: "Enter a valid mobile number (10 digits).", step: "phone" };
  if (formData.get("consent_share") !== "on") return { error: "Please accept the profile sharing consent to join the network.", step: "phone" };

  if (handle && (await handleTakenByOther(handle, auth.user.id))) {
    return { error: `@${handle} is already registered in the network. Contact us if this is your account.`, step: "instagram" };
  }

  const isInfluencer = type === "influencer" || !!handle;
  const isEvent = type === "event";
  const niches = list(formData, "niches").slice(0, 5);
  const roles = list(formData, "event_categories").slice(0, 8);

  const { data: talent, error } = await supabase
    .from("talent_profiles")
    .upsert(
      {
        user_id: auth.user.id,
        display_name: displayName,
        city,
        is_influencer: isInfluencer,
        is_event_talent: isEvent,
        categories: [...niches, ...roles],
        consent_share: true,
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();
  if (error || !talent) return { error: "Could not save your profile. " + (error?.message ?? ""), step: "phone" };

  const normalisedPhone = phoneDigits.length === 10 ? `+91 ${phoneDigits}` : `+${phoneDigits}`;
  await supabase.from("talent_contacts").upsert({
    talent_id: talent.id,
    email: auth.user.email,
    phone: normalisedPhone,
    whatsapp: normalisedPhone,
  });

  await saveEducation(supabase, talent.id, formData);

  const igError = await upsertInstagram(supabase, talent.id, handle, isInfluencer);
  // Profile exists now, so the stepper can't be re-run: let them fix the handle on the profile page.
  if (igError) redirect(`/dashboard/profile?error=${encodeURIComponent(igError)}`);

  revalidatePath("/dashboard");
  redirect("/dashboard?welcome=1");
}
