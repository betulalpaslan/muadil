import { useEffect, useId, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiIstek } from "../api/client";
import { gorselAdresi } from "../gorsel";
import { tl } from "../para";
import { ONE_CIKAN_BLOG, SON_YAZILAR } from "../tasarim/blogOrnek";
import { pastel } from "../tasarim/renk";
import type { ParfumListe } from "../types";
import { Footer } from "./OrtakYerlesim";
import Asterisk from "./tasarim/Asterisk";
import Cerceve from "./tasarim/Cerceve";
import KayanSerit from "./tasarim/KayanSerit";
import ParfumSisesi from "./tasarim/ParfumSisesi";
import PopulerSekmeler from "./tasarim/PopulerSekmeler";
import type { PopulerParfum } from "./tasarim/PopulerSekmeler";
import YildizPatlamasi from "./tasarim/YildizPatlamasi";
import { HataMesaji } from "./ui";

// Ana sayfa: blogda öne çıkan, kayan şerit, bu hafta en popüler, blog bandı, sevdiğin koku. TASARIM.md §5.

function Ok({ boyut = 12 }: { boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 15L15 5M7 5h8v8" fill="none" stroke="currentColor" strokeWidth={2.6} />
    </svg>
  );
}

function OkDairesi({ boyut = 44 }: { boyut?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-yazi bg-vurgu"
      style={{ width: boyut, height: boyut }}
    >
      <svg width={boyut * 0.4} height={boyut * 0.4} viewBox="0 0 20 20">
        <path d="M5 15L15 5M7 5h8v8" fill="none" strokeWidth={2.6} strokeLinecap="square" style={{ stroke: "var(--si)" }} />
      </svg>
    </span>
  );
}

function Rozet() {
  const id = useId();
  return (
    <svg className="rozet-don" width="96" height="96" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <path id={id} d="M50 50 m-40 0 a40 40 0 1 1 80 0 a40 40 0 1 1 -80 0" />
      </defs>
      <circle cx="50" cy="50" r="31" fill="none" strokeWidth={1.2} style={{ stroke: "var(--be)" }} />
      <text style={{ fill: "var(--be)", fontFamily: "var(--font-govde)", fontSize: "7.4px", fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase" }}>
        <textPath href={`#${id}`}>kodunu bul ✦ kodunu bul ✦ kodunu bul ✦ </textPath>
      </text>
    </svg>
  );
}

function BlogdaOneCikan() {
  return (
    <section aria-label="Blogda öne çıkan" className="flex flex-wrap items-start gap-[clamp(30px,6vw,80px)] px-[clamp(16px,5vw,70px)] pt-[70px] pb-[60px]">
      <div className="relative min-w-0 flex-1 basis-[380px] max-w-[470px]">
        <Cerceve sol={`${ONE_CIKAN_BLOG.marka.toLowerCase()} · liste`} sag="no. 01">
          <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-vurgu">
            <ParfumSisesi genislik={200} govde="var(--si)" parlak="var(--ta)" />
          </div>
        </Cerceve>
        <Asterisk boyut={76} className="absolute top-[46px] left-[max(-34px,-2vw)] z-[3]" />
        <span className="absolute bottom-10 left-[max(-30px,-2vw)] z-[3] text-[22px] font-medium tracking-[0.04em] max-[760px]:hidden">
          {ONE_CIKAN_BLOG.sayi}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 basis-[380px] flex-col gap-[34px] pt-1">
        <div className="flex items-center justify-between">
          <span className="flex gap-1.5" aria-label="Bargello, Mad, Muscent">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-yazi text-[8px] font-extrabold text-zemin">B</span>
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] border-yazi text-[8px] font-extrabold">M</span>
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] border-yazi text-[8px] font-extrabold">M</span>
          </span>
          <span className="text-[13px] font-bold tracking-[0.08em]">01</span>
        </div>
        <h1 className="genis m-0 text-[clamp(30px,3.6vw,48px)] leading-[1.45] [word-spacing:.2em]">
          En iyi <span className="font-extrabold">{ONE_CIKAN_BLOG.sayi}</span>
          <br />
          <span className="text-vurgu">{ONE_CIKAN_BLOG.marka}</span> {ONE_CIKAN_BLOG.baslikSonu}
          <br />
          {ONE_CIKAN_BLOG.soru}{" "}
          <a href="#" aria-label="Yazıyı oku" className="ml-2 inline-flex align-middle">
            <OkDairesi />
          </a>
        </h1>
        <p className="m-0 max-w-[470px] text-sm leading-[1.75] tracking-[0.03em] text-justify">{ONE_CIKAN_BLOG.aciklama}</p>
        <span className="kucuk text-vurgu">{ONE_CIKAN_BLOG.etiket}</span>
      </div>
    </section>
  );
}

