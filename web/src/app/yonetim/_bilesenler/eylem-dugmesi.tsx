"use client";

import { useState, useTransition } from "react";
import type { Sonuc } from "../actions";

// Onay isteyen tek tıklık eylem (sil, geri getir). `action` sunucuda bind edilmiş bir Server Action'dır.
export function EylemDugmesi({
  action,
  etiket,
  onay,
  tehlike = false,
}: {
  action: () => Promise<Sonuc>;
  etiket: string;
  onay?: string;
  tehlike?: boolean;
}) {
  const [bekliyor, gecis] = useTransition();
  const [hata, setHata] = useState<string | null>(null);

  return (
    <span>
      <button
        type="button"
        disabled={bekliyor}
        className={`y-ikincil ${tehlike ? "y-tehlike" : ""}`}
        onClick={() => {
          if (onay && !window.confirm(onay)) return;
          setHata(null);
          gecis(async () => {
            const sonuc = await action();
            if (sonuc?.hata) setHata(sonuc.hata);
          });
        }}
      >
        {bekliyor ? "…" : etiket}
      </button>
      {hata && (
        <span role="alert" className="y-hata ml-3 inline-block" style={{ padding: "6px 10px" }}>
          {hata}
        </span>
      )}
    </span>
  );
}
