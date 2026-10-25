"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { createPortal } from "react-dom";
import { DELIK, ParfumSisesi } from "@/components/parfum-sisesi";

// Notalar bölümü: şişeye basınca pompa topu sıkışır, delikten parlamalar sola fışkırıp aşağı dökülür,
// nota harfleri ve ikonları sağdan uçarak yerine oturur. Bölüm ekrana ilk girdiğinde bir kez kendiliğinden sıkılır.
// prefers-reduced-motion: animasyon yok, notalar doğrudan görünür.

type Nota = { ad: string; slug: string; gorselUrl: string | null; aciklama: string | null };
type Katman = "ust" | "orta" | "alt";

const KATMANLAR: { anahtar: Katman; baslik: string; basla: number; genislik: string }[] = [
  { anahtar: "ust", baslik: "üst · ilk dakikalar", basla: 0.15, genislik: "max-w-[182px]" },
  { anahtar: "orta", baslik: "orta · ilk saatler", basla: 0.75, genislik: "max-w-[276px]" },
  { anahtar: "alt", baslik: "alt · gün boyu", basla: 1.45, genislik: "max-w-[370px]" },
];

const SISE_GENISLIK = 56;
const PARILTI_SAYISI = 72;
const KART_GENISLIK = 240;
const IKON = 52;

// Notanın üstüne gelince çıkan açıklama kartı; x, ust, alt: notanın ekrandaki konumu (px)
type Kart = { ad: string; metin: string; x: number; ust: number; alt: number };

type Puf = 0 | 1 | 2; // 0 yok, 1 fışkırma, 2 dökülme

// Görseli olmayan nota için marka yıldızı; sütunlar hizalı kalsın.
function NotaYildizi() {
  return (
    <svg width={IKON * 0.5} height={IKON * 0.5} viewBox="0 0 24 24" aria-hidden="true" style={{ margin: IKON * 0.25, opacity: 0.7 }}>
      <path d="M12 1Q12 12 23 12Q12 12 12 23Q12 12 1 12Q12 12 12 1Z" fill="currentColor" />
    </svg>
  );
}

