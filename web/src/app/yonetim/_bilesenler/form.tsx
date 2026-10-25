"use client";

import { useActionState, useEffect, useRef, useTransition, type ReactNode } from "react";
import type { Sonuc } from "../actions";

// Formu <form action> yerine onSubmit ile gönderir: React 19, action'lı formu bitince sıfırlar; hata olduğunda
// kullanıcının doldurduğu alanlar (ve seçtiği dosya) silinmesin diye varsayılan davranış engellenir.
export function YonetimFormu({
  action,
  etiket,
  children,
}: {
  action: (onceki: Sonuc, fd: FormData) => Promise<Sonuc>;
  etiket: string;
  children: ReactNode;
}) {
  const [durum, eylem, bekliyor] = useActionState(action, undefined);
  const [, gecis] = useTransition();
  const hataKutusu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (durum?.hata) hataKutusu.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [durum]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const veri = new FormData(e.currentTarget);
        gecis(() => eylem(veri));
      }}
      className="space-y-5"
    >
      {children}
      {durum?.hata && (
        <div ref={hataKutusu} role="alert" className="y-hata">
          {durum.hata}
        </div>
      )}
      <button type="submit" disabled={bekliyor} className="dugme y-btn">
        {bekliyor ? "Kaydediliyor…" : etiket}
      </button>
    </form>
  );
}
