"use client";

import { useRef, useState, useTransition } from "react";
import { hizliGorselYukle } from "../actions";

// Liste satırından tek tıkla görsel yükleme: dosya seçilince hemen gönderilir.
export function HizliGorsel({ tur, id, gorselUrl, ad }: { tur: "parfum" | "nota" | "marka"; id: number; gorselUrl: string | null; ad: string }) {
  const [bekliyor, gecis] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const girdi = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3">
      <div className="y-kucukgorsel">
        {gorselUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gorselUrl} alt={ad} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          "yok"
        )}
      </div>
      <div>
        <button type="button" className="y-ikincil" disabled={bekliyor} onClick={() => girdi.current?.click()}>
          {bekliyor ? "Yükleniyor…" : gorselUrl ? "Değiştir" : "Görsel ekle"}
        </button>
        <input
          ref={girdi}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr"
          aria-label={`${ad} görseli`}
          onChange={(e) => {
            const dosya = e.target.files?.[0];
            if (!dosya) return;
            const veri = new FormData();
            veri.set("gorsel", dosya);
            setHata(null);
            gecis(async () => {
              const sonuc = await hizliGorselYukle(tur, id, veri);
              if (sonuc?.hata) setHata(sonuc.hata);
            });
            e.target.value = "";
          }}
        />
        {hata && (
          <p role="alert" className="y-ipucu" style={{ color: "#ffb3b3" }}>
            {hata}
          </p>
        )}
      </div>
    </div>
  );
}
