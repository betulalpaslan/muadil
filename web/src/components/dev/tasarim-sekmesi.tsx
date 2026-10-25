"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ArkaPlanBolumu, arkaPlanDeclarations, arkaPlanOku } from "./arka-plan";
import { YaziTipiBolumu, yaziTipiCss } from "./yazi-tipi";
import { hexHsl, hslHex, renkCoz, renkYaz, sinirla } from "./renk";
import type { Harita } from "./renk";

// Geliştirici widget'ının "Tasarım" sekmesi: site paletini (globals.css'teki CSS değişkenleri) canlı ayarlar.
// Değişkenler <html> üzerine yazılır, temaya özel (koyu / açık) localStorage'da tutulur; beğenilen değerler
// "CSS'i kopyala" ile globals.css'e taşınır.

const ANAHTAR = "renk-ayari";

const DEGISKENLER = [
  "--bg", "--ink", "--paper", "--muted",
  "--gold", "--gold-hi", "--gold-lo", "--gold-grad", "--gold-surf",
  "--onaccent", "--btn", "--btnfg",
  "--line", "--surf", "--track",
  "--inv", "--invfg", "--invaccent", "--footer", "--vs-bg", "--p1", "--p2",
  "--ac", "--dalga", "--shadow",
];

// Üç hazır palet (globals.css'te :root / [data-palet]). Seçim <html data-palet> + localStorage'a yazılır.
const PALETLER = [
  { id: "gul", ad: "Gül", renkler: ["#f5e8e6", "#5e1a40", "#3a1230"] },
  { id: "gece", ad: "Gece", renkler: ["#160a14", "#e6a6c6", "#f6e6ee"] },
  { id: "adacayi", ad: "Adaçayı", renkler: ["#eaf0e6", "#1f4f36", "#17301f"] },
];
const PALET_ANAHTAR = "muadil-palet";

const ANA_RENKLER = [
  { ad: "Antik altın", hex: "#cdb069" },
  { ad: "Şampanya", hex: "#d6bb8d" },
  { ad: "Altın sarısı", hex: "#e2b93b" },
  { ad: "Kehribar", hex: "#dba24a" },
  { ad: "Gül altın", hex: "#dcae9a" },
  { ad: "Bronz", hex: "#c49560" },
  { ad: "Platin", hex: "#c8ccd2" },
];
const ZEMINLER_KOYU = ["#0b0a08", "#120c07", "#0a0f1c", "#12080b", "#06100d", "#0e0f11"];
const ZEMINLER_ACIK = ["#f8f4ea", "#ffffff", "#f6efe4", "#eef0f3", "#f3ece8", "#eef2ee"];

// "#rrggbb" → "r g b" (CSS rgb(var(--ac) / a) için).
const rgbAyri = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");

// Tek renkten uyumlu altın değişkenleri türetir (başlık parıltısı, düğme, çizgi, yüzey, iç vurgu).
function anaRenktenTuret(hex: string, koyu: boolean): Harita {
  const [h, s0, l0] = hexHsl(hex);
  const s = Math.min(s0, 0.9);
  if (koyu) {
    const L = sinirla(l0, 0.5, 0.75);
    const hi = hslHex(h, s, L);
    return {
      "--gold-hi": hi,
      "--ac": rgbAyri(hi),
      "--dalga": hi,
      "--invaccent": hi,
      "--gold": hslHex(h, s * 0.85, L - 0.12),
      "--gold-lo": hslHex(h, s * 0.8, L - 0.3),
      "--gold-grad": `linear-gradient(135deg, ${hslHex(h, s, L - 0.04)} 0%, ${hslHex(h, s, L - 0.14)} 50%, ${hslHex(h, s, L - 0.27)} 100%)`,
      "--gold-surf": `linear-gradient(135deg, ${hslHex(h, s, L + 0.14)} 0%, ${hslHex(h, s, L + 0.02)} 45%, ${hslHex(h, s, L - 0.08)} 100%)`,
      "--btn": `linear-gradient(135deg, ${hslHex(h, s, L - 0.08)}, ${hslHex(h, s, L - 0.24)})`,
      "--inv": hslHex(h, s, L + 0.08),
      "--line": renkYaz(hslHex(h, s, L - 0.12), 0.22),
      "--surf": renkYaz(hslHex(h, s, L - 0.12), 0.07),
      "--track": renkYaz(hslHex(h, s, L - 0.12), 0.15),
    };
  }
  const L = sinirla(l0, 0.25, 0.45);
  const taban = hslHex(h, s * 0.8, L);
  return {
    "--gold-hi": hslHex(h, s * 0.8, L - 0.08),
    "--ac": rgbAyri(hslHex(h, s * 0.8, L - 0.08)),
    "--dalga": hslHex(h, s * 0.8, L - 0.04),
    "--invaccent": hslHex(h, s * 0.8, L - 0.08),
    "--gold-grad": `linear-gradient(135deg, ${taban} 0%, ${hslHex(h, s * 0.8, L - 0.08)} 55%, ${hslHex(h, s * 0.8, L - 0.18)} 100%)`,
    "--gold-surf": `linear-gradient(135deg, ${hslHex(h, s, L - 0.02)}, ${hslHex(h, s, L - 0.16)})`,
    "--gold": taban,
    "--gold-lo": hslHex(h, s * 0.8, L + 0.3),
    "--btn": `linear-gradient(135deg, ${hslHex(h, s, L - 0.02)}, ${hslHex(h, s, L - 0.16)})`,
    "--line": renkYaz(taban, 0.28),
    "--surf": renkYaz(taban, 0.08),
    "--track": renkYaz(taban, 0.18),
  };
}

