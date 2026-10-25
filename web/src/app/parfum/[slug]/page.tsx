import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { enIyiSirasi, MuadilSatir } from "@/components/karsilastirma";
import { NotaSprey } from "@/components/nota-sprey";
import { Kirinti, ParfumGorseli } from "@/components/parcalar";
import { adBuyuk, CINSIYET_ADI, SITE_URL, tl } from "@/lib/site";
import { parfumDetay, tumSluglar } from "@/lib/veri";

// Listede olmayan adreste ilk istek tam sayfayı beklesin: yanlış adres ilk seferde de gerçek 404 dönsün.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await tumSluglar()).parfumler.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/parfum/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await parfumDetay(slug);
  if (!p) return {};
  const ad = `${p.markaAd} ${p.ad}`;
  const enUcuz = p.muadiller[0];
  return {
    title: `${ad} muadili: ${p.muadiller.length} kod, fiyat ve puanlar`,
    description: `${ad} parfümünün muadilleri: ${p.muadiller.map((m) => `${m.markaAd} ${m.kod}`).slice(0, 4).join(", ")}${
      enUcuz ? `. ${tl(enUcuz.fiyat)}'den başlayan fiyatlarla` : ""
    }. Benzerlik ve kalıcılık puanlarını karşılaştır.`,
    alternates: { canonical: `/parfum/${slug}` },
  };
}

export default async function ParfumSayfasi({ params }: PageProps<"/parfum/[slug]">) {
  const { slug } = await params;
  const p = await parfumDetay(slug);
  if (!p) notFound();

  const ad = `${p.markaAd} ${p.ad}`;
  const fiyatlar = p.muadiller.map((m) => m.fiyat);

  return (
    <>
      <JsonLd
        veri={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: ad,
            brand: { "@type": "Brand", name: p.markaAd },
            image: p.gorselUrl ? `${SITE_URL}${p.gorselUrl}` : undefined,
            url: `${SITE_URL}/parfum/${p.slug}`,
            ...(fiyatlar.length > 0 && {
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "TRY",
                lowPrice: Math.min(...fiyatlar),
                highPrice: Math.max(...fiyatlar),
                offerCount: fiyatlar.length,
              },
            }),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Ana sayfa", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Parfümler", item: `${SITE_URL}/parfumler` },
              { "@type": "ListItem", position: 3, name: ad },
            ],
          },
        ]}
      />
      <Kirinti yol={[{ ad: "Ana sayfa", href: "/" }, { ad: "Parfümler", href: "/parfumler" }, { ad, isim: true }]} />

      <header className="mt-2 flex flex-col items-center gap-3 text-center">
        <span className="text-[13px] font-bold tracking-[0.12em]">{adBuyuk(p.markaAd)}</span>
        <h1 className="m-0 text-[34px] leading-none font-extrabold tracking-[-0.04em]">{p.ad}</h1>
        <p className="m-0 text-sm text-soluk">
          <Link href={`/marka/${p.markaSlug}`} className="underline">
            {p.markaAd}
          </Link>{" "}
          · {CINSIYET_ADI[p.cinsiyet]}
          {fiyatlar.length > 0 && <> · {tl(Math.min(...fiyatlar))}&apos;den başlayan fiyatlar</>}
        </p>
      </header>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
        <div className="w-full max-w-72 shrink-0">
          <ParfumGorseli gorselUrl={p.gorselUrl} renk={p.renk} ad={ad} boyut={288} />
        </div>
        <div className="min-w-0 flex-[0_1_380px]">
          <NotaSprey notalar={p.notalar} />
        </div>
      </div>

      <section className="mt-14" aria-labelledby="muadiller">
        <h2 id="muadiller" className="genis pb-3 text-xl" style={{ borderBottom: "1px solid var(--line)" }}>
          {p.muadiller.length} muadil
        </h2>
        <p className="mt-3 text-sm text-soluk">En benzeyen başta. Bir muadile dokunup satıcı bağlantısına ulaşabilirsin.</p>
        {p.muadiller.length === 0 ? (
          <p className="mt-6 text-soluk">Bu parfüm için henüz muadil eklenmedi.</p>
        ) : (
          <ol className="m-0 mt-6 flex list-none flex-col gap-3 p-0">
            {enIyiSirasi(p.muadiller).map((m, i) => (
              <MuadilSatir key={m.id} m={m} en={i === 0} />
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
