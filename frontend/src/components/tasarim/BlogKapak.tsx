import { useState } from "react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";

// Blogda öne çıkanın kapağı: beyaz sahnede şişeler yan yana, çerçevesiz. Ortadaki en önde ve en büyük,
// kenardakiler biraz küçük ve yukarıda (uzaklık hissi). Şişeler havada süzülür, imleçle birlikte çok hafif kayar.
// Bir şişenin üstüne gelince (ya da dokununca, odaklanınca) ortadaki şişeyle yer değiştirir, camında parlama geçer.
// Tıklama alanları yuvalara bağlı, şişeye değil: şişe hareket edince imlecin altına başka şişe girip
// durmadan yer değiştirmesin diye (bir yuvaya ancak imleç girince tetiklenir).
// Sahne temaya göre: gece koyu (arkadan şampanya/bronz ışık, kapak-isik), gündüz beyaz (fotoğraflar beyaz zeminde
// çekildi). Renkler --ks-* değişkenlerinden gelir (tasarim.css); içine konan `baslik` da bunları kullanmalı,
// sayfa temasının --be/--si renkleri sahnenin zeminiyle uyuşmaz.
// Açılışta ışık yanar, şişeler ortadan kenara yükselir (sise-cik), omuzlarda ✦ ışıltıları yanıp söner;
// öne gelen şişe değişince ışık bir kez çakar.
// `baslik` sahnenin en üstünde durur ve tıklama yuvalarının üstündedir (içindeki bağlantı tıklanabilir kalır).
// `bilgi`: sahnenin hemen altına, ortadaki (öne gelen) şişenin `sise` dizisindeki sırasıyla çağrılır; okuma sayfası
// bununla şişenin bilgisini gösterir.
// Şişe fotoğrafları 161x539 (bkz. blogOrnek.ts); genişlik = yükseklik * 161/539.
// prefers-reduced-motion: süzülme, eğim, parlama ve yer değiştirme animasyonu kapanır (sise-* sınıfları, tasarim.css).

export type KapakSise = { ad: string; gorsel: string };

// ✦ ışıltıları: [sahnede sol %, üst %, boyut px, gecikme sn]; şişelerin omuz hizasında.
const ISILTILAR: [number, number, number, number][] = [
  [36, 44, 16, 0],
  [50, 34, 22, 1.2],
  [63, 46, 14, 2.1],
  [27, 62, 12, 0.7],
  [74, 60, 18, 1.8],
];

type Props = {
  ad: string;
  sise: KapakSise[];
  baslik?: ReactNode;
  bilgi?: (sise: number) => ReactNode;
};

export default function BlogKapak({ ad, sise, baslik, bilgi }: Props) {
  const n = sise.length;
  const merkez = (n - 1) / 2;
  const orta = Math.round(merkez);
  const [sira, setSira] = useState(() => sise.map((_, i) => i)); // sira[yuva] = o yuvadaki şişe

  function getir(yuva: number) {
    if (yuva === orta) return;
    setSira((s) => {
      const y = [...s];
      [y[yuva], y[orta]] = [y[orta], y[yuva]];
      return y;
    });
  }

  function izle(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", String(((e.clientX - r.left) / r.width - 0.5) * 2));
    e.currentTarget.style.setProperty("--py", String(((e.clientY - r.top) / r.height - 0.5) * 2));
  }

  function birak(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.style.removeProperty("--px");
    e.currentTarget.style.removeProperty("--py");
  }

  return (
    <>
      <div
        onPointerMove={izle}
        onPointerLeave={birak}
        className={`relative isolate overflow-hidden bg-[var(--ks-bg)] px-[4%] pb-[clamp(72px,8vw,104px)] [--g:clamp(4px,6cqw,84px)] [--h:clamp(130px,38cqw,310px)] [--w:calc(var(--h)*161/539)] [container-type:inline-size] ${baslik ? "pt-[clamp(18px,2.5vw,32px)]" : "pt-[clamp(20px,3.5vw,44px)]"}`}
      >
        <span aria-hidden="true" className="kapak-isik pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[88%]">
          <span key={sira[orta]} className="kapak-isik-vur absolute inset-0" />
        </span>
        {baslik && <div className="relative z-40 mb-[clamp(14px,2.5vw,28px)]">{baslik}</div>}
        <ul aria-label={ad} className="m-0 flex list-none items-end justify-center gap-[var(--g)] p-0">
          {sise.map((x, b) => {
            const yuva = sira.indexOf(b);
            const uzak = merkez === 0 ? 0 : Math.abs((yuva - merkez) / merkez); // 0 ortada, 1 en kenarda
            const aktif = yuva === orta;
            const stil = {
              "--home": b,
              "--slot": yuva,
              "--i": b,
              "--k": Math.abs(b - merkez),
              "--s": 1.04 - 0.16 * uzak,
              "--y": `${-12 * uzak}px`,
              "--d": 24 - 14 * uzak,
              zIndex: 10 - Math.round(uzak * 4),
            } as CSSProperties;
            return (
              <li key={x.ad} style={stil} className="sise-yer sise-cik relative">
                <div className="sise-egim relative">
                  <span aria-hidden="true" className="pointer-events-none absolute -bottom-2 left-1/2 w-[130%] -translate-x-1/2">
                    <span className="sise-golge block h-[18px] rounded-[50%] bg-[var(--ks-golge)] blur-[10px]" />
                  </span>

                  <div className="sise-yuz relative">
                    <img src={x.gorsel} alt={`Zara ${x.ad}`} className="block h-[var(--h)] w-auto" />
                    <span
                      aria-hidden="true"
                      className={`sise-parilti pointer-events-none absolute inset-0 ${aktif ? "[background-position:0%_0] transition-[background-position] duration-1000 ease-out" : ""}`}
                      style={{ maskImage: `url(${x.gorsel})`, WebkitMaskImage: `url(${x.gorsel})` }}
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-full left-0 h-full w-full scale-y-[-1] opacity-30 [mask-image:linear-gradient(to_top,#000,transparent_34%)]"
                    >
                      <img src={x.gorsel} alt="" className="block h-full w-full" />
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
          {ISILTILAR.map(([x, y, boyut, gec], i) => (
            <svg
              key={i}
              viewBox="0 0 20 20"
              width={boyut}
              height={boyut}
              className="isilti absolute -translate-x-1/2 -translate-y-1/2 max-[600px]:hidden"
              style={{ left: `${x}%`, top: `${y}%`, "--gec": `${gec}s` } as CSSProperties}
            >
              <path d="M10 0C10 6 14 10 20 10C14 10 10 14 10 20C10 14 6 10 0 10C6 10 10 6 10 0Z" style={{ fill: "var(--ks-isilti)" }} />
            </svg>
          ))}
        </div>

        <div className="absolute inset-0 z-30 flex justify-center">
          {sise.map((_, yuva) => (
            <button
              key={yuva}
              type="button"
              aria-label={`${sise[sira[yuva]].ad}, öne getir`}
              aria-pressed={yuva === orta}
              onPointerEnter={() => getir(yuva)}
              onFocus={() => getir(yuva)}
              onClick={() => getir(yuva)}
              className="h-full w-[calc(var(--w)+var(--g))] cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--ks-yazi)]"
            />
          ))}
        </div>
      </div>
      {bilgi?.(sira[orta])}
    </>
  );
}
