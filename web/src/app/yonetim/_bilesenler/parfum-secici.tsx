"use client";

import { useState } from "react";

const tr = (m: string) => m.toLocaleLowerCase("tr-TR");

// Binlerce parfüm arasından yazarak seçme: tarayıcının öneri listesi + eşleşen kaydın kimliğini gizli alana yazar.
// Form alanı: parfumId. Listede olmayan bir şey yazılırsa parfumId boş gider ve sunucu "listeden seç" der.
export function ParfumSecici({ secenekler, baslangicId }: { secenekler: { id: number; etiket: string }[]; baslangicId?: number | null }) {
  const [metin, setMetin] = useState(secenekler.find((s) => s.id === baslangicId)?.etiket ?? "");
  const eslesen = secenekler.find((s) => tr(s.etiket) === tr(metin.trim()));

  return (
    <div>
      <label className="y-etiket" htmlFor="parfum-secici">
        Orijinal parfüm
      </label>
      <input
        id="parfum-secici"
        className="y-girdi"
        list="parfum-secenekleri"
        placeholder="Marka ve parfüm adını yazmaya başla…"
        autoComplete="off"
        value={metin}
        onChange={(e) => setMetin(e.target.value)}
      />
      <datalist id="parfum-secenekleri">
        {secenekler.map((s) => (
          <option key={s.id} value={s.etiket} />
        ))}
      </datalist>
      <input type="hidden" name="parfumId" value={eslesen?.id ?? ""} />
      <p className="y-ipucu">
        {eslesen ? (
          <span style={{ color: "var(--accent)" }}>✓ Seçildi: {eslesen.etiket}</span>
        ) : metin.trim() ? (
          "Listede yok. Önerilerden birini seç; parfüm yoksa önce Parfümler bölümünden ekle."
        ) : (
          "Önce orijinal parfüm kayıtlı olmalı."
        )}
      </p>
    </div>
  );
}
