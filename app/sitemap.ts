import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["", "/join", "/brands", "/register?type=influencer", "/register?type=event", "/login"].map((p) => ({
    url: `${SITE.url}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.6,
  }));
}
