import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { Kirinti, MuadilSatiri, ParfumGorseli, Puan, SatinAl, yuzde } from "@/components/parcalar";
import { Halka, MarkaLogosu } from "@/components/sise";
import { CINSIYET_ADI, SITE_URL, adDili, tarih, tl } from "@/lib/site";
import { muadilDetay, tumSluglar } from "@/lib/veri";

// Listede olmayan adreste ilk istek tam sayfayı beklesin: yanlış adres ilk seferde de gerçek 404 dönsün.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await tumSluglar()).muadiller.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/muadil/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const m = await muadilDetay(slug);
  if (!m) return {};
  const ad = `${m.markaAd} ${m.kod}`;
  const orijinal = `${m.orijinal.markaAd} ${m.orijinal.ad}`;
  return {
    title: `${ad} hangi parfümün muadili? ${orijinal} benzerliği`,
    description: `${ad}, ${orijinal} parfümünün muadilidir. Benzerlik ${m.benzerlik}/10, kalıcılık ${m.kalicilik}/10, fiyat ${tl(m.fiyat)}. Diğer muadiller.`,
    alternates: { canonical: `/muadil/${slug}` },
  };
}

export default async function MuadilSayfasi({ params }: PageProps<"/muadil/[slug]">) {
  const { slug } = await params;
  const m = await muadilDetay(slug);
  if (!m) notFound();

  const ad = `${m.markaAd} ${m.kod}`;
  const orijinalAd = `${m.orijinal.markaAd} ${m.orijinal.ad}`;

  return (
    <>
      <JsonLd
        veri={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: `${ad} (${orijinalAd} muadili)`,
            brand: { "@type": "Brand", name: m.markaAd },
            url: `${SITE_URL}/muadil/${m.slug}`,
            offers: {
              "@type": "Offer",
              priceCurrency: "TRY",
              price: m.fiyat,
              priceValidUntil: undefined,
              url: `${SITE_URL}/muadil/${m.slug}`,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Ana sayfa", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: m.orijinal.ad, item: `${SITE_URL}/parfum/${m.orijinal.slug}` },
              { "@type": "ListItem", position: 3, name: ad },
            ],
          },
        ]}
      />
      <Kirinti
        yol={[
          { ad: "Ana sayfa", href: "/" },
          { ad: orijinalAd, href: `/parfum/${m.orijinal.slug}`, isim: true },
          { ad, isim: true },
        ]}
      />

      <div className="flex items-center gap-3">
        <MarkaLogosu url={m.markaLogo} ad={m.markaAd} boyut={48} />
        <p className="kucuk text-vurgu" lang={adDili(m.markaAd)}>
          {m.markaAd}
        </p>
      </div>
      <h1 className="genis mt-2 text-3xl sm:text-4xl">
        {m.kod} <span className="text-soluk">hangi parfümün muadili?</span>
      </h1>
      <p className="mt-4 max-w-2xl text-lg">
        <strong>{ad}</strong>, <Link href={`/parfum/${m.orijinal.slug}`} className="underline hover:text-vurgu">{orijinalAd}</Link> parfümünün
        muadilidir. {CINSIYET_ADI[m.cinsiyet]} kullanıma uygundur.
      </p>

      <section className="mt-10 grid gap-8 border-y border-yazi/20 py-8 sm:grid-cols-[auto_1fr] sm:items-center">
        <ParfumGorseli gorselUrl={m.orijinal.gorselUrl} renk={m.orijinal.renk} ad={m.orijinal.ad} boyut={160} />
        <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
          <div>
            <div className="kucuk text-soluk">Fiyat (50 ml)</div>
            <div className="text-3xl font-bold tracking-[-0.03em]">{tl(m.fiyat)}</div>
            <div className="text-xs text-soluk">Son güncelleme: {tarih(m.fiyatTarihi)}</div>
          </div>
          <div>
            <div className="kucuk text-soluk">Benzerlik</div>
            <div className="mt-1">
              <Halka yuzde={yuzde(m.benzerlik)} boyut={64} dolgu="var(--accent)" />
            </div>
          </div>
          <Puan etiket="Kalıcılık" deger={m.kalicilik} />
          <SatinAl id={m.id} kaynak={`muadil/${m.slug}`} metin="Satıcıda gör" />
        </div>
      </section>

      {m.digerleri.length > 0 && (
        <section className="mt-12" aria-labelledby="diger">
          <h2 id="diger" className="genis border-b border-yazi/20 pb-3 text-xl">
            {orijinalAd} için diğer muadiller
          </h2>
          <ul>
            {m.digerleri.map((d) => (
              <MuadilSatiri key={d.id} m={d} kaynak={`muadil/${m.slug}`} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
