import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { tumSluglar } from "@/lib/veri";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await tumSluglar();
  const sabit = ["", "/parfumler", "/notalar", "/markalar"].map((yol) => ({ url: `${SITE_URL}${yol}` }));
  return [
    ...sabit,
    ...s.parfumler.map((slug) => ({ url: `${SITE_URL}/parfum/${slug}` })),
    ...s.muadiller.map((m) => ({ url: `${SITE_URL}/muadil/${m.slug}`, lastModified: new Date(m.tarih) })),
    ...s.markalar.map((slug) => ({ url: `${SITE_URL}/marka/${slug}` })),
    ...s.notalar.map((slug) => ({ url: `${SITE_URL}/nota/${slug}` })),
  ];
}