function AramaSonuclari({ parfumler, ara }: { parfumler: ParfumListe[]; ara: string }) {
  return (
    <section aria-label="Arama sonuçları" className="px-[clamp(16px,5vw,70px)] pt-[70px] pb-[60px]">
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
    <section aria-label="En popüler parfümler" className="relative px-[clamp(16px,5vw,70px)] pt-[70px] pb-20">
      <div className="mb-[30px] flex flex-wrap items-end justify-between gap-4">
        <h2 className="genis m-0 text-[clamp(30px,3.6vw,48px)] leading-[1.3] [word-spacing:.2em]">
          <span className="text-vurgu">Bu hafta</span>
          <br />
          <span className="font-extrabold">en</span> popüler
        </h2>
        <div className="flex items-center gap-[18px]">
          <span className="kucuk text-soluk max-[760px]:hidden">{populerler.length} parfüm · sekmeye dokun</span>
          <Rozet />
        </div>
      </div>

      {populerVeri.length === 0 ? (
        <p className="text-sm">Henüz parfüm eklenmedi.</p>
      ) : (
        <PopulerSekmeler parfumler={populerVeri} />
      )}

      <div className="mt-10 flex justify-center">
        <Link to="/?ara=" className="cizgili kucuk inline-flex min-h-12 items-center gap-3 rounded-full border-[1.5px] border-yazi px-7">
          tüm parfümler ({toplamSayi}) <Ok />
        </Link>
      </div>
    </section>
  );
}

function BlogBandi() {
  return (
    <section aria-label="Blog" className="bg-yazi px-[clamp(16px,5vw,70px)] pt-[70px] pb-[76px] text-zemin">
      <div className="mb-[34px] flex flex-wrap items-end justify-between gap-4">
        <h2 className="genis m-0 text-[clamp(30px,3.6vw,48px)] leading-[1.3] [word-spacing:.2em]">
          Blogdan
          <br />
          <span className="font-extrabold">son</span> yazılar
        </h2>
        <a href="#" className="kucuk inline-flex min-h-11 items-center gap-2.5 rounded-full border-[1.5px] border-zemin px-6">
          tümü <Ok />
        </a>
      </div>
      <div className="grid gap-[clamp(20px,3vw,40px)]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {SON_YAZILAR.map((y, i) => (
          <a key={i} href="#" className="flex flex-col gap-4 text-zemin no-underline">
            <Cerceve ters sol={y.kategori} sag={`no. ${String(i + 2).padStart(2, "0")}`}>
              <div className="flex aspect-[4/3] items-center justify-center bg-yuzey">
                <span className="kucuk text-[8px] text-soluk">görsel</span>
              </div>
            </Cerceve>
            <span className="kucuk text-[9px] text-vurgu-ters">
              {y.kategori} · {y.sure}
            </span>
            <span className="genis text-[19px] leading-[1.35] tracking-[0.08em]">{y.baslik}</span>
            <span className="kucuk inline-flex items-center gap-2 text-[9px]">
              oku <Ok boyut={10} />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function SevdiginKoku() {
  return (
    <section aria-label="Sevdiğin koku" className="relative border-t-[1.5px] border-yazi px-[clamp(16px,5vw,70px)] pt-[76px] pb-[70px]">
      <YildizPatlamasi boyut={70} className="absolute top-[70px] right-[clamp(16px,5vw,70px)] max-[760px]:hidden" />
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
          <Link to="/?ara=" className="cizgili kucuk inline-flex min-h-12 w-fit items-center gap-3 rounded-full border-[1.5px] border-yazi px-7">
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

      <BlogBandi />
      <SevdiginKoku />

      <HataMesaji mesaj={hata} />

      <Footer />
    </>
  );
}
