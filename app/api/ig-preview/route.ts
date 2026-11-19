import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchInstagramProfile, parseInstagramHandle, toInstagramPreview } from "@/lib/instagram";

export const maxDuration = 30;

// Per-instance throttle: each lookup is a paid Apify run.
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function throttled(userId: string) {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  hits.set(userId, recent);
  return false;
}

/**
 * GET /api/ig-preview?handle=… — live preview for onboarding (signed-in users only).
 * Answers with { status }: "ok" | "private" | "notfound" | "unavailable" | "taken" | "invalid",
 * so the UI can show a friendly state and never block sign-up.
 */
export async function GET(request: NextRequest) {
  const handle = parseInstagramHandle(request.nextUrl.searchParams.get("handle") ?? "");
  if (!handle) return NextResponse.json({ status: "invalid" });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ status: "unavailable", reason: "auth" }, { status: 401 });

  // Already in the network under someone else? (the insert would fail later with 23505)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data: owner } = await createAdminClient()
        .from("social_accounts")
        .select("talent_profiles(user_id)")
        .eq("platform", "instagram")
        .eq("handle", handle)
        .maybeSingle();
      const ownerId = (owner?.talent_profiles as unknown as { user_id?: string } | null)?.user_id;
      if (owner && ownerId !== auth.user.id) return NextResponse.json({ status: "taken", handle });
    } catch {
      // non-fatal
    }
  }

  if (!process.env.APIFY_TOKEN || throttled(auth.user.id)) {
    return NextResponse.json({ status: "unavailable", handle });
  }
  try {
    const profile = await fetchInstagramProfile(handle, { timeoutMs: 25_000, maxAgeMs: 15 * 60_000 });
    const preview = toInstagramPreview(handle, profile);
    return NextResponse.json({ status: preview.isPrivate ? "private" : "ok", handle, preview });
  } catch (e) {
    const msg = e instanceof Error ? e.message.toLowerCase() : "";
    const status = msg.includes("not found") || msg.includes("does not exist") ? "notfound" : "unavailable";
    return NextResponse.json({ status, handle });
  }
}
