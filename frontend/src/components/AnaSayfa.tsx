import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiIstek } from "../api/client";
import { gorselAdresi } from "../gorsel";
import { tl } from "../para";
import { ONE_CIKAN_BLOG, ZARA_SISELER } from "../tasarim/blogOrnek";
import { pastel } from "../tasarim/renk";
import type { ParfumListe } from "../types";
import { Footer } from "./OrtakYerlesim";
import Asterisk from "./tasarim/Asterisk";
import BlogKapak from "./tasarim/BlogKapak";
import Cerceve from "./tasarim/Cerceve";
import KayanSerit from "./tasarim/KayanSerit";
import ParfumSisesi from "./tasarim/ParfumSisesi";
import PopulerSekmeler from "./tasarim/PopulerSekmeler";
import type { PopulerParfum } from "./tasarim/PopulerSekmeler";
import YildizPatlamasi from "./tasarim/YildizPatlamasi";
import { HataMesaji } from "./ui";

// Ana sayfa: blogda öne çıkan, kayan şerit, bu hafta en popüler, sevdiğin koku. TASARIM.md §5.

function Ok({ boyut = 12 }: { boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 15L15 5M7 5h8v8" fill="none" stroke="currentColor" strokeWidth={2.6} />
    </svg>
  );
}

