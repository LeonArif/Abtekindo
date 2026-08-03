import type { MetadataRoute } from "next";

import { getSitemapEntries } from "@/lib/api/server";
import { SITE_URL } from "@/lib/site";

/**
 * Sitemap.
 *
 * Priorities reflect what actually earns the company money: the services page
 * carries the published price list and is the strongest landing page for
 * "service AC" searches, so it ranks alongside the homepage rather than below
 * the catalog.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/layanan`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/produk`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/kontak`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/tentang-kami`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  try {
    const { products } = await getSitemapEntries();

    return [
      ...staticRoutes,
      ...products.map((entry) => ({
        url: `${SITE_URL}/produk/${entry.slug}`,
        lastModified: new Date(entry.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    // A sitemap listing only the static pages is far better than a 500, which
    // would make search engines drop the whole file.
    console.error("[sitemap] product slugs unavailable:", error);
    return staticRoutes;
  }
}