const hareketAzaltilsin = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function NotaSprey({ notalar, baslik = "Notalar" }: { notalar: Record<Katman, Nota[]>; baslik?: string }) {
  const [gorunur, setGorunur] = useState(false); // harfler yerinde mi
  const [puf, setPuf] = useState<Puf>(0);
  const [basili, setBasili] = useState(false);
  const [sayac, setSayac] = useState(0);
  const [tiklandi, setTiklandi] = useState(false);
  const [kart, setKart] = useState<Kart | null>(null);
  const zamanlayicilar = useRef<number[]>([]);
  const bolum = useRef<HTMLElement>(null);

  function kartAc(el: HTMLElement, ad: string, metin: string) {
    const r = el.getBoundingClientRect();
    setKart({ ad, metin, x: r.left + r.width / 2, ust: r.top, alt: r.bottom });
  }

  // Fare notadan ayrılınca kart kapanır. Dokunmatikte notaya dokununca açılır; kaydırınca ya da kart dışına dokununca kapanır.
  const kartAcik = kart !== null;
  useEffect(() => {
    if (!kartAcik) return;
    const kapat = () => setKart(null);
    const disaridaKapat = (e: globalThis.PointerEvent) => {
      if (!(e.target as Element).closest?.("[data-nota-kart]")) kapat();
    };
    window.addEventListener("scroll", kapat, { passive: true, capture: true });
    window.addEventListener("resize", kapat);
    document.addEventListener("pointerdown", disaridaKapat);
    return () => {
      window.removeEventListener("scroll", kapat, { capture: true });
      window.removeEventListener("resize", kapat);
      document.removeEventListener("pointerdown", disaridaKapat);
    };
  }, [kartAcik]);

  function temizle() {
    zamanlayicilar.current.forEach(clearTimeout);
    zamanlayicilar.current = [];
  }

  function sik() {
    temizle();
    if (hareketAzaltilsin()) {
      setGorunur(true);
      setPuf(0);
      return;
    }
    setGorunur(false);
    setPuf(0);
    setBasili(true);
    setSayac((s) => s + 1);
    const sonra = (ms: number, f: () => void) => zamanlayicilar.current.push(window.setTimeout(f, ms));
    sonra(90, () => setPuf(1));
    sonra(160, () => setGorunur(true));
    sonra(260, () => setBasili(false));
    sonra(620, () => setPuf(2));
    sonra(4200, () => setPuf(0));
  }

  // İlk görünüşte bir kez sık
  useEffect(() => {
    const el = bolum.current;
    if (!el) return;
    const gozcu = new IntersectionObserver(
      ([g]) => {
        if (g.isIntersecting) {
          sik();
          gozcu.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    gozcu.observe(el);
    return () => {
      gozcu.disconnect();
      temizle();
    };
  }, []);

  // Sayaç her sıkışta değişir, böylece harflerin geliş yönü her seferinde farklı olur
  const rasgele = (n: number) => {
    const x = Math.sin(n * 12.9898 + sayac * 7.13) * 43758.5453;
    return x - Math.floor(x);
  };

  // Sağdan uçarak yerine oturma: harfler de ikonlar da aynı hareketi kullanır
  const ucusStili = (r1: number, r2: number, gecikme: string): CSSProperties =>
    gorunur
      ? {
          display: "inline-block",
          transform: "none",
          opacity: 1,
          filter: "blur(0)",
          transition: `transform .9s cubic-bezier(.15,.75,.25,1) ${gecikme}s, opacity .45s ease ${gecikme}s, filter .9s ease ${gecikme}s`,
        }
      : {
          display: "inline-block",
          transform: `translate(${Math.round(140 + r1 * 120)}px, ${Math.round(-60 + r2 * 60)}px) rotate(${Math.round(r1 * 160 - 80)}deg) scale(.4)`,
          opacity: 0,
          filter: "blur(4px)",
          transition: "none",
        };

  let sayi = 0;
  const katmanlar = KATMANLAR.map((k) => {
    let sira = 0;
    const kelimeler = notalar[k.anahtar].map((n) => {
      // İkon, adın ilk harfiyle aynı tohumdan beslenir; ikonla ad birlikte gelir
      const ilk = sayi + 1;
      const ikonStil = ucusStili(rasgele(ilk), rasgele(ilk + 99), (k.basla + (sira + 1) * 0.028 + rasgele(ilk + 199) * 0.12).toFixed(3));
      const harfler = Array.from(n.ad).map((c) => {
        sayi += 1;
        sira += 1;
        const r1 = rasgele(sayi), r2 = rasgele(sayi + 99), r3 = rasgele(sayi + 199);
        const gecikme = (k.basla + sira * 0.028 + r3 * 0.12).toFixed(3);
        return { c, bosluk: c === " ", stil: ucusStili(r1, r2, gecikme) };
      });
      // Dar sütunda alt satıra geçebilsin diye ad kelimelere bölünür
      const adKelimeleri = harfler.reduce<(typeof harfler)[]>(
        (liste, h) => {
          if (h.bosluk) liste.push([]);
          else liste[liste.length - 1].push(h);
          return liste;
        },
        [[]],
      );
      return { ...n, aciklama: n.aciklama?.trim() || null, ikonStil, adKelimeleri };
    });
    return { ...k, kelimeler };
  }).filter((k) => k.kelimeler.length > 0);

  const parlamalar = Array.from({ length: PARILTI_SAYISI }, (_, i) => {
    const aci = ((180 + (rasgele(i + 500) - 0.5) * 70 - 6) * Math.PI) / 180;
    const uzaklik = 30 + Math.pow(rasgele(i + 600), 0.6) * 210;
    const boy = 0.6 + rasgele(i + 700) * 1.2;
    const gec = (rasgele(i + 800) * 0.15).toFixed(3);
    const dus = (rasgele(i + 850) * 0.9).toFixed(2);
    const acik = rasgele(i + 900) > 0.5;
    const bx = Math.cos(aci) * uzaklik;
    const by = Math.sin(aci) * uzaklik;
    const tx = puf === 1 ? bx : puf === 2 ? bx - 10 - rasgele(i + 950) * 25 : 0;
    const ty = puf === 1 ? by : puf === 2 ? by + 150 + rasgele(i + 990) * 170 : 0;
    const gecis =
      puf === 1
        ? `transform .5s cubic-bezier(.05,.85,.3,1) ${gec}s, opacity .08s ease ${gec}s`
        : puf === 2
          ? `transform ${(2.2 + rasgele(i + 1010) * 0.8).toFixed(2)}s cubic-bezier(.45,0,.75,.6) ${dus}s, opacity .9s ease ${(1.6 + rasgele(i + 1050) * 0.9).toFixed(2)}s`
          : "none";
    const stil: CSSProperties = {
      position: "absolute",
      left: 0,
      top: 0,
      width: boy,
      height: boy,
      borderRadius: "50%",
      pointerEvents: "none",
      background: acik ? "var(--p1)" : "var(--p2)",
      boxShadow: `0 0 3px .5px ${acik ? "rgba(245,230,227,.8)" : "rgba(160,132,134,.7)"}`,
      opacity: puf === 1 ? 0.95 : 0,
      transform: `translate(${tx.toFixed(0)}px, ${ty.toFixed(0)}px)`,
      transition: gecis,
    };
    return stil;
  });

  const yukseklik = Math.round((SISE_GENISLIK * 260) / 240);

  // Fare üstüne gelince açılır, ayrılınca kapanır; dokunmatikte dokunuş açar (kapatmayı yukarıdaki efekt yapar)
  const kartOlaylari = (ad: string, metin: string) => ({
    onPointerEnter: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType !== "touch") kartAc(e.currentTarget, ad, metin);
    },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType !== "touch") setKart(null);
    },
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === "touch") kartAc(e.currentTarget, ad, metin);
    },
  });

  // Kart notanın üstünde durur; yer yoksa altında. Yatayda ekran dışına taşmaz, ok notayı gösterir.
  const kartSol = kart ? Math.max(8, Math.min(kart.x - KART_GENISLIK / 2, window.innerWidth - KART_GENISLIK - 8)) : 0;
  const kartUstte = kart ? kart.ust > 160 : true;

  return (
    <section ref={bolum} aria-labelledby="notalar-baslik" className="flex w-full max-w-[380px] flex-col">
      <div className="flex items-center justify-center gap-3">
        <h2 id="notalar-baslik" className="genis m-0 text-[clamp(26px,3vw,40px)] leading-none font-extrabold">
          {baslik}
        </h2>
        <button
          type="button"
          onClick={() => {
            setTiklandi(true);
            sik();
          }}
          aria-label="Parfümü sık, notaları yeniden göster"
          className={`relative shrink-0 cursor-pointer border-0 bg-transparent p-0 ${!tiklandi ? "oynak" : ""}`}
          style={{ width: SISE_GENISLIK, height: yukseklik }}
        >
          {!tiklandi && (
            <span aria-hidden="true" className="kucuk absolute left-1/2 -top-5 -translate-x-1/2 whitespace-nowrap text-vurgu">
              tıkla
            </span>
          )}
          <ParfumSisesi genislik={SISE_GENISLIK} sikiliyor={basili} yildizlarSoluk={puf === 1} />
          {/* Parıltı katmanı püskürtme deliğine sabitlenir */}
          <span aria-hidden="true" className="pointer-events-none absolute" style={{ left: DELIK.x * SISE_GENISLIK, top: DELIK.y * yukseklik }}>
            {parlamalar.map((s, i) => (
              <span key={i} style={s} />
            ))}
          </span>
        </button>
      </div>

      <div className="mt-3 w-full max-w-[380px]">
        {katmanlar.map((k) => (
          <div key={k.anahtar} className="py-4 text-center">
            <div className={`mx-auto flex flex-col items-center gap-2 ${k.genislik}`}>
              <span className="kucuk text-[9px] text-vurgu">[{k.baslik}]</span>
              <ul className="m-0 flex list-none flex-wrap justify-center gap-x-1.5 gap-y-4 p-0">
                {k.kelimeler.map((w) => (
                  <li key={w.slug} data-nota-kart className="w-[88px]" {...(w.aciklama ? kartOlaylari(w.ad, w.aciklama) : {})}>
                    <Link
                      href={`/nota/${w.slug}`}
                      aria-label={w.aciklama ? `${w.ad}: ${w.aciklama}` : w.ad}
                      className={`flex flex-col items-center gap-2 no-underline hover:text-vurgu ${w.aciklama ? "cursor-help" : ""}`}
                    >
                      <span style={w.ikonStil} className="inline-flex" aria-hidden="true">
                        {w.gorselUrl ? (
                          <Image src={w.gorselUrl} alt="" width={IKON * 2} height={IKON * 2} className="nota-ikon block object-contain" style={{ width: IKON, height: IKON }} />
                        ) : (
                          <span className="inline-flex" style={{ width: IKON, height: IKON }}>
                            <NotaYildizi />
                          </span>
                        )}
                      </span>
                      <span className="nota-ad flex flex-wrap justify-center gap-x-[.45em]" aria-hidden="true">
                        {w.adKelimeleri.map((kelime, ki) => (
                          <span key={ki} className="inline-flex whitespace-nowrap">
                            {kelime.map((h, i) => (
                              <span key={i} style={h.stil}>
                                {h.c}
                              </span>
                            ))}
                          </span>
                        ))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Portal: üstteki overflow-hidden kapsayıcılar kartı kırpmasın. Ekran okuyucu açıklamayı bağlantının etiketinden okur. */}
      {kart &&
        createPortal(
          <div
            data-nota-kart
            aria-hidden="true"
            className="kart-gir pointer-events-none fixed z-50 px-4 py-3 text-left shadow-[0_14px_30px_rgb(0_0_0/0.4)]"
            style={{
              background: "var(--inv)",
              color: "var(--invfg)",
              left: kartSol,
              width: KART_GENISLIK,
              maxWidth: "calc(100vw - 16px)",
              ...(kartUstte ? { bottom: window.innerHeight - kart.ust + 10 } : { top: kart.alt + 10 }),
            }}
          >
            <span
              className="absolute h-2.5 w-2.5 rotate-45"
              style={{
                background: "var(--inv)",
                left: Math.max(14, Math.min(kart.x - kartSol, KART_GENISLIK - 14)) - 5,
                ...(kartUstte ? { bottom: -5 } : { top: -5 }),
              }}
            />
            <span className="kucuk block" style={{ color: "var(--invaccent)" }}>
              {kart.ad}
            </span>
            <p className="m-0 mt-1.5 text-[13px] leading-[1.6] font-medium">{kart.metin}</p>
          </div>,
          document.body,
        )}
    </section>
  );
}
