"use client";

import { useEffect, useState } from "react";

// Görsel seçimi: mevcut görseli, yeni seçilenin önizlemesini ve "kaldır" seçeneğini gösterir.
// Alan adları: gorsel (dosya), gorselKaldir ("1"). Sunucu eylemi bunları gorselKarari() ile okur.
export function GorselAlani({ mevcut, etiket = "Görsel" }: { mevcut: string | null; etiket?: string }) {
  const [onizleme, setOnizleme] = useState<string | null>(null);
  const [kaldir, setKaldir] = useState(false);

  // Önizleme değişince ya da bileşen kalkınca eski nesne adresi serbest bırakılır.
  useEffect(
    () => () => {
      if (onizleme) URL.revokeObjectURL(onizleme);
    },
    [onizleme],
  );

  const gosterilen = onizleme ?? (kaldir ? null : mevcut);

  return (
    <div>
      <label className="y-etiket" htmlFor="gorsel-dosyasi">
        {etiket}
      </label>
      <div className="flex items-start gap-4">
        <div className="y-kucukgorsel" style={{ width: 120, height: 120 }}>
          {gosterilen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={gosterilen} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            "Görsel yok"
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            id="gorsel-dosyasi"
            name="gorsel"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="y-girdi"
            onChange={(e) => {
              const dosya = e.target.files?.[0];
              setOnizleme(dosya ? URL.createObjectURL(dosya) : null);
              if (dosya) setKaldir(false);
            }}
          />
          <p className="y-ipucu">PNG, JPG veya WebP, en fazla 8 MB. Otomatik olarak 1200 px&apos;e küçültülüp WebP yapılır.</p>
          {mevcut && !onizleme && (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={kaldir} onChange={(e) => setKaldir(e.target.checked)} />
              Mevcut görseli kaldır
            </label>
          )}
          <input type="hidden" name="gorselKaldir" value={kaldir ? "1" : "0"} />
        </div>
      </div>
    </div>
  );
}