// Tek renkten sayfa zemini, kart yüzeyi ve alt bölüm zemini.
function zemindenTuret(hex: string, koyu: boolean): Harita {
  const [h, s, l] = hexHsl(hex);
  if (koyu) {
    const z = sinirla(l, 0.02, 0.14);
    return {
      "--bg": hslHex(h, s, z),
      "--paper": hslHex(h, s, z + 0.03),
      "--footer": hslHex(h, s, Math.max(0, z - 0.015)),
      "--vs-bg": `radial-gradient(circle at 50% 30%, ${hslHex(h, s, z + 0.07)}, ${hslHex(h, s, Math.max(0, z - 0.02))})`,
    };
  }
  const z = sinirla(l, 0.88, 1);
  return {
    "--bg": hslHex(h, s, z),
    "--paper": "#ffffff",
    "--footer": hslHex(h, s, z - 0.04),
    "--vs-bg": `radial-gradient(circle at 50% 30%, ${hslHex(h, s, Math.min(1, z + 0.03))}, ${hslHex(h, s, z - 0.05)})`,
  };
}

// Hazır temalar (yalnızca koyu): zemin, yazı, kart yüzeyi, soluk yazı ve vurgu rengi birlikte değişir; altın tonları vurgudan türetilir.
const SABLONLAR: { ad: string; bg: string; ink: string; paper: string; muted: string; vurgu: string }[] = [
  { ad: "Siyah · şampanya", bg: "#0b0b0b", ink: "#f2eee8", paper: "#1a1a1a", muted: "#8a8580", vurgu: "#d6bb8d" },
  { ad: "Kahve · altın", bg: "#120c07", ink: "#f3e6d0", paper: "#201710", muted: "#9a8670", vurgu: "#e0b25a" },
  { ad: "Lacivert · altın", bg: "#0a0f1c", ink: "#eee9df", paper: "#141b2d", muted: "#8b93a6", vurgu: "#d9b86c" },
  { ad: "Bordo · roze", bg: "#12080b", ink: "#f5e6e3", paper: "#211014", muted: "#a08486", vurgu: "#e3b0a0" },
  { ad: "Zümrüt · altın", bg: "#06100d", ink: "#ecebe0", paper: "#101c18", muted: "#849489", vurgu: "#d4b56a" },
  { ad: "Antrasit · platin", bg: "#0e0f11", ink: "#eceef1", paper: "#1a1c20", muted: "#8b9097", vurgu: "#c8ccd2" },
];

function sablonDegerleri(x: (typeof SABLONLAR)[number]): Harita {
  return {
    ...anaRenktenTuret(x.vurgu, true),
    ...zemindenTuret(x.bg, true),
    "--bg": x.bg,
    "--paper": x.paper,
    "--ink": x.ink,
    "--muted": x.muted,
    "--p1": x.ink,
    "--p2": x.muted,
  };
}

