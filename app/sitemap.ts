import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { CITY_INFO, COLLEGES, collegeSlug } from "@/components/marketing/seo-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const core: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/join`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/brands`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
  const cities = CITY_INFO.map((c) => ({ url: `${SITE.url}/creators/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 }));
  const colleges = COLLEGES.map((c) => ({ url: `${SITE.url}/colleges/${collegeSlug(c)}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 }));
  return [...core, ...cities, ...colleges];
}
