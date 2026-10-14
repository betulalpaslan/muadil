import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { NotaKatmani, ParfumNota } from "../../types";
import ParfumSisesi, { DELIK } from "./ParfumSisesi";

// Notalar bölümü: şişeye basınca pompa topu sıkışır, delikten gümüş parlamalar
// sola fışkırıp aşağı dökülür, nota harfleri sağdan uçarak yerine oturur.
// Bölüm ekrana ilk girdiğinde bir kez kendiliğinden sıkılır (notalar gizli kalmasın).
// prefers-reduced-motion: animasyon yok, notalar doğrudan görünür.

const KATMANLAR: { katman: NotaKatmani; baslik: string; basla: number }[] = [
  { katman: "Ust", baslik: "üst · ilk dakikalar", basla: 0.15 },
  { katman: "Orta", baslik: "orta · ilk saatler", basla: 0.75 },
  { katman: "Alt", baslik: "alt · gün boyu", basla: 1.45 },
];

const SISE_GENISLIK = 56;
const PARILTI_SAYISI = 72;

// Katmanlar aşağı indikçe genişler; böylece liste bir koku piramidinin kesitini andırır.
const PIRAMIT_GENISLIK: Record<NotaKatmani, string> = {
  Ust: "max-w-[180px]",
  Orta: "max-w-[280px]",
  Alt: "max-w-[380px]",
};

type Puf = 0 | 1 | 2; // 0 yok, 1 fışkırma, 2 dökülme

function hareketAzaltilsin() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export default function NotaSprey({ notalar }: { notalar: ParfumNota[] }) {
  const [gorunur, setGorunur] = useState(false); // harfler yerinde mi
  const [puf, setPuf] = useState<Puf>(0);
  const [basili, setBasili] = useState(false);
  const [sayac, setSayac] = useState(0);
  const [tiklandi, setTiklandi] = useState(false);
  const zamanlayicilar = useRef<number[]>([]);
  const bolum = useRef<HTMLElement>(null);

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
      { threshold: 0.4 }
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

  let sayi = 0;
  const katmanlar = KATMANLAR.map((k) => {
    let sira = 0;
    const kelimeler = notalar
      .filter((n) => n.katman === k.katman)
      .map((n) => ({
        id: n.notaId,
        ad: n.notaAd,
        harfler: Array.from(n.notaAd).map((c) => {
          sayi += 1;
          sira += 1;
          const r1 = rasgele(sayi), r2 = rasgele(sayi + 99), r3 = rasgele(sayi + 199);
          const gecikme = (k.basla + sira * 0.028 + r3 * 0.12).toFixed(3);
          const stil: CSSProperties = gorunur
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
          return { c: c === " " ? " " : c, stil };
        }),
      }));
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
      boxShadow: `0 0 3px .5px ${acik ? "rgba(175,182,191,.9)" : "rgba(140,147,156,.7)"}`,
      opacity: puf === 1 ? 0.95 : 0,
      transform: `translate(${tx.toFixed(0)}px, ${ty.toFixed(0)}px)`,
      transition: gecis,
    };
    return stil;
  });

  const yukseklik = Math.round((SISE_GENISLIK * 260) / 240);

  return (
    <section ref={bolum} aria-labelledby="notalar-baslik" className="flex flex-col">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1.5">
          <h2 id="notalar-baslik" className="genis text-[clamp(30px,3.6vw,48px)] font-extrabold [word-spacing:.3em]">
            Notalar
          </h2>
          <span className="kucuk text-vurgu">{sayac > 0 ? "tekrar sık" : "şişeye dokun"}</span>
        </div>
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
            <span
              aria-hidden="true"
              className="kucuk absolute left-1/2 -top-5 -translate-x-1/2 whitespace-nowrap text-vurgu"
            >
              tıkla
            </span>
          )}
          <ParfumSisesi genislik={SISE_GENISLIK} sikiliyor={basili} yildizlarSoluk={puf === 1} />
          {/* Parıltı katmanı püskürtme deliğine sabitlenir */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{ left: DELIK.x * SISE_GENISLIK, top: DELIK.y * yukseklik }}
          >
            {parlamalar.map((s, i) => (
              <span key={i} style={s} />
            ))}
          </span>
        </button>
      </div>

      <div className="mt-3 max-w-[380px]">
        {katmanlar.map((k) => (
          <div key={k.katman} className="py-4 text-center">
            <div className={`mx-auto flex flex-col items-center gap-2 ${PIRAMIT_GENISLIK[k.katman]}`}>
              <span className="kucuk text-[9px] text-vurgu">[{k.baslik}]</span>
              {/* Ekran okuyucu için düz metin; animasyonlu harfler gizli */}
              <span className="sr-only">{k.kelimeler.map((w) => w.ad).join(", ")}</span>
              <div className="flex flex-wrap justify-center gap-x-[18px]" aria-hidden="true">
                {k.kelimeler.map((w) => (
                  <span key={w.id} className="genis inline-flex text-[22px] leading-[1.4] whitespace-nowrap">
                    {w.harfler.map((h, i) => (
                      <span key={i} style={h.stil}>
                        {h.c}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
