"use client";

import { useState } from "react";
import { notaAdiDuzenle } from "@/lib/nota-adi";

type Katman = "ust" | "orta" | "alt";
const KATMANLAR: { anahtar: Katman; ad: string; ipucu: string }[] = [
  { anahtar: "ust", ad: "Üst notalar", ipucu: "İlk hissedilen, hızlı uçan" },
  { anahtar: "orta", ad: "Orta notalar", ipucu: "Kalbi, parfümün karakteri" },
  { anahtar: "alt", ad: "Alt notalar", ipucu: "Kalıcı iz, kurulum" },
];

const tr = (m: string) => m.toLocaleLowerCase("tr-TR");

// Üç katmanlı nota girişi. Kayıtlı notalar listeden önerilir; olmayan nota yazılırsa "yeni" olarak işaretlenir
// ve parfümle birlikte oluşturulur (görseli sonra Notalar sayfasından eklenir). Form alanları: ust, orta, alt (JSON dizi).
export function NotaSecici({ baslangic, mevcut }: { baslangic: Record<Katman, string[]>; mevcut: string[] }) {
  const [secili, setSecili] = useState(baslangic);
  const [girdi, setGirdi] = useState<Record<Katman, string>>({ ust: "", orta: "", alt: "" });
  const [uyari, setUyari] = useState<string | null>(null);
  const kayitli = new Set(mevcut.map(tr));

  function ekle(katman: Katman, ham: string) {
    const adlar = ham.split(/[,;]/).map(notaAdiDuzenle).filter(Boolean);
    if (!adlar.length) return;
    let yeni = secili;
    let sorun: string | null = null;
    for (const ad of adlar) {
      const nerede = (Object.keys(yeni) as Katman[]).find((k) => yeni[k].some((x) => tr(x) === tr(ad)));
      if (nerede) {
        sorun = `"${ad}" zaten ${KATMANLAR.find((k) => k.anahtar === nerede)!.ad.toLowerCase()} içinde.`;
        continue;
      }
      yeni = { ...yeni, [katman]: [...yeni[katman], ad] };
    }
    setSecili(yeni);
    setUyari(sorun);
    setGirdi((g) => ({ ...g, [katman]: "" }));
  }

  const cikar = (katman: Katman, ad: string) => setSecili((s) => ({ ...s, [katman]: s[katman].filter((x) => x !== ad) }));

  return (
    <fieldset className="space-y-4">
      <legend className="y-etiket">Notalar</legend>
      <datalist id="nota-listesi">
        {mevcut.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {KATMANLAR.map(({ anahtar, ad, ipucu }) => (
        <div key={anahtar} className="y-kart" style={{ padding: 14 }}>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="text-sm font-bold">{ad}</span>
            <span className="y-ipucu" style={{ marginTop: 0 }}>
              {ipucu}
            </span>
          </div>
          {secili[anahtar].length > 0 && (
            <ul className="mb-3 flex flex-wrap gap-2">
              {secili[anahtar].map((n) => {
                const yeni = !kayitli.has(tr(n));
                return (
                  <li key={n} className={`y-cip ${yeni ? "yeni" : ""}`}>
                    {n}
                    {yeni && <span className="kucuk text-vurgu">yeni</span>}
                    <button type="button" onClick={() => cikar(anahtar, n)} aria-label={`${n} notasını çıkar`}>
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <input
            className="y-girdi"
            list="nota-listesi"
            placeholder="Nota yaz, Enter ile ekle (virgülle birden çok)"
            aria-label={`${ad} ekle`}
            value={girdi[anahtar]}
            onChange={(e) => {
              const v = e.target.value;
              // Virgül yazmak notayı hemen ekler; Enter ve alandan çıkmak da ekler.
              if (v.endsWith(",") || v.endsWith(";")) ekle(anahtar, v);
              else setGirdi((g) => ({ ...g, [anahtar]: v }));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                ekle(anahtar, girdi[anahtar]);
              }
            }}
            onBlur={() => ekle(anahtar, girdi[anahtar])}
          />
          <input type="hidden" name={anahtar} value={JSON.stringify(secili[anahtar])} />
        </div>
      ))}
      {uyari && (
        <p role="status" className="y-ipucu" style={{ color: "var(--accent)" }}>
          {uyari}
        </p>
      )}
    </fieldset>
  );
}
