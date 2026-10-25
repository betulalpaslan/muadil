import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Yalnızca üretimde dizine izin verilir (SITE_INDEX=1). Staging ve yerelde her şey kapalı.
export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_INDEX !== "1") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/git/", "/api/", "/ara", "/yonetim"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
