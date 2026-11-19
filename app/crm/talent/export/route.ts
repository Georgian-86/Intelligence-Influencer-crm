import { NextResponse, type NextRequest } from "next/server";
import { searchPool } from "@/lib/pool";
import { can, getAccess } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/demo";
import { CREATORS } from "@/lib/demo/fixtures";

const esc = (v: unknown) => {
  const s = v == null ? "" : Array.isArray(v) ? v.join("; ") : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const HEADER = ["Name", "City", "Gender", "Influencer", "Event talent", "Instagram", "Followers", "Engagement %", "Avg likes", "Rank", "Rating", "Rate per post", "Full-day rate", "Categories", "Skills", "Email", "Phone", "Profile"];

function csv(lines: string[]) {
  return new NextResponse("﻿" + [HEADER.join(","), ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vigor-talent-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

export async function GET(request: NextRequest) {
  const access = await getAccess();
  const agency = access.find((a) => a.orgType === "agency" && can(a, "export"));
  if (!agency) return new NextResponse("Forbidden", { status: 403 });
  const f = Object.fromEntries(request.nextUrl.searchParams.entries());
  const ids = f.ids ? new Set(f.ids.split(",").filter(Boolean)) : null;
  const origin = request.nextUrl.origin;

  if (isDemo()) {
    const q = f.q?.toLowerCase().replace(/^@/, "");
    const rows = CREATORS.filter((c) => c.status === "approved").filter((c) =>
      ids ? ids.has(c.id) : (!q || c.display_name.toLowerCase().includes(q) || c.handle.includes(q)) && (!f.city || c.city === f.city) && (!f.category || c.categories.includes(f.category))
        && (!f.rank || c.rank === f.rank) && (!f.min_followers || c.followers >= Number(f.min_followers)) && (!f.max_followers || c.followers < Number(f.max_followers))
        && (!f.min_er || c.engagement_rate >= Number(f.min_er)));
    // Demo contacts are withheld: they unlock only after a creator engages with a brief.
    return csv(rows.map((c) => [
      c.display_name, c.city, c.gender, "Yes", c.is_event_talent ? "Yes" : "", `@${c.handle}`, c.followers, c.engagement_rate, c.avg_likes, c.rank, c.rating,
      c.rate_per_post, c.rate_full_day, c.categories, c.skills, "", "", `${origin}/crm/talent/${c.id}`,
    ].map(esc).join(",")));
  }

  let rows = await searchPool(f, 5000);
  if (ids) rows = rows.filter((r) => ids.has(r.id));

  // Contacts only where RLS allows (talent who engaged with this agency).
  const supabase = await createClient();
  const { data: contacts } = await supabase.from("talent_contacts").select("talent_id, email, phone").in("talent_id", rows.map((r) => r.id).slice(0, 1000));
  const cmap = new Map((contacts ?? []).map((c) => [c.talent_id, c]));

  await supabase.from("usage_events").insert({ org_id: agency.orgId, kind: "pool.export" }).then(() => null, () => null);

  return csv(rows.map((r) => [
    r.display_name, r.city, r.gender, r.is_influencer ? "Yes" : "", r.is_event_talent ? "Yes" : "",
    r.ig ? `@${r.ig.handle}` : "", r.ig?.followers, r.ig?.engagement_rate, r.ig?.avg_likes, r.rank, r.rating,
    r.rate_per_post, r.rate_full_day, r.categories, r.skills, cmap.get(r.id)?.email, cmap.get(r.id)?.phone,
    `${origin}/crm/talent/${r.id}`,
  ].map(esc).join(",")));
}
