"use client";

import { useState } from "react";
import { Karsilastirma } from "@/components/karsilastirma";
import { adBuyuk } from "@/lib/site";
import type { KarsilastirmaVeri } from "@/lib/veri";

// Ana sayfa: "En çok aranan" çipleri karşılaştırmayı sayfa yenilenmeden değiştirir. İlk parfüm sunucuda çizilir.
export function AnaKarsilastirma({ vitrin }: { vitrin: KarsilastirmaVeri[] }) {
  const [secili, setSecili] = useState(0);
  if (vitrin.length === 0) return null;

  return (
    <>
      <div className="flex flex-col items-center gap-5">
        <span className="text-[17px] font-medium">En Çok Arananlar</span>
        <div className="flex flex-wrap justify-center gap-2.5">
          {vitrin.map((v, i) => (
            <button
              key={v.slug}
              type="button"
              aria-pressed={i === secili}
              onClick={() => setSecili(i)}
              className={`cip h-9 cursor-pointer px-[18px] text-[11px] ${i === secili ? "cip-aktif" : ""}`}
              style={i === secili ? { background: "var(--gold-surf)", color: "var(--btnfg)", borderColor: "transparent" } : { background: "rgb(255 255 255 / 0.4)", color: "var(--ink)" }}
            >
              {adBuyuk(v.ad)}
            </button>
          ))}
        </div>
      </div>
      <Karsilastirma veri={vitrin[secili]} sinir={4} />
    </>
  );
}
