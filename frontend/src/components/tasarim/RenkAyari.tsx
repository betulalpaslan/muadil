import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

// Geliştirme aracı: altın/şampanya renklerini ve degradeleri canlı ayarlar. Yalnızca `vite` geliştirme sunucusunda görünür
// (üretim derlemesinde hiç render edilmez). Ayarlar CSS değişkenlerini <html> üzerine yazar ve temaya özel (gece / gündüz)
// localStorage'da tutulur; beğenilen değerler "CSS'i kopyala" ile tasarim.css'e taşınır.

const ANAHTAR = "renk-ayari";
type Harita = Record<string, string>;
type Ctx = { deger: (k: string) => string; yaz: (y: Harita) => void };

const DEGISKENLER = [
  "--si",
  "--be",
  "--gr",
  "--gr2",
  "--cz",
  "--cz-arama",
  "--hap-bg",
  "--hap-fg",
  "--hap-bd",
  "--ks-bg",
  "--ks-ok-bd",
  "--ks-ok-yazi",
  "--ks-marka-1",
  "--ks-marka-2",
  "--ks-marka-3",
  "--ks-aci",
  "--ta",
  "--ks-ok-bg",
  "--ks-isik-1",
  "--ks-isik-2",
  "--btn-bg",
  "--btn-fg",
  "--serit-bg",
  "--serit-fg",
  "--serit-bd",
];

// Tek renkten uyumlu degrade türetme: kullanıcı yalnızca ana rengi (altın) seçer; başlık, düğme, şerit, ışık ve
// vurgunun başlangıç/bitiş tonları HSL ile üretilir. Gecede açık tonlar koyu zeminde, gündüzde koyu tonlar açık zeminde okunur.
const ANA_RENKLER = [
  { ad: "Şampanya", hex: "#d6bb8d" },
  { ad: "Altın sarısı", hex: "#e2b93b" },
  { ad: "Kehribar", hex: "#dba24a" },
  { ad: "Gül altın", hex: "#dcae9a" },
  { ad: "Bronz", hex: "#c49560" },
  { ad: "Platin", hex: "#c8ccd2" },
];
const ZEMINLER_GECE = ["#0b0b0b", "#120c07", "#0a0f1c", "#12080b", "#06100d", "#0e0f11"];
const ZEMINLER_GUNDUZ = ["#f4f0e9", "#ffffff", "#f6efe4", "#eef0f3", "#f3ece8", "#eef2ee"];

const sinirla = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

