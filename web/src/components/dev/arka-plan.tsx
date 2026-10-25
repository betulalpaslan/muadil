"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

// Tasarım sekmesinin "Arka plan görseli / CSS" bölümü. Sayfanın arkasına sabit bir katman (#dev-arka-plan) ekler;
// katman .sayfa'nın (z-index 1) altında, --bg zemininin üstünde durur. Site CSS'ine dokunulmaz. Ayar tema başına
// localStorage'da tutulur. Kalıcı yapmak için "CSS'i kopyala" çıktısı kullanılır.

export type ArkaPlan = {
  tur: "yok" | "gorsel" | "css";
  gorsel: string; // URL ya da data: adresi
  css: string; // `background` kısaltmasının değeri (ör. radial-gradient(...))
  boyut: "cover" | "contain" | "tekrar";
  karartma: number; // 0–0.9: okunabilirlik için üstüne binen düz katman
  sabit: boolean;
};

export const ARKA_PLAN_BOS: ArkaPlan = { tur: "yok", gorsel: "", css: "", boyut: "cover", karartma: 0, sabit: true };
const ANAHTAR = "arka-plan-ayari";
const KATMAN = "dev-arka-plan";

export function arkaPlanOku(tema: string): ArkaPlan {
  try {
    return { ...ARKA_PLAN_BOS, ...(JSON.parse(localStorage.getItem(`${ANAHTAR}-${tema}`) ?? "{}") as Partial<ArkaPlan>) };
  } catch {
    return ARKA_PLAN_BOS;
  }
}

function arkaPlanKaydet(tema: string, a: ArkaPlan): boolean {
  try {
    if (a.tur === "yok") localStorage.removeItem(`${ANAHTAR}-${tema}`);
    else localStorage.setItem(`${ANAHTAR}-${tema}`, JSON.stringify(a));
    return true;
  } catch {
    return false; // depolama kapalı ya da görsel çok büyük; ayar bu oturumda yine uygulanır
  }
}

function katmanBul(): HTMLElement {
  let el = document.getElementById(KATMAN);
  if (!el) {
    el = document.createElement("div");
    el.id = KATMAN;
    el.setAttribute("aria-hidden", "true");
    document.body.prepend(el);
  }
  return el;
}

// Katmanın CSS'i; hem ekrana uygulamak hem de "CSS'i kopyala" için ortak.
export function arkaPlanDeclarations(a: ArkaPlan, koyu: boolean): Record<string, string> | null {
  if (a.tur === "yok") return null;
  const kat = a.karartma > 0 ? `linear-gradient(${koyu ? `rgb(0 0 0 / ${a.karartma})` : `rgb(255 255 255 / ${a.karartma})`}, ${koyu ? `rgb(0 0 0 / ${a.karartma})` : `rgb(255 255 255 / ${a.karartma})`})` : "";
  if (a.tur === "css") {
    if (!a.css.trim() || !CSS.supports("background", a.css)) return null;
    return { background: kat ? `${kat}, ${a.css}` : a.css, "background-attachment": a.sabit ? "fixed" : "scroll" };
  }
  if (!a.gorsel.trim()) return null;
  const resim = `url("${a.gorsel.replace(/"/g, "%22")}")`;
  return {
    "background-image": kat ? `${kat}, ${resim}` : resim,
    "background-size": a.boyut === "tekrar" ? "auto" : a.boyut,
    "background-position": "center",
    "background-repeat": a.boyut === "tekrar" ? "repeat" : "no-repeat",
    "background-attachment": a.sabit ? "fixed" : "scroll",
  };
}

const ETIKET = "w-[96px] shrink-0 text-[11px] text-[#8a8580]";
const GIRDI = "min-w-0 flex-1 rounded-lg border border-[#f2eee8]/20 bg-black p-2 text-[11px] text-[#f2eee8]";

