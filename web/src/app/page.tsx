import Link from "next/link";
import { AnaKarsilastirma } from "@/components/ana-karsilastirma";
import { EslesmeKartlari } from "@/components/karsilastirma";
import { JsonLd } from "@/components/json-ld";
import { SITE_ADI, SITE_URL } from "@/lib/site";
import { vitrin as vitrinVerisi } from "@/lib/veri";

export default async function AnaSayfa() {
  const vitrin = await vitrinVerisi(5);

  return (
    <>
      <JsonLd
        veri={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_ADI,
          url: SITE_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/ara?q={arama}`,
            "query-input": "required name=arama",
          },
        }}
      />
      <h1 className="sr">Sevdiğin orijinal parfümün muadilini bul</h1>
      <section className="hero -mx-6 flex flex-col gap-5 px-6 pt-2 -mt-4">
        <AnaKarsilastirma vitrin={vitrin} />
      </section>

      <section aria-labelledby="eslesmeler" className="mt-12 flex flex-col gap-5">
        <div className="rise flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5" style={{ ["--dl" as string]: "1.3s" }}>
          <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
            <h2 id="eslesmeler" className="genis altin-yazi m-0 text-[32px] leading-[1.1]">
              Haftanın eşleşmeleri.
            </h2>
          </div>
          <Link href="/parfumler" className="link-btn">
            HEPSİNİ KEŞFET
          </Link>
        </div>
        <EslesmeKartlari liste={vitrin.slice(0, 3)} />
      </section>
    </>
  );
}
