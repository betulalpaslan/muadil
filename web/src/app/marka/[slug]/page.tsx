import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Kirinti, MuadilSatiri, ParfumKarti } from "@/components/parcalar";
import { MarkaLogosu } from "@/components/sise";
import { markaDetay, tumSluglar } from "@/lib/veri";

// Listede olmayan adreste ilk istek tam sayfayı beklesin: yanlış adres ilk seferde de gerçek 404 dönsün.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await tumSluglar()).markalar.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/marka/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const m = await markaDetay(slug);
  if (!m) return {};
  const orijinal = m.tur === "orijinal";
  return {
    title: orijinal ? `${m.ad} parfümleri ve muadilleri` : `${m.ad} muadil parfüm kodları`,
    description: orijinal
      ? `${m.ad} markasının ${m.parfumler.length} parfümü ve muadil kodları, fiyatları.`
      : `${m.ad} markasının ${m.muadiller.length} muadil kodu: hangi orijinal parfüme benzediği, fiyat, benzerlik ve kalıcılık puanları.`,
    alternates: { canonical: `/marka/${slug}` },
  };
}

export default async function MarkaSayfasi({ params }: PageProps<"/marka/[slug]">) {
  const { slug } = await params;
  const m = await markaDetay(slug);
  if (!m) notFound();

  const orijinal = m.tur === "orijinal";
  return (
    <>
      <Kirinti yol={[{ ad: "Ana sayfa", href: "/" }, { ad: "Markalar", href: "/markalar" }, { ad: m.ad, isim: true }]} />
      <div className="flex items-center gap-3">
        {m.gorselUrl && <MarkaLogosu url={m.gorselUrl} ad={m.ad} boyut={56} />}
        <p className="kucuk text-vurgu">{orijinal ? "Orijinal marka" : "Muadil marka"}</p>
      </div>
      <h1 className="genis mt-2 text-3xl sm:text-4xl">
        {m.ad} {orijinal ? "parfümleri" : "muadil kodları"}
      </h1>

      {orijinal ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {m.parfumler.map((p) => (
            <ParfumKarti key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <ul className="mt-6">
          {m.muadiller.map((x) => (
            <MuadilSatiri key={x.id} m={x} kaynak={`marka/${m.slug}`} orijinal={{ ad: x.orijinalAd, slug: x.orijinalSlug }} />
          ))}
        </ul>
      )}
    </>
  );
}