// kapakta: kapak sahnesinin (BlogKapak) zemini temadan bağımsız olduğu için sayfa renkleri yerine --ks-* kullanılır.
// Bağlantının içinde `group` ile durursa üstüne gelince ok çapraz çıkıp karşıdan girer (ok-ic).
function OkDairesi({ boyut = 44, kapakta = false }: { boyut?: number; kapakta?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${kapakta ? "ok-gir border-[var(--ks-ok-bd)] bg-[var(--ks-ok-bg)]" : "border-yazi bg-vurgu"}`}
      style={{ width: boyut, height: boyut }}
    >
      <span className="ok-ic inline-flex">
        <svg width={boyut * 0.4} height={boyut * 0.4} viewBox="0 0 20 20">
          <path d="M5 15L15 5M7 5h8v8" fill="none" strokeWidth={2.6} strokeLinecap="square" style={{ stroke: kapakta ? "var(--ks-ok-yazi)" : "var(--si)" }} />
        </svg>
      </span>
    </span>
  );
}

function BlogdaOneCikan() {
  return (
    <section aria-label="Blogda öne çıkan" className="px-(--kenar) pt-[44px] pb-8">
      <div className="relative">
        <BlogKapak
          ad="Zara parfümleri"
          sise={ZARA_SISELER}
          baslik={
            <h1 className="m-0">
              <Link to={ONE_CIKAN_BLOG.yol} aria-label={`${ONE_CIKAN_BLOG.marka} ${ONE_CIKAN_BLOG.baslik}, yazıyı oku`} className="kapak-baslik group inline-flex items-start gap-[clamp(12px,2vw,28px)] text-[var(--ks-yazi)] no-underline">
                <span className="flex flex-col">
                  <span className="kapak-marka text-[clamp(64px,11vw,148px)] leading-[0.95]">{ONE_CIKAN_BLOG.marka}</span>
                  <span className="kapak-alt text-[clamp(26px,4.6vw,64px)] leading-[1.1]">{ONE_CIKAN_BLOG.baslik}</span>
                </span>
                <span className="mt-[clamp(4px,1vw,14px)]">
                  <OkDairesi kapakta />
                </span>
              </Link>
            </h1>
          }
        />
        <Asterisk boyut={40} className="absolute -top-[44px] left-0 z-[3]" />
      </div>
    </section>
  );
}

function AramaSonuclari({ parfumler, ara }: { parfumler: ParfumListe[]; ara: string }) {
  return (
    <section aria-label="Arama sonuçları" className="px-(--kenar) pt-[70px] pb-[60px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="genis m-0 text-[clamp(30px,3.6vw,48px)]">
          <span className="text-vurgu">arama</span> sonuçları
        </h1>
        <span className="kucuk text-soluk">{parfumler.length} sonuç</span>
      </div>

      {parfumler.length === 0 ? (
        <p className="text-sm">
          {ara ? `"${ara}" için sonuç yok. Parfüm adını, markayı ya da muadil kodunu dene.` : "Henüz parfüm eklenmedi."}
        </p>
      ) : (
        <div className="flex flex-col">
          {parfumler.map((p) => {
            const gorsel = gorselAdresi(p.gorselUrl);
            return (
              <Link
                key={p.id}
                to={`/parfum/${p.id}`}
                className="flex flex-wrap items-center gap-5 border-t-[1.5px] border-yazi py-5 text-yazi no-underline last:border-b-[1.5px]"
              >
                <div className="flex h-16 w-[52px] shrink-0 items-center justify-center overflow-hidden" style={{ background: pastel(p.renk) }}>
                  {gorsel ? <img src={gorsel} alt="" className="h-full w-full object-contain" /> : <ParfumSisesi genislik={32} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="kucuk text-soluk">{p.marka}</div>
                  <div className="genis text-xl font-extrabold">{p.ad}</div>
                </div>
                {p.muadilOzetleri.length > 0 && (
                  <div className="kucuk hidden max-w-[320px] text-soluk sm:block">
                    {p.muadilOzetleri.map((m) => `${m.marka} ${m.kod}`).join(" · ")}
                  </div>
                )}
                <span className="kucuk inline-flex items-center gap-2">
                  detaya git <Ok boyut={10} />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function BuHaftaEnPopuler({ populerler, toplamSayi }: { populerler: ParfumListe[]; toplamSayi: number }) {
  const populerVeri: PopulerParfum[] = populerler.map((p) => ({
    id: p.id,
    ad: p.ad,
    marka: p.marka,
    renk: p.renk,
    gorselUrl: gorselAdresi(p.gorselUrl),
    enUygun: p.enUygunMuadil != null ? tl(p.enUygunMuadil) : "-",
    muadiller: p.muadilOzetleri.map((m) => ({ marka: m.marka, kod: m.kod, fiyat: tl(m.fiyat) })),
  }));

  return (
    <section aria-label="En popüler parfümler" className="relative px-(--kenar) pt-6 pb-14">
      <p className="kucuk m-0 mb-3 text-right text-soluk max-[760px]:hidden">{populerler.length} parfüm · sekmeye dokun</p>

      {populerVeri.length === 0 ? (
        <p className="text-sm">Henüz parfüm eklenmedi.</p>
      ) : (
        <PopulerSekmeler parfumler={populerVeri} />
      )}

      <div className="mt-8 flex justify-center">
        <Link to="/parfumler" className="cizgili kucuk inline-flex min-h-12 items-center gap-3 rounded-full border-[1.5px] border-yazi px-7">
          tüm parfümler ({toplamSayi}) <Ok />
        </Link>
      </div>
    </section>
  );
}

function SevdiginKoku() {
  return (
    <section aria-label="Sevdiğin koku" className="relative border-t-[1.5px] border-yazi px-(--kenar) pt-[76px] pb-[70px]">
      <YildizPatlamasi boyut={70} className="absolute top-[70px] right-(--kenar) max-[760px]:hidden" />
      <h2 className="genis relative z-[2] m-0 max-w-[820px] text-[clamp(32px,4.2vw,56px)] leading-[1.3] [word-spacing:.35em]">
        Sevdiğin koku,
        <br />
        &nbsp;&nbsp;uygun <span className="font-extrabold">fiyata.</span>
      </h2>
      <div className="mt-[30px] flex flex-wrap items-start gap-[clamp(30px,6vw,80px)]">
        <div className="relative min-w-0 flex-1 basis-[420px] max-w-[560px]">
          <Cerceve sol="kodunu bul" sag="no. 05">
            <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-yuzey">
              <span className="kucuk text-soluk">görsel</span>
            </div>
          </Cerceve>
          <svg className="absolute top-[30px] right-[-60px] max-[760px]:hidden" width="40" height="90" viewBox="0 0 40 90" aria-hidden="true">
            <path d="M20 88V8M4 24L20 6l16 18" fill="none" strokeWidth={5} style={{ stroke: "var(--be)" }} />
          </svg>
        </div>
        <div className="flex min-w-0 flex-1 basis-[340px] flex-col gap-[26px] pt-[70px]">
          <div className="flex items-center gap-[22px]">
            <OkDairesi boyut={48} />
            <span className="genis text-[clamp(26px,2.8vw,36px)]">Kodunu bul</span>
          </div>
          <p className="m-0 text-[13px] leading-[1.7] tracking-[0.03em]">
            Parfümün adını, markasını ya da elindeki muadil kodunu yaz. Bargello, Mad ve Muscent'teki karşılıklarını
            fiyatlarıyla birlikte gösterelim.
          </p>
          <Link to="/parfumler" className="cizgili kucuk inline-flex min-h-12 w-fit items-center gap-3 rounded-full border-[1.5px] border-yazi px-7">
            tüm parfümler <Ok />
          </Link>
        </div>
      </div>
      <div className="mt-[30px] flex justify-center text-[13px] font-bold tracking-[0.08em]">05</div>
    </section>
  );
}

export default function AnaSayfa() {
  const [searchParams] = useSearchParams();
  const ara = searchParams.get("ara") ?? "";
  const aramaAktif = searchParams.has("ara");
  const [parfumler, setParfumler] = useState<ParfumListe[]>([]);
  const [hata, setHata] = useState("");

  useEffect(() => {
    apiIstek<ParfumListe[]>(`/api/parfumler${ara ? `?ara=${encodeURIComponent(ara)}` : ""}`)
      .then(setParfumler)
      .catch((e) => setHata(e.message));
  }, [ara]);

  const populerler = aramaAktif
    ? []
    : [...parfumler].sort((a, b) => b.muadilSayisi - a.muadilSayisi || a.ad.localeCompare(b.ad, "tr")).slice(0, 6);

  return (
    <>
      {aramaAktif ? <AramaSonuclari parfumler={parfumler} ara={ara} /> : <BlogdaOneCikan />}

      <KayanSerit />

      {!aramaAktif && <BuHaftaEnPopuler populerler={populerler} toplamSayi={parfumler.length} />}

      <SevdiginKoku />

      <HataMesaji mesaj={hata} />

      <Footer />
    </>
  );
}