function hexHsl(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function hslHex(h: number, s: number, l: number) {
  const hh = (h + 360) % 360;
  const ss = sinirla(s, 0, 1);
  const ll = sinirla(l, 0, 1);
  const a = ss * Math.min(ll, 1 - ll);
  const f = (n: number) => {
    const k = (n + hh / 30) % 12;
    return Math.round(255 * (ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function anaRenktenTuret(hex: string, gece: boolean): Harita {
  const [h, s0, l0] = hexHsl(hex);
  const s = Math.min(s0, 0.9);
  if (gece) {
    const L = sinirla(l0, 0.5, 0.78);
    const vurgu = hslHex(h, s, L);
    return {
      "--ta": vurgu,
      "--ks-ok-bg": vurgu,
      "--ks-marka-1": hslHex(h, s * 0.85, L - 0.04),
      "--ks-marka-2": hslHex(h - 2, s * 0.7, 0.9),
      "--ks-marka-3": hslHex(h + 4, s, L - 0.2),
      "--btn-bg": `linear-gradient(135deg, ${hslHex(h, s * 0.8, sinirla(L + 0.16, 0, 0.9))}, ${hslHex(h + 3, s * 0.9, L - 0.08)})`,
      "--btn-fg": hslHex(h, 0.5, 0.08),
      "--serit-bg": `linear-gradient(90deg, ${hslHex(h, s * 0.6, 0.06)}, ${hslHex(h, s * 0.55, 0.15)} 50%, ${hslHex(h, s * 0.6, 0.06)})`,
      "--serit-fg": hslHex(h, s * 0.7, 0.78),
      "--serit-bd": hslHex(h, s * 0.6, 0.45),
      "--ks-isik-1": renkYaz(hslHex(h, s, 0.6), 0.55),
      "--ks-isik-2": renkYaz(hslHex(h, s * 0.8, 0.38), 0.24),
    };
  }
  const L = sinirla(l0, 0.25, 0.42);
  const vurgu = hslHex(h, s * 0.8, L);
  return {
    "--ta": vurgu,
    "--ks-ok-bg": vurgu,
    "--ks-marka-1": hslHex(h, s * 0.7, L - 0.08),
    "--ks-marka-2": hslHex(h, s * 0.6, L + 0.2),
    "--ks-marka-3": hslHex(h, s * 0.8, L - 0.14),
    "--btn-bg": `linear-gradient(135deg, ${hslHex(h, 0.3, 0.17)}, ${hslHex(h, 0.3, 0.1)})`,
    "--btn-fg": "#f4f0e9",
    "--serit-fg": hslHex(h, 0.3, 0.12),
    "--serit-bd": hslHex(h, 0.3, 0.12),
    "--ks-isik-1": renkYaz(hslHex(h, s * 0.7, 0.5), 0.22),
    "--ks-isik-2": renkYaz(hslHex(h, s * 0.7, 0.5), 0.08),
  };
}

function zemindenTuret(hex: string, gece: boolean): Harita {
  const [h, s, l] = hexHsl(hex);
  if (gece) {
    const z = sinirla(l, 0.02, 0.16);
    return { "--si": hslHex(h, s, z), "--ks-bg": hslHex(h, s, z), "--gr": hslHex(h, s, z + 0.06), "--gr2": hslHex(h, s * 0.25, 0.55) };
  }
  const z = sinirla(l, 0.85, 1);
  return { "--si": hslHex(h, s, z), "--gr": hslHex(h, s, z - 0.07), "--gr2": hslHex(h, s * 0.2, 0.42) };
}

// Şablon tonları (yalnızca gece): sayfa zemini, yazı, çizgiler, düğmeler ve şerit birlikte değişir.
type SablonGirdi = {
  zemin: string; yazi: string; yuzey: string; soluk: string; vurgu: string;
  btn1: string; btn2: string; btnYazi: string;
  seritA: string; seritB: string; seritYazi: string; seritCizgi: string;
  m1: string; m2: string; m3: string; isik1: string; isik2: string;
};
function sablon(g: SablonGirdi): Harita {
  return {
    "--si": g.zemin,
    "--ks-bg": g.zemin,
    "--be": g.yazi,
    "--gr": g.yuzey,
    "--gr2": g.soluk,
    "--cz": renkYaz(g.yazi, 0.16),
    "--cz-arama": renkYaz(g.yazi, 0.26),
    "--ta": g.vurgu,
    "--hap-bg": "transparent",
    "--hap-fg": g.vurgu,
    "--hap-bd": g.vurgu,
    "--ks-ok-bg": g.vurgu,
    "--ks-ok-bd": g.vurgu,
    "--ks-ok-yazi": g.zemin,
    "--btn-bg": `linear-gradient(135deg, ${g.btn1}, ${g.btn2})`,
    "--btn-fg": g.btnYazi,
    "--serit-bg": `linear-gradient(90deg, ${g.seritA}, ${g.seritB} 50%, ${g.seritA})`,
    "--serit-fg": g.seritYazi,
    "--serit-bd": g.seritCizgi,
    "--ks-marka-1": g.m1,
    "--ks-marka-2": g.m2,
    "--ks-marka-3": g.m3,
    "--ks-isik-1": g.isik1,
    "--ks-isik-2": g.isik2,
  };
}
const SABLONLAR: { ad: string; v: () => Harita; onizleme: [string, string, string] }[] = [
  {
    ad: "Siyah · şampanya",
    onizleme: ["#0b0b0b", "#d6bb8d", "#f1dfbd"],
    v: () => sablon({ zemin: "#0b0b0b", yazi: "#f2eee8", yuzey: "#1a1a1a", soluk: "#8a8580", vurgu: "#d6bb8d", btn1: "#f1dfbd", btn2: "#cfa970", btnYazi: "#1a1208", seritA: "#17110a", seritB: "#3a2a14", seritYazi: "#e8d2a8", seritCizgi: "#a87c43", m1: "#c9a36a", m2: "#fbefd0", m3: "#a87c43", isik1: "rgb(232 188 108 / 0.55)", isik2: "rgb(168 118 58 / 0.24)" }),
  },
  {
    ad: "Kahve · altın",
    onizleme: ["#120c07", "#e0b25a", "#f4d58b"],
    v: () => sablon({ zemin: "#120c07", yazi: "#f3e6d0", yuzey: "#201710", soluk: "#9a8670", vurgu: "#e0b25a", btn1: "#f4d58b", btn2: "#c4882c", btnYazi: "#1c1206", seritA: "#1a1008", seritB: "#4a3216", seritYazi: "#f0d9a2", seritCizgi: "#c4882c", m1: "#d9a441", m2: "#fff0c0", m3: "#9a6a1c", isik1: "rgb(235 170 70 / 0.55)", isik2: "rgb(150 90 25 / 0.26)" }),
  },
  {
    ad: "Lacivert · altın",
    onizleme: ["#0a0f1c", "#d9b86c", "#f0dca5"],
    v: () => sablon({ zemin: "#0a0f1c", yazi: "#eee9df", yuzey: "#141b2d", soluk: "#8b93a6", vurgu: "#d9b86c", btn1: "#f0dca5", btn2: "#c9a24f", btnYazi: "#0e1424", seritA: "#0e1526", seritB: "#1f2c4a", seritYazi: "#e6d3a0", seritCizgi: "#b8923f", m1: "#d4b06a", m2: "#fff3cf", m3: "#9c7a32", isik1: "rgb(220 180 100 / 0.5)", isik2: "rgb(60 80 140 / 0.28)" }),
  },
  {
    ad: "Bordo · roze",
    onizleme: ["#12080b", "#e3b0a0", "#f6d3c8"],
    v: () => sablon({ zemin: "#12080b", yazi: "#f5e6e3", yuzey: "#211014", soluk: "#a08486", vurgu: "#e3b0a0", btn1: "#f6d3c8", btn2: "#cf8f86", btnYazi: "#2a0f14", seritA: "#1c0a0e", seritB: "#4a1a24", seritYazi: "#f0cfc6", seritCizgi: "#b8665f", m1: "#dca594", m2: "#ffe8e0", m3: "#a65a55", isik1: "rgb(230 140 130 / 0.5)", isik2: "rgb(130 40 55 / 0.3)" }),
  },
  {
    ad: "Zümrüt · altın",
    onizleme: ["#06100d", "#d4b56a", "#efd999"],
    v: () => sablon({ zemin: "#06100d", yazi: "#ecebe0", yuzey: "#101c18", soluk: "#849489", vurgu: "#d4b56a", btn1: "#efd999", btn2: "#bf9a45", btnYazi: "#0b1a14", seritA: "#0a1713", seritB: "#1c3a2e", seritYazi: "#e3d199", seritCizgi: "#a8873a", m1: "#d0ae62", m2: "#fff1c4", m3: "#8f7330", isik1: "rgb(215 180 90 / 0.45)", isik2: "rgb(30 100 75 / 0.3)" }),
  },
  {
    ad: "Antrasit · platin",
    onizleme: ["#0e0f11", "#c8ccd2", "#f2f4f7"],
    v: () => sablon({ zemin: "#0e0f11", yazi: "#eceef1", yuzey: "#1a1c20", soluk: "#8b9097", vurgu: "#c8ccd2", btn1: "#f2f4f7", btn2: "#aab0b8", btnYazi: "#14161a", seritA: "#121417", seritB: "#2a2e35", seritYazi: "#dfe3e8", seritCizgi: "#7d848d", m1: "#cfd3d8", m2: "#ffffff", m3: "#8a9099", isik1: "rgb(200 210 230 / 0.45)", isik2: "rgb(120 130 150 / 0.22)" }),
  },
];

function renkCoz(s: string): { hex: string; a: number } {
  const t = s.trim();
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t);
  if (m) {
    const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
    return { hex: `#${h.toLowerCase()}`, a: 1 };
  }
  m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/i.exec(t);
  if (m) {
    const hex = `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
    const a = m[4] ? (m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1;
    return { hex, a };
  }
  return { hex: "#000000", a: 1 };
}

function renkYaz(hex: string, a: number) {
  const n = (i: number) => parseInt(hex.slice(i, i + 2), 16);
  return `rgb(${n(1)} ${n(3)} ${n(5)} / ${Math.round(a * 100) / 100})`;
}

function gradCoz(s: string): { aci: number; renkler: string[] } {
  const m = /^linear-gradient\(\s*(-?[\d.]+)deg\s*,([\s\S]+)\)$/.exec(s.trim());
  if (!m) {
    const c = renkCoz(s).hex;
    return { aci: 135, renkler: [c, c] };
  }
  return { aci: parseFloat(m[1]), renkler: m[2].split(",").map((p) => renkCoz(p.trim().split(/\s+/)[0]).hex) };
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
    // gizli sekme vb.; ayar bu oturumda yine uygulanır
  }
}

const ETIKET = "w-[92px] shrink-0 text-[11px] text-[#8a8580]";
const RENK_GIRDI = "h-7 w-9 cursor-pointer border-0 bg-transparent p-0";

function RenkSatiri({ c, etiket, k, alfa = false, ekler = [] }: { c: Ctx; etiket: string; k: string; alfa?: boolean; ekler?: string[] }) {
  const { hex, a } = renkCoz(c.deger(k));
  const yaz = (h: string, al: number) => {
    const v = alfa ? renkYaz(h, al) : h;
    c.yaz(Object.fromEntries([k, ...ekler].map((x) => [x, v])));
  };
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

function Aci({ etiket, aci, onChange }: { etiket: string; aci: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className={ETIKET}>{etiket}</span>
      <input type="range" min={0} max={360} step={1} value={aci} onChange={(e) => onChange(Number(e.target.value))} className="min-w-0 flex-1" aria-label={etiket} />
      <span className="w-9 text-right text-[11px] text-[#8a8580]">{Math.round(aci)}°</span>
    </div>
  );
}

function Gradyan({
  c,
  k,
  etiketler,
  aciAyari,
  derle,
}: {
  c: Ctx;
  k: string;
  etiketler: string[];
  aciAyari: boolean;
  derle: (aci: number, r: string[]) => string;
}) {
  const { aci, renkler } = gradCoz(c.deger(k));
  return (
    <>
      <div className="h-4 rounded-full border border-[#f2eee8]/20" style={{ background: derle(aci, renkler) }} />
      {etiketler.map((e, i) => (
        <div key={e} className="flex items-center gap-2">
          <span className={ETIKET}>{e}</span>
          <input
            type="color"
            value={renkler[i] ?? "#000000"}
            onChange={(ev) => c.yaz({ [k]: derle(aci, renkler.map((x, j) => (j === i ? ev.target.value : x))) })}
            className={RENK_GIRDI}
            aria-label={e}
          />
          <span className="text-[11px] text-[#8a8580]">{renkler[i]}</span>
        </div>
      ))}
      {aciAyari && <Aci etiket="Açı" aci={aci} onChange={(n) => c.yaz({ [k]: derle(n, renkler) })} />}
    </>
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

function Panel() {
  const [tema, setTema] = useState(() => document.documentElement.dataset.tema ?? "gece");
  const [varsayilan, setVarsayilan] = useState<Harita>({});
  const [ayar, setAyar] = useState<Harita>({});
  const [acik, setAcik] = useState(false);
  const [metin, setMetin] = useState("");
  const [anaRenk, setAnaRenk] = useState<string | null>(null);
  const [zeminRenk, setZeminRenk] = useState<string | null>(null);
  const gece = tema !== "gunduz";

  const uygula = useCallback((h: Harita) => {
    const st = document.documentElement.style;
    DEGISKENLER.forEach((k) => st.removeProperty(k));
    Object.entries(h).forEach(([k, v]) => st.setProperty(k, v));
  }, []);

  // Tema değişince (TemaDugmesi data-tema'yı değiştirir) o temanın ayarlarına geç.
  useEffect(() => {
    const gozle = new MutationObserver(() => setTema(document.documentElement.dataset.tema ?? "gece"));
    gozle.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });
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
    const secici = tema === "gunduz" ? ':root[data-tema="gunduz"]' : ":root";
    const t = `${secici} {\n${Object.entries(ayar)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n")}\n}`;
    setMetin(t);
    navigator.clipboard?.writeText(t).catch(() => {});
  }

  return (
    <div className="fixed right-4 bottom-4 z-[100] flex flex-col items-end gap-2 text-[#f2eee8]">
      {acik && (
        <div className="flex max-h-[78vh] w-[320px] flex-col gap-3 overflow-y-auto rounded-2xl border border-[#f2eee8]/20 bg-[#121212] p-4 text-[#f2eee8] shadow-2xl normal-case">
          <div className="flex items-center justify-between">
            <strong className="text-[12px] tracking-[0.14em] uppercase">Renk ayarı · {tema === "gunduz" ? "gündüz" : "gece"}</strong>
            <button type="button" onClick={() => setAcik(false)} className="cursor-pointer border-0 bg-transparent text-[16px] text-[#f2eee8]" aria-label="Kapat">
              ×
            </button>
          </div>
          <p className="m-0 text-[11px] leading-snug text-[#8a8580]">Ayarlar canlı uygulanır ve bu temaya özel saklanır. Beğenince "CSS'i kopyala" ile bana gönder.</p>

          <Bolum baslik="Ana renk (degradeler otomatik)">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={anaRenk ?? renkCoz(deger("--ta")).hex}
                onChange={(e) => {
                  setAnaRenk(e.target.value);
                  yaz(anaRenktenTuret(e.target.value, gece));
                }}
                className="h-11 w-14 shrink-0 cursor-pointer border-0 bg-transparent p-0"
                aria-label="Ana renk"
              />
              <p className="m-0 text-[11px] leading-snug text-[#8a8580]">Tek renk seç; başlık, ARA düğmesi, şerit, ışık ve vurgunun başlangıç/bitiş tonları buna uyumlu üretilir.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ANA_RENKLER.map((x) => (
                <button
                  key={x.hex}
                  type="button"
                  title={x.ad}
                  aria-label={x.ad}
                  onClick={() => {
                    setAnaRenk(x.hex);
                    yaz(anaRenktenTuret(x.hex, gece));
                  }}
                  className="h-7 w-7 cursor-pointer rounded-full border border-[#f2eee8]/30 p-0"
                  style={{ background: x.hex }}
                />
              ))}
            </div>
          </Bolum>

          <Bolum baslik="Zemin rengi (tek renk)">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={zeminRenk ?? renkCoz(deger("--si")).hex}
                onChange={(e) => {
                  setZeminRenk(e.target.value);
                  yaz(zemindenTuret(e.target.value, gece));
                }}
                className="h-11 w-14 shrink-0 cursor-pointer border-0 bg-transparent p-0"
                aria-label="Zemin rengi"
              />
              <p className="m-0 text-[11px] leading-snug text-[#8a8580]">Sayfa zemini, arama yüzeyi ve soluk yazı buna göre üretilir.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(gece ? ZEMINLER_GECE : ZEMINLER_GUNDUZ).map((z) => (
                <button
                  key={z}
                  type="button"
                  aria-label={`Zemin ${z}`}
                  onClick={() => {
                    setZeminRenk(z);
                    yaz(zemindenTuret(z, gece));
                  }}
                  className="h-7 w-7 cursor-pointer rounded-full border border-[#f2eee8]/30 p-0"
                  style={{ background: z }}
                />
              ))}
            </div>
          </Bolum>

          <Bolum baslik="Şablon tonları (tüm site, gece)">
            {tema === "gunduz" ? (
              <p className="m-0 text-[11px] text-[#8a8580]">Şablon tonları koyu zemin içindir; gece temasına geç.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {SABLONLAR.map((x) => (
                  <button key={x.ad} type="button" onClick={() => {
                      yaz(x.v());
                      setAnaRenk(null);
                      setZeminRenk(null);
                    }} className="cursor-pointer rounded-lg border border-[#f2eee8]/20 bg-transparent p-1.5 text-left text-[10px] leading-tight text-[#f2eee8]">
                    <span className="mb-1 flex h-5 overflow-hidden rounded">
                      {x.onizleme.map((o) => (
                        <span key={o} className="flex-1" style={{ background: o }} />
                      ))}
                    </span>
                    {x.ad}
                  </button>
                ))}
              </div>
            )}
          </Bolum>

          <details className="border-t border-[#f2eee8]/15 pt-3">
            <summary className="cursor-pointer text-[11px] font-bold tracking-[0.14em] uppercase">Elle ince ayar</summary>
            <div className="mt-3 flex flex-col gap-3">
          <Bolum baslik="Sayfa">
            <RenkSatiri c={c} etiket="Zemin" k="--si" ekler={tema === "gunduz" ? [] : ["--ks-bg"]} />
            <RenkSatiri c={c} etiket="Yazı" k="--be" />
            <RenkSatiri c={c} etiket="Soluk yazı" k="--gr2" />
            <RenkSatiri c={c} etiket="Yüzey (arama)" k="--gr" />
            <RenkSatiri c={c} etiket="Çizgiler" k="--cz" alfa />
          </Bolum>
          <Bolum baslik="Menü hapı (ANA SAYFA)">
            <RenkSatiri c={c} etiket="Zemin" k="--hap-bg" alfa />
            <RenkSatiri c={c} etiket="Yazı" k="--hap-fg" />
            <RenkSatiri c={c} etiket="Çerçeve" k="--hap-bd" />
          </Bolum>
          <Bolum baslik="Arama kutusu">
            <RenkSatiri c={c} etiket="Çerçeve" k="--cz-arama" alfa />
          </Bolum>
          <Bolum baslik="Başlık degradesi (ZARA)">
            <div className="h-4 rounded-full border border-[#f2eee8]/20" style={{ background: `linear-gradient(90deg, ${deger("--ks-marka-1")}, ${deger("--ks-marka-2")}, ${deger("--ks-marka-3")})` }} />
            <RenkSatiri c={c} etiket="Ana ton" k="--ks-marka-1" />
            <RenkSatiri c={c} etiket="Parlama" k="--ks-marka-2" />
            <RenkSatiri c={c} etiket="Koyu ton" k="--ks-marka-3" />
            <Aci etiket="Parlama açısı" aci={parseFloat(deger("--ks-aci")) || 105} onChange={(n) => yaz({ "--ks-aci": `${n}deg` })} />
          </Bolum>
          <Bolum baslik="Vurgu ve ok dairesi">
            <RenkSatiri c={c} etiket="Vurgu" k="--ta" ekler={["--ks-ok-bg"]} />
            <RenkSatiri c={c} etiket="Daire çerçevesi" k="--ks-ok-bd" />
            <RenkSatiri c={c} etiket="Ok" k="--ks-ok-yazi" />
          </Bolum>
          <Bolum baslik="Arka ışık">
            <RenkSatiri c={c} etiket="Çekirdek" k="--ks-isik-1" alfa />
            <RenkSatiri c={c} etiket="Kenar" k="--ks-isik-2" alfa />
          </Bolum>
          <Bolum baslik="ARA düğmesi">
            <Gradyan c={c} k="--btn-bg" etiketler={["Başlangıç", "Bitiş"]} aciAyari derle={(a, r) => `linear-gradient(${a}deg, ${r[0]}, ${r[1]})`} />
            <RenkSatiri c={c} etiket="Yazı" k="--btn-fg" />
          </Bolum>
          <Bolum baslik="Kayan şerit">
            <Gradyan c={c} k="--serit-bg" etiketler={["Kenar", "Orta"]} aciAyari={false} derle={(_, r) => `linear-gradient(90deg, ${r[0]}, ${r[1]} 50%, ${r[0]})`} />
            <RenkSatiri c={c} etiket="Yazı" k="--serit-fg" />
            <RenkSatiri c={c} etiket="Çizgi" k="--serit-bd" />
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
      )}
      <button
        type="button"
        onClick={() => setAcik((a) => !a)}
        className="cursor-pointer rounded-full border border-[#f2eee8]/30 bg-[#121212] px-4 py-2.5 text-[11px] font-bold tracking-[0.14em] text-[#f2eee8] uppercase shadow-xl"
        aria-expanded={acik}
      >
        ◐ renk
      </button>
    </div>
  );
}

export default function RenkAyari() {
  if (!import.meta.env.DEV) return null;
  return <Panel />;
}
