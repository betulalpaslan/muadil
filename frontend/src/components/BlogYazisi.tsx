import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiIstek } from "../api/client";
import { NOTA_TAKMA_AD, ONE_CIKAN_BLOG, ZARA_SISELER } from "../tasarim/blogOrnek";
import type { ZaraSise } from "../tasarim/blogOrnek";
import { notaAnahtar } from "../tasarim/notaAnahtar";
import type { ParfumNota } from "../types";
import { Footer } from "./OrtakYerlesim";
import BlogKapak from "./tasarim/BlogKapak";
import NotaSprey from "./tasarim/NotaSprey";

// Blog okuma sayfası (/blog/zara-vanilya-serisi): ana sayfadaki şişe sahnesi aynen burada da var; üstüne gelinen
// şişe ortaya gelir ve bilgisi sahnenin altındaki panelde yazar. Panel hep dolu kalır (ortadaki şişeyi gösterir).
const TAKMA_AD = new Map(Object.entries(NOTA_TAKMA_AD).map(([ad, hedef]) => [notaAnahtar(ad), hedef]));

// Anahtar: notaAnahtar(ad), değer: görsel adresi. Blogdaki nota adı veritabanındaki nota adıyla eşleştirilir.
type Gorseller = Map<string, string | null>;

function Bilgi({ s, no, gorseller }: { s: ZaraSise; no: number; gorseller: Gorseller }) {
  // Notalar panelin içinde, açıklamanın yanında: parfüm detay sayfasındaki şişe ikonlu bölüm (NotaSprey, panel modu:
  // panel ters renkli olduğu için renkler tersine çevrilir, yazılar küçük). Blog verisinde katman yok: düz liste.
  // key: şişe değişince bölüm yeniden kurulur, notalar yine şişeden fışkırarak gelir.
  const notalar: ParfumNota[] = s.notalar.map((ad, i) => ({
    notaId: i,
    notaAd: ad,
    katman: "Orta",
    gorselUrl: gorseller.get(notaAnahtar(TAKMA_AD.get(notaAnahtar(ad)) ?? ad)) ?? null,
  }));

  return (
    <div
      aria-live="polite"
      className="mt-6 flex flex-col gap-[clamp(24px,4vw,56px)] rounded-[14px] bg-yazi p-[clamp(22px,3.5vw,44px)] text-zemin md:flex-row md:items-center md:justify-center"
    >
      <div className="flex min-w-0 flex-col items-center gap-4 text-center md:flex-[0_1_520px]">
        <span className="kucuk opacity-70">
          {ONE_CIKAN_BLOG.marka} · no. {String(no).padStart(2, "0")}
        </span>
        <h2 className="genis m-0 text-[clamp(26px,3.2vw,44px)] leading-[1.15] font-extrabold">{s.ad}</h2>
        <span className="kucuk text-vurgu-ters">{s.aile}</span>
        <p className="m-0 max-w-[560px] text-center text-sm leading-[1.75] tracking-[0.03em]">{s.aciklama}</p>
      </div>

      <div className="min-w-0 md:w-[380px] md:shrink-0">
        <NotaSprey key={s.ad} notalar={notalar} duz panel />
      </div>
    </div>
  );
}

export default function BlogYazisi() {
  const [gorseller, setGorseller] = useState<Gorseller>(new Map());

  // Görseller yüklenemezse notalar yıldızla gösterilir; sayfa yine de çalışır
  useEffect(() => {
    apiIstek<{ ad: string; gorselUrl: string | null }[]>("/api/notalar")
      .then((liste) => setGorseller(new Map(liste.map((n) => [notaAnahtar(n.ad), n.gorselUrl]))))
      .catch(() => {});
  }, []);

  return (
    <>
      <article className="flex flex-col gap-8 px-(--kenar) pt-10 pb-20">
        <Link to="/" className="kucuk inline-flex min-h-11 items-center self-start text-yazi no-underline">
          ← ana sayfa
        </Link>
        <h1 className="genis m-0 text-[clamp(30px,3.6vw,48px)] leading-[1.45] [word-spacing:.2em]">
          <span className="text-vurgu">{ONE_CIKAN_BLOG.marka}</span> {ONE_CIKAN_BLOG.baslik}
        </h1>

        <div>
          <BlogKapak ad={`${ONE_CIKAN_BLOG.marka} parfümleri`} sise={ZARA_SISELER} bilgi={(i) => <Bilgi s={ZARA_SISELER[i]} no={i + 1} gorseller={gorseller} />} />
        </div>

        <p className="kucuk m-0 max-w-[620px] text-[9px] leading-[1.9] text-soluk">
          Açıklamalar Zara'nın ürün sayfalarındaki tanıtım metinlerinden özetlendi. Notalar satıldığı ülkeye göre değişebilir.
        </p>
      </article>
      <Footer />
    </>
  );
}
