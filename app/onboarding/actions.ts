"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isDemo, ME } from "@/lib/demo";
import { COLLEGES } from "@/lib/colleges";
import { inferFromBio, parseInstagramHandle, previewInstagram, syncInstagramAccount, type InstagramPreview } from "@/lib/instagram";

/* ------------------------------------------------------------------ step 1: Instagram */

export type PreviewResult =
  | { ok: true; preview: InstagramPreview; college: { id: string; name: string; city: string } | null }
  | { ok: false; error: string; code: "invalid" | "private" | "not_found" | "unavailable" | "taken" };

function collegeFromBio(bio?: string | null) {
  if (!bio) return null;
  const hit = COLLEGES.find((c) => (c.short && c.short.length >= 3 && new RegExp(`\\b${c.short.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(bio)) || bio.toLowerCase().includes(c.name.toLowerCase()));
  return hit ? { id: hit.id, name: hit.name, city: hit.city } : null;
}

export async function fetchInstagramPreview(input: string): Promise<PreviewResult> {
  const handle = parseInstagramHandle(input);
  if (!handle) return { ok: false, code: "invalid", error: "That doesn't look like an Instagram handle. Try something like @yourname." };

  // Demo mode without an Apify token: show fixture data. With a token, fetch the real profile even in demo mode.
  if (isDemo() && !process.env.APIFY_TOKEN) {
    await new Promise((r) => setTimeout(r, 1600));
    const inf = inferFromBio(ME.bio);
    const top = [...ME.posts].sort((a, b) => b.views - a.views).slice(0, 3);
    return {
      ok: true,
      college: collegeFromBio(ME.bio),
      preview: {
        handle, fullName: ME.display_name, bio: ME.bio, photoUrl: null, followers: ME.followers, engagementRate: ME.engagement_rate,
        avgViews: ME.avg_views, isPrivate: false, isVerified: false,
        posts: top.map((p) => ({ id: p.id, thumb: null, views: p.views, likes: p.likes, type: p.type, hue: p.hue })),
        ...inf,
      },
    };
  }

  if (isDemo()) return livePreview(handle);

  const supabase = await createClient();
  const { data: claimed } = await supabase.from("social_accounts").select("id, talent_id").eq("platform", "instagram").eq("handle", handle).maybeSingle();
  const { data: mine } = await supabase.rpc("my_talent_id");
  if (claimed && claimed.talent_id !== mine) {
    return { ok: false, code: "taken", error: `@${handle} is already on Vigor. If it's yours, WhatsApp us and we'll move it to this account.` };
  }
  if (!process.env.APIFY_TOKEN) {
    return { ok: false, code: "unavailable", error: "We can't reach Instagram right now. Continue and we'll sync your stats in the background." };
  }
  return livePreview(handle);
}

async function livePreview(handle: string): Promise<PreviewResult> {
  try {
    const preview = await previewInstagram(handle);
    if (preview.isPrivate) return { ok: false, code: "private", error: `@${handle} is private. Switch it to public (Settings → Account privacy) and try again, or continue and we'll sync later.` };
    return { ok: true, preview, college: collegeFromBio(preview.bio) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    console.error("[onboarding] Instagram preview failed", handle, msg);
    return /not found|not public|does not exist/i.test(msg)
      ? { ok: false, code: "not_found", error: `We couldn't find @${handle}. Check the spelling, or make sure the account is public.` }
      : { ok: false, code: "unavailable", error: "Instagram is slow to respond right now. Continue and we'll sync your stats in the background." };
  }
}

/* ------------------------------------------------------------------ finish */

export type OnboardingPayload = {
  handle: string | null;
  fullName: string;
  city: string | null;
  bio: string | null;
  niches: string[];
  languages: string[];
  inCollege: boolean;
  college: { id: string | null; name: string; city?: string | null } | null;
  gradYear: number | null;
  interests: string[];
  whatsapp: string | null;
  whatsappAlerts: boolean;
  type: "influencer" | "event";
};

export type FinishResult = { ok: true; redirectTo: string } | { ok: false; error: string; step: 1 | 2 | 3 };

const clip = (s: string | null | undefined, n: number) => (s ? s.trim().slice(0, n) : null) || null;

export async function completeOnboarding(p: OnboardingPayload): Promise<FinishResult> {
  const name = clip(p.fullName, 80);
  if (!name) return { ok: false, step: 1, error: "Add your name so brands know who you are." };
  if (p.inCollege && (!p.college?.name || !p.gradYear)) return { ok: false, step: 2, error: "Pick your college and graduation year." };
  if (!p.interests.length) return { ok: false, step: 3, error: "Pick at least one thing you'd like to do." };
  const wa = p.whatsapp ? p.whatsapp.replace(/[^\d+]/g, "") : null;
  if (wa && !/^\+?\d{10,13}$/.test(wa)) return { ok: false, step: 3, error: "That WhatsApp number looks off. Use 10 digits, e.g. 98765 43210." };

  if (isDemo()) {
    await new Promise((r) => setTimeout(r, 500));
    return { ok: true, redirectTo: "/dashboard?welcome=1" };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/onboarding");
  const handle = p.handle ? parseInstagramHandle(p.handle) : null;
  const isInfluencer = !!handle || p.interests.some((i) => i === "Instagram collabs" || i === "UGC");
  const isEvent = p.type === "event" || p.interests.some((i) => i === "Campus ambassador" || i === "Event hosting & promoting");
  const categories = Array.from(new Set([...p.niches, ...(p.inCollege ? ["Student / Campus"] : [])])).slice(0, 12);
  const collegeLine = p.inCollege && p.college ? `College: ${p.college.name}${p.gradYear ? ` · Class of ${p.gradYear}` : ""}` : null;

  const { data: talent, error } = await supabase
    .from("talent_profiles")
    .upsert(
      {
        user_id: auth.user.id,
        display_name: name,
        city: clip(p.city, 60),
        bio: clip(p.bio, 600),
        languages: p.languages.slice(0, 10),
        is_influencer: isInfluencer,
        is_event_talent: isEvent,
        categories,
        skills: p.interests.slice(0, 8),
        experience_notes: collegeLine,
        consent_share: true,
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();
  if (error || !talent) return { ok: false, step: 3, error: "We couldn't save your profile. Try again in a moment." };

  await supabase.from("talent_contacts").upsert({
    talent_id: talent.id,
    email: auth.user.email ?? null,
    phone: auth.user.phone ? `+${auth.user.phone.replace(/^\+/, "")}` : wa,
    whatsapp: p.whatsappAlerts ? wa : null,
  });

  // College graph (talent_education ships with the v2 data model; ignore if the table isn't migrated yet).
  if (p.inCollege && p.college) {
    await supabase.from("talent_education").upsert({ talent_id: talent.id, college_name: p.college.name, graduation_year: p.gradYear }).then(() => null, () => null);
  }

  if (handle) {
    const { data: existing } = await supabase.from("social_accounts").select("id, handle").eq("talent_id", talent.id).eq("platform", "instagram").maybeSingle();
    let syncId: string | null = null;
    if (existing?.handle !== handle) {
      if (existing) await supabase.from("social_accounts").delete().eq("id", existing.id);
      const { data: acc, error: accErr } = await supabase
        .from("social_accounts")
        .insert({ talent_id: talent.id, platform: "instagram", handle, url: `https://www.instagram.com/${handle}/` })
        .select("id")
        .single();
      if (accErr) {
        return { ok: false, step: 1, error: accErr.code === "23505" ? `@${handle} is already registered. WhatsApp us if it's your account.` : "We couldn't link your Instagram. Try again." };
      }
      syncId = acc.id;
    }
    if (syncId) {
      const id = syncId;
      after(async () => { await syncInstagramAccount(id); });
    }
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true, redirectTo: "/dashboard?welcome=1" };
}

/* ------------------------------------------------------------------ legacy full form (TalentForm) */

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
  const back = String(formData.get("back") ?? "/onboarding");
  if (isDemo()) redirect(back.startsWith("/onboarding") ? "/dashboard?welcome=1" : "/dashboard/profile?saved=1");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
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

  const { data: talent, error } = await supabase.from("talent_profiles").upsert(profile, { onConflict: "user_id" }).select("id").single();
  if (error || !talent) return fail("Could not save your profile. " + (error?.message ?? ""));

  await supabase.from("talent_contacts").upsert({ talent_id: talent.id, email: auth.user.email, phone, whatsapp: str(formData, "whatsapp") ?? phone });

  const links = list(formData, "media_url").filter((u) => /^https?:\/\//i.test(u)).slice(0, 5);
  await supabase.from("talent_media").delete().eq("talent_id", talent.id);
  if (links.length) await supabase.from("talent_media").insert(links.map((url) => ({ talent_id: talent.id, url, kind: "video" })));

  const { data: existing } = await supabase.from("social_accounts").select("id, handle").eq("talent_id", talent.id).eq("platform", "instagram").maybeSingle();
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
      return fail(accErr.code === "23505" ? `@${handle} is already registered in the network. Contact us if this is your account.` : "Could not save Instagram account.");
    }
    syncId = acc.id;
  }
  if (syncId) {
    const id = syncId;
    after(async () => { await syncInstagramAccount(id); });
  }

  revalidatePath("/dashboard", "layout");
  redirect(back.startsWith("/onboarding") ? "/dashboard?welcome=1" : "/dashboard/profile?saved=1");
}