export function ArkaPlanBolumu({ tema, koyu }: { tema: string; koyu: boolean }) {
  const [a, setA] = useState<ArkaPlan>(ARKA_PLAN_BOS);
  const [uyari, setUyari] = useState("");

  // Tema değişince o temanın kaydını yükle
  useEffect(() => {
    setA(arkaPlanOku(tema));
    setUyari("");
  }, [tema]);

  // Katmanı güncelle (boşsa kaldır)
  useEffect(() => {
    const dekl = arkaPlanDeclarations(a, koyu);
    const mevcut = document.getElementById(KATMAN);
    if (!dekl) {
      mevcut?.remove();
      return;
    }
    const el = katmanBul();
    el.style.cssText = "position:fixed;inset:0;z-index:0;pointer-events:none;";
    Object.entries(dekl).forEach(([k, v]) => el.style.setProperty(k, v));
  }, [a, koyu]);

  const degistir = (y: Partial<ArkaPlan>) => {
    const n = { ...a, ...y };
    setA(n);
    setUyari(arkaPlanKaydet(tema, n) ? "" : "Kaydedilemedi (görsel büyük olabilir): ayar yalnız bu oturumda geçerli.");
  };

  function dosyaSec(e: ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    e.target.value = "";
    if (!dosya) return;
    const okuyucu = new FileReader();
    okuyucu.onload = () => degistir({ tur: "gorsel", gorsel: String(okuyucu.result) });
    okuyucu.readAsDataURL(dosya);
  }

  const cssGecersiz = a.tur === "css" && a.css.trim() !== "" && !CSS.supports("background", a.css);

  return (
    <section className="flex flex-col gap-2 border-t border-[#f2eee8]/15 pt-3">
      <h3 className="m-0 text-[11px] font-bold tracking-[0.14em] uppercase">Arka plan görseli / CSS</h3>
      <div className="flex gap-1">
        {(["yok", "gorsel", "css"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => degistir({ tur: t })}
            aria-pressed={a.tur === t}
            className={`flex-1 cursor-pointer rounded-full border px-2 py-1.5 text-[11px] ${
              a.tur === t ? "border-[#d6bb8d] bg-[#d6bb8d] font-bold text-[#1a1208]" : "border-[#f2eee8]/30 bg-transparent text-[#f2eee8]"
            }`}
          >
            {t === "yok" ? "Yok" : t === "gorsel" ? "Görsel" : "CSS"}
          </button>
        ))}
      </div>

      {a.tur === "gorsel" && (
        <>
          <div className="flex items-center gap-2">
            <span className={ETIKET}>Görsel adresi</span>
            <input type="text" value={a.gorsel.startsWith("data:") ? "" : a.gorsel} placeholder={a.gorsel.startsWith("data:") ? "(yüklenen dosya)" : "https://… ya da /gorsel.jpg"} onChange={(e) => degistir({ gorsel: e.target.value })} className={GIRDI} aria-label="Görsel adresi" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[11px]">
            <span className={ETIKET}>Dosya yükle</span>
            <input type="file" accept="image/*" onChange={dosyaSec} className="min-w-0 flex-1 text-[11px] text-[#8a8580]" />
          </label>
          <div className="flex items-center gap-2">
            <span className={ETIKET}>Boyut</span>
            <select value={a.boyut} onChange={(e) => degistir({ boyut: e.target.value as ArkaPlan["boyut"] })} className={GIRDI} aria-label="Boyut">
              <option value="cover">Doldur (cover)</option>
              <option value="contain">Sığdır (contain)</option>
              <option value="tekrar">Döşe (tekrar)</option>
            </select>
          </div>
        </>
      )}

      {a.tur === "css" && (
        <>
          <textarea
            value={a.css}
            onChange={(e) => degistir({ css: e.target.value })}
            rows={4}
            spellCheck={false}
            placeholder={"radial-gradient(ellipse at 50% 0%, #3a2a14, transparent 70%)"}
            className={`${GIRDI} w-full resize-y font-mono`}
            aria-label="Arka plan CSS"
          />
          <p className={`m-0 text-[11px] leading-snug ${cssGecersiz ? "text-[#e3b0a0]" : "text-[#8a8580]"}`}>
            {cssGecersiz ? "Geçersiz `background` değeri." : "`background` kısaltmasının değeri: renk, degrade ya da url(...)."}
          </p>
        </>
      )}

      {a.tur !== "yok" && (
        <>
          <div className="flex items-center gap-2">
            <span className={ETIKET}>Karartma</span>
            <input type="range" min={0} max={0.9} step={0.05} value={a.karartma} onChange={(e) => degistir({ karartma: Number(e.target.value) })} className="min-w-0 flex-1" aria-label="Karartma" />
            <span className="w-9 text-right text-[11px] text-[#8a8580]">{Math.round(a.karartma * 100)}%</span>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[11px]">
            <input type="checkbox" checked={a.sabit} onChange={(e) => degistir({ sabit: e.target.checked })} className="cursor-pointer" />
            Kaydırınca sabit kalsın
          </label>
          <button type="button" onClick={() => degistir({ ...ARKA_PLAN_BOS })} className="cursor-pointer self-start rounded-full border border-[#f2eee8]/30 bg-transparent px-3 py-1.5 text-[11px] text-[#f2eee8]">
            Arka planı kaldır
          </button>
        </>
      )}
      {uyari && <p className="m-0 text-[11px] text-[#e3b0a0]">{uyari}</p>}
    </section>
  );
}
