import { NextResponse, type NextRequest } from "next/server";
import { searchPool } from "@/lib/pool";
import { can, getAccess } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const esc = (v: unknown) => {
  const s = v == null ? "" : Array.isArray(v) ? v.join("; ") : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(request: NextRequest) {
  const access = await getAccess();
  const agency = access.find((a) => a.orgType === "agency" && can(a, "export"));
  if (!agency) return new NextResponse("Forbidden", { status: 403 });
  const f = Object.fromEntries(request.nextUrl.searchParams.entries());
  const rows = await searchPool(f, 5000);

  // Contacts only where RLS allows (talent who engaged with this agency).
  const supabase = await createClient();
  const { data: contacts } = await supabase.from("talent_contacts").select("talent_id, email, phone").in("talent_id", rows.map((r) => r.id).slice(0, 1000));
  const cmap = new Map((contacts ?? []).map((c) => [c.talent_id, c]));

  await supabase.from("usage_events").insert({ org_id: agency.orgId, kind: "pool.export" }).then(() => null, () => null);

  const header = ["Name", "City", "Gender", "Influencer", "Event talent", "Instagram", "Followers", "Engagement %", "Avg likes", "Rank", "Rating", "Rate per post", "Full-day rate", "Categories", "Skills", "Email", "Phone", "Profile"];
  const origin = request.nextUrl.origin;
  const lines = rows.map((r) => [
    r.display_name, r.city, r.gender, r.is_influencer ? "Yes" : "", r.is_event_talent ? "Yes" : "",
    r.ig ? `@${r.ig.handle}` : "", r.ig?.followers, r.ig?.engagement_rate, r.ig?.avg_likes, r.rank, r.rating,
    r.rate_per_post, r.rate_full_day, r.categories, r.skills, cmap.get(r.id)?.email, cmap.get(r.id)?.phone,
    `${origin}/crm/talent/${r.id}`,
  ].map(esc).join(","));
  const csv = "﻿" + [header.join(","), ...lines].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vigor-talent-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
