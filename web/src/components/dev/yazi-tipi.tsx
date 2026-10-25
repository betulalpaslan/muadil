"use client";

import { useEffect, useState } from "react";

// Tasarım sekmesinin "Yazı tipi" bölümü: başlık (--serif) ve gövde (--sans) fontlarını canlı değiştirir.
// Sitedeki bütün yazılar bu iki değişkeni kullanır (globals.css). Seçilen Google fontu geliştirme sırasında
// fonts.googleapis.com'dan yüklenir (yalnızca bu widget; üretimde yüklenmez). Ayar temadan bağımsızdır, localStorage'da tutulur.

type Font = { ad: string; deger: string; google?: string };

// `deger`: CSS font-family adı; `google`: css2 `family=` parametresi (yüklü / sistem fontlarında yok).
const BASLIK: Font[] = [
  { ad: "Roboto (varsayılan)", deger: '"Roboto"' },
  { ad: "Fraunces", deger: '"Fraunces"', google: "Fraunces:ital,wght@0,400..700;1,400..700" },
  { ad: "Playfair Display", deger: '"Playfair Display"', google: "Playfair+Display:ital,wght@0,400..800;1,400..800" },
  { ad: "Cormorant Garamond", deger: '"Cormorant Garamond"', google: "Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600" },
  { ad: "DM Serif Display", deger: '"DM Serif Display"', google: "DM+Serif+Display:ital@0;1" },
  { ad: "Lora", deger: '"Lora"', google: "Lora:ital,wght@0,400..700;1,400..700" },
  { ad: "Libre Baskerville", deger: '"Libre Baskerville"', google: "Libre+Baskerville:ital,wght@0,400..700;1,400..700" },
  { ad: "Bodoni Moda", deger: '"Bodoni Moda"', google: "Bodoni+Moda:ital,wght@0,400..700;1,400..700" },
  { ad: "Cinzel", deger: '"Cinzel"', google: "Cinzel:wght@400..700" },
  { ad: "Georgia (sistem)", deger: "Georgia" },
];
const GOVDE: Font[] = [
  { ad: "Roboto (varsayılan)", deger: '"Roboto"' },
  { ad: "Jost", deger: '"Jost"', google: "Jost:wght@300..700" },
  { ad: "Inter", deger: '"Inter"', google: "Inter:wght@300..700" },
  { ad: "Manrope", deger: '"Manrope"', google: "Manrope:wght@300..700" },
  { ad: "DM Sans", deger: '"DM Sans"', google: "DM+Sans:ital,wght@0,300..700;1,300..700" },
  { ad: "Montserrat", deger: '"Montserrat"', google: "Montserrat:ital,wght@0,300..700;1,300..700" },
  { ad: "Poppins", deger: '"Poppins"', google: "Poppins:ital,wght@0,300;0,400;0,500;0,600;1,400" },
  { ad: "Raleway", deger: '"Raleway"', google: "Raleway:wght@300..700" },
  { ad: "Schibsted Grotesk", deger: '"Schibsted Grotesk"', google: "Schibsted+Grotesk:wght@400..700" },
  { ad: "Sistem (system-ui)", deger: "system-ui" },
];

const ANAHTAR = "yazi-tipi-ayari";
type Ayar = { serif?: string; sans?: string }; // seçilen Font.ad

const bul = (liste: Font[], ad?: string) => liste.find((f) => f.ad === ad);

function oku(): Ayar {
  try {
    return JSON.parse(localStorage.getItem(ANAHTAR) ?? "{}") as Ayar;
  } catch {
    return {};
  }
}

function yukle(f: Font) {
  if (!f.google) return;
  const id = `dev-font-${f.google}`;
  if (document.getElementById(id)) return;
  const l = document.createElement("link");
  l.id = id;
  l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${f.google}&display=swap`;
  document.head.appendChild(l);
}

function uygula(a: Ayar) {
  const st = document.documentElement.style;
  const b = bul(BASLIK, a.serif);
  const g = bul(GOVDE, a.sans);
  if (b) yukle(b);
  if (g) yukle(g);
  if (b) st.setProperty("--serif", `${b.deger}, Georgia, "Times New Roman", serif`);
  else st.removeProperty("--serif");
  if (g) st.setProperty("--sans", `${g.deger}, system-ui, sans-serif`);
  else st.removeProperty("--sans");
}

// "CSS'i kopyala" çıktısı için: değişen yazı tiplerinin :root bloğu (boşsa null).
export function yaziTipiCss(): string | null {
  const a = oku();
  const b = bul(BASLIK, a.serif);
  const g = bul(GOVDE, a.sans);
  const satirlar = [
    b && `  --serif: ${b.deger}, Georgia, "Times New Roman", serif;`,
    g && `  --sans: ${g.deger}, system-ui, sans-serif;`,
  ].filter(Boolean);
  if (!satirlar.length) return null;
  const not = [b?.google && `${b.ad}`, g?.google && `${g.ad}`].filter(Boolean);
  return `${not.length ? `/* Google fontu: ${not.join(", ")} → @fontsource ile kur ya da <link> ekle */\n` : ""}:root {\n${satirlar.join("\n")}\n}`;
}

const GIRDI = "min-w-0 flex-1 rounded-lg border border-[#f2eee8]/20 bg-black p-2 text-[11px] text-[#f2eee8]";
const ETIKET = "w-[96px] shrink-0 text-[11px] text-[#8a8580]";

export function YaziTipiBolumu() {
  const [a, setA] = useState<Ayar>({});

  useEffect(() => {
    const kayit = oku();
    setA(kayit);
    uygula(kayit);
  }, []);

  const degistir = (y: Ayar) => {
    const n = { ...a, ...y };
    if (!n.serif) delete n.serif;
    if (!n.sans) delete n.sans;
    setA(n);
    uygula(n);
    try {
      if (Object.keys(n).length) localStorage.setItem(ANAHTAR, JSON.stringify(n));
      else localStorage.removeItem(ANAHTAR);
    } catch {
      /* depolama kapalı: ayar bu oturumda geçerli */
    }
  };

  const secici = (etiket: string, liste: Font[], anahtar: keyof Ayar) => (
    <div className="flex items-center gap-2">
      <span className={ETIKET}>{etiket}</span>
      <select value={a[anahtar] ?? liste[0].ad} onChange={(e) => degistir({ [anahtar]: e.target.value === liste[0].ad ? "" : e.target.value })} className={GIRDI} aria-label={etiket}>
        {liste.map((f) => (
          <option key={f.ad} value={f.ad}>
            {f.ad}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <section className="flex flex-col gap-2 border-t border-[#f2eee8]/15 pt-3">
      <h3 className="m-0 text-[11px] font-bold tracking-[0.14em] uppercase">Yazı tipi</h3>
      {secici("Başlıklar", BASLIK, "serif")}
      {secici("Gövde", GOVDE, "sans")}
      <p className="m-0 text-[11px] leading-snug text-[#8a8580]">Seçilen font Google Fonts'tan canlı yüklenir (internet gerekir). Sıfırlamak için listeden "varsayılan"ı seç.</p>
    </section>
  );
}
