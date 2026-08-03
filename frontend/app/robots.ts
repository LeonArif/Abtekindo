import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The CMS and the revalidation webhook have no business in a search
      // index. /admin also sets a noindex meta tag, because robots.txt asks
      // crawlers not to fetch a page but does not stop one that already knows
      // the URL from listing it.
      disallow: ["/admin", "/admin/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