function oku(tema: string): Harita {
  try {
    return JSON.parse(localStorage.getItem(`${ANAHTAR}-${tema}`) ?? "{}") as Harita;
  } catch {
    return {};
  }
}

function kaydet(tema: string, h: Harita) {
  try {
    if (Object.keys(h).length) localStorage.setItem(`${ANAHTAR}-${tema}`, JSON.stringify(h));
    else localStorage.removeItem(`${ANAHTAR}-${tema}`);
  } catch {
    /* depolama kapalı: ayar bu oturumda yine uygulanır */
  }
}

const temaAdi = () => document.documentElement.dataset.palet ?? "gul";

const ETIKET = "w-[96px] shrink-0 text-[11px] text-[#8a8580]";
const RENK_GIRDI = "h-7 w-9 cursor-pointer border-0 bg-transparent p-0";

type Ctx = { deger: (k: string) => string; yaz: (y: Harita) => void };

function RenkSatiri({ c, etiket, k, alfa = false }: { c: Ctx; etiket: string; k: string; alfa?: boolean }) {
  const { hex, a } = renkCoz(c.deger(k));
  const yaz = (h: string, al: number) => c.yaz({ [k]: alfa ? renkYaz(h, al) : h });
  return (
    <div className="flex items-center gap-2">
      <span className={ETIKET}>{etiket}</span>
      <input type="color" value={hex} onChange={(e) => yaz(e.target.value, a)} className={RENK_GIRDI} aria-label={etiket} />
      {alfa ? (
        <input type="range" min={0} max={1} step={0.01} value={a} onChange={(e) => yaz(hex, Number(e.target.value))} className="min-w-0 flex-1" aria-label={`${etiket} şeffaflık`} />
      ) : (
        <span className="text-[11px] text-[#8a8580]">{hex}</span>
      )}
    </div>
  );
}

function Bolum({ baslik, children }: { baslik: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-[#f2eee8]/15 pt-3">
      <h3 className="m-0 text-[11px] font-bold tracking-[0.14em] uppercase">{baslik}</h3>
      {children}
    </section>
  );
}

function Renkler({ liste, secili, sec, etiket }: { liste: { ad?: string; hex: string }[]; secili: string | null; sec: (hex: string) => void; etiket: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {liste.map((x) => (
        <button
          key={x.hex}
          type="button"
          title={x.ad ?? x.hex}
          aria-label={`${etiket} ${x.ad ?? x.hex}`}
          onClick={() => sec(x.hex)}
          className={`h-7 w-7 cursor-pointer rounded-full p-0 ${secili === x.hex ? "border-2 border-[#f2eee8]" : "border border-[#f2eee8]/30"}`}
          style={{ background: x.hex }}
        />
      ))}
    </div>
  );
}

export function TasarimSekmesi() {
  const [tema, setTema] = useState("gul");
  const [varsayilan, setVarsayilan] = useState<Harita>({});
  const [ayar, setAyar] = useState<Harita>({});
  const [metin, setMetin] = useState("");
  const [anaRenk, setAnaRenk] = useState<string | null>(null);
  const [zeminRenk, setZeminRenk] = useState<string | null>(null);
  const koyu = tema === "gece";

  const uygula = useCallback((h: Harita) => {
    const st = document.documentElement.style;
    DEGISKENLER.forEach((k) => st.removeProperty(k));
    Object.entries(h).forEach(([k, v]) => st.setProperty(k, v));
  }, []);

  // Palet değişince o paletin ayarlarına geç.
  useEffect(() => {
    const guncelle = () => setTema(temaAdi());
    guncelle();
    const gozle = new MutationObserver(guncelle);
    gozle.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palet"] });
    return () => gozle.disconnect();
  }, []);

  useEffect(() => {
    DEGISKENLER.forEach((k) => document.documentElement.style.removeProperty(k));
    const cs = getComputedStyle(document.documentElement);
    setVarsayilan(Object.fromEntries(DEGISKENLER.map((k) => [k, cs.getPropertyValue(k).trim()])));
    const kayit = oku(tema);
    setAyar(kayit);
    uygula(kayit);
    setMetin("");
    setAnaRenk(null);
    setZeminRenk(null);
  }, [tema, uygula]);

  const deger = (k: string) => ayar[k] ?? varsayilan[k] ?? "";
  const yaz = (y: Harita) => {
    const n = { ...ayar, ...y };
    setAyar(n);
    kaydet(tema, n);
    uygula(n);
  };
  const c: Ctx = { deger, yaz };

  function sifirla() {
    setAyar({});
    kaydet(tema, {});
    uygula({});
    setMetin("");
    setAnaRenk(null);
    setZeminRenk(null);
  }

  function kopyala() {
    const secici = tema === "gul" ? ":root" : `:root[data-palet="${tema}"]`;
    const arkaPlan = arkaPlanOku(tema);
    const dekl = arkaPlanDeclarations(arkaPlan, koyu);
    const blok = `${secici} {\n${Object.entries(ayar)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n")}\n}`;
    const yuklenen = arkaPlan.tur === "gorsel" && arkaPlan.gorsel.startsWith("data:");
    const arka = dekl
      ? `\n\n/* Arka plan${yuklenen ? ": yüklenen görseli public/ altına koyup url'yi düzelt" : ""} */\nbody {\n${Object.entries(dekl)
          .map(([k, v]) => `  ${k}: ${yuklenen ? v.replace(/url\("data:[^"]*"\)/, 'url("/gorsel.jpg")') : v};`)
          .join("\n")}\n}`
      : "";
    const yazi = yaziTipiCss();
    const t = blok + arka + (yazi ? `

${yazi}` : "");
    setMetin(t);
    navigator.clipboard?.writeText(t).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-3 text-[#f2eee8] normal-case">
      <strong className="text-[12px] tracking-[0.14em] uppercase">Renk ayarı · {PALETLER.find((p) => p.id === tema)?.ad}</strong>
      <p className="m-0 text-[11px] leading-snug text-[#8a8580]">Ayarlar canlı uygulanır ve bu temaya özel saklanır. Beğenince "CSS'i kopyala" ile globals.css'e taşı.</p>

      <Bolum baslik="Palet (3 tema)">
        <div className="grid grid-cols-3 gap-2">
          {PALETLER.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === tema}
              onClick={() => {
                document.documentElement.dataset.palet = p.id;
                try {
                  localStorage.setItem(PALET_ANAHTAR, p.id);
                } catch {
                  /* depolama kapalı: seçim bu oturumda geçerli */
                }
              }}
              className={`cursor-pointer rounded-lg border bg-transparent p-1.5 text-left text-[11px] leading-tight text-[#f2eee8] ${p.id === tema ? "border-2 border-[#f2eee8]" : "border-[#f2eee8]/20"}`}
            >
              <span className="mb-1 flex h-6 overflow-hidden rounded">
                {p.renkler.map((o) => (
                  <span key={o} className="flex-1" style={{ background: o }} />
                ))}
              </span>
              {p.ad}
            </button>
          ))}
        </div>
      </Bolum>

      <Bolum baslik="Hazır temalar (koyu)">
        {koyu ? (
          <div className="grid grid-cols-3 gap-2">
            {SABLONLAR.map((x) => (
              <button
                key={x.ad}
                type="button"
                onClick={() => {
                  yaz(sablonDegerleri(x));
                  setAnaRenk(null);
                  setZeminRenk(null);
                }}
                className="cursor-pointer rounded-lg border border-[#f2eee8]/20 bg-transparent p-1.5 text-left text-[10px] leading-tight text-[#f2eee8]"
              >
                <span className="mb-1 flex h-5 overflow-hidden rounded">
                  {[x.bg, x.vurgu, x.ink].map((o) => (
                    <span key={o} className="flex-1" style={{ background: o }} />
                  ))}
                </span>
                {x.ad}
              </button>
            ))}
          </div>
        ) : (
          <p className="m-0 text-[11px] text-[#8a8580]">Hazır temalar koyu zemin içindir; "Gece" paletine geç.</p>
        )}
      </Bolum>

      <Bolum baslik="Ana renk (altın tonları otomatik)">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={anaRenk ?? renkCoz(deger("--gold-hi")).hex}
            onChange={(e) => {
              setAnaRenk(e.target.value);
              yaz(anaRenktenTuret(e.target.value, koyu));
            }}
            className="h-11 w-14 shrink-0 cursor-pointer border-0 bg-transparent p-0"
            aria-label="Ana renk"
          />
          <p className="m-0 text-[11px] leading-snug text-[#8a8580]">Tek renk seç; vurgu, düğme, çizgiler ve altın degradeler buna uyumlu üretilir.</p>
        </div>
        <Renkler
          liste={ANA_RENKLER}
          secili={anaRenk}
          etiket="Ana renk"
          sec={(hex) => {
            setAnaRenk(hex);
            yaz(anaRenktenTuret(hex, koyu));
          }}
        />
      </Bolum>

      <ArkaPlanBolumu tema={tema} koyu={koyu} />

      <YaziTipiBolumu />

      <Bolum baslik="Arka plan rengi (tek renk)">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={zeminRenk ?? renkCoz(deger("--bg")).hex}
            onChange={(e) => {
              setZeminRenk(e.target.value);
              yaz(zemindenTuret(e.target.value, koyu));
            }}
            className="h-11 w-14 shrink-0 cursor-pointer border-0 bg-transparent p-0"
            aria-label="Zemin rengi"
          />
          <p className="m-0 text-[11px] leading-snug text-[#8a8580]">Sayfa zemini, kart yüzeyi ve alt bölüm buna göre üretilir.</p>
        </div>
        <Renkler
          liste={(koyu ? ZEMINLER_KOYU : ZEMINLER_ACIK).map((hex) => ({ hex }))}
          secili={zeminRenk}
          etiket="Zemin"
          sec={(hex) => {
            setZeminRenk(hex);
            yaz(zemindenTuret(hex, koyu));
          }}
        />
      </Bolum>

      <details className="border-t border-[#f2eee8]/15 pt-3">
        <summary className="cursor-pointer text-[11px] font-bold tracking-[0.14em] uppercase">Elle ince ayar</summary>
        <div className="mt-3 flex flex-col gap-3">
          <Bolum baslik="Sayfa">
            <RenkSatiri c={c} etiket="Zemin" k="--bg" />
            <RenkSatiri c={c} etiket="Yazı" k="--ink" />
            <RenkSatiri c={c} etiket="Soluk yazı" k="--muted" />
            <RenkSatiri c={c} etiket="Kart yüzeyi" k="--paper" />
            <RenkSatiri c={c} etiket="Alt bölüm" k="--footer" />
          </Bolum>
          <Bolum baslik="Altın tonları">
            <RenkSatiri c={c} etiket="Vurgu (açık)" k="--gold-hi" />
            <RenkSatiri c={c} etiket="Ana altın" k="--gold" />
            <RenkSatiri c={c} etiket="Koyu altın" k="--gold-lo" />
          </Bolum>
          <Bolum baslik="Çizgi ve yüzey">
            <RenkSatiri c={c} etiket="Çizgi" k="--line" alfa />
            <RenkSatiri c={c} etiket="Yüzey" k="--surf" alfa />
            <RenkSatiri c={c} etiket="Çubuk izi" k="--track" alfa />
          </Bolum>
          <Bolum baslik="Düğme ve altın yüzey">
            <RenkSatiri c={c} etiket="Düğme yazısı" k="--btnfg" />
            <RenkSatiri c={c} etiket="Altın yüzey" k="--inv" />
            <RenkSatiri c={c} etiket="Yüzey yazısı" k="--invfg" />
          </Bolum>
        </div>
      </details>

      <div className="flex gap-2 border-t border-[#f2eee8]/15 pt-3">
        <button type="button" onClick={kopyala} className="flex-1 cursor-pointer rounded-full border-0 bg-[#d6bb8d] px-3 py-2 text-[11px] font-bold text-[#1a1208]">
          CSS'i kopyala
        </button>
        <button type="button" onClick={sifirla} className="cursor-pointer rounded-full border border-[#f2eee8]/30 bg-transparent px-3 py-2 text-[11px] text-[#f2eee8]">
          Sıfırla
        </button>
      </div>
      {metin && (
        <textarea
          readOnly
          value={metin}
          rows={Math.min(10, metin.split("\n").length + 1)}
          className="w-full resize-none rounded-lg border border-[#f2eee8]/20 bg-black p-2 font-mono text-[10px] text-[#f2eee8]"
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
    </div>
  );
}
