"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { TasarimSekmesi } from "./tasarim-sekmesi";

// Geliştirici modu: sağ kenarda açılan widget (yalnızca geliştirmede, layout'ta koşullu eklenir).
// Yeni araçlar SEKMELER listesine eklenir. Panel ve tüm sekmeler kapalıyken de bağlı kalır (gizlenir): kayıtlı ayarlar yenilemede uygulanır.

const SEKMELER: { id: string; ad: string; icerik: () => ReactNode }[] = [
  { id: "tasarim", ad: "Tasarım", icerik: () => <TasarimSekmesi /> },
];

export function DevWidget() {
  const [acik, setAcik] = useState(false);
  const [sekme, setSekme] = useState(SEKMELER[0].id);
  const aktif = SEKMELER.find((s) => s.id === sekme) ?? SEKMELER[0];

  return (
    <div className="fixed top-0 right-0 z-[1000] flex h-dvh items-center text-[#f2eee8] normal-case">
      {!acik && (
        <button
          type="button"
          onClick={() => setAcik(true)}
          aria-expanded={acik}
          className="cursor-pointer rounded-l-xl border border-r-0 border-[#f2eee8]/30 bg-[#121212] px-2 py-4 text-[11px] font-bold tracking-[0.2em] text-[#f2eee8] uppercase shadow-xl [writing-mode:vertical-rl]"
        >
          ◐ dev
        </button>
      )}
      {/* Panel kapalıyken de bağlı kalır (hidden): kayıtlı renk/arka plan ayarları sayfa yenilenince uygulanmaya devam eder. */}
      <aside className={`${acik ? "flex" : "hidden"} h-full w-[360px] max-w-[92vw] flex-col border-l border-[#f2eee8]/20 bg-[#121212] shadow-2xl`}>
          <header className="flex items-center justify-between border-b border-[#f2eee8]/15 px-4 pt-3">
            <div role="tablist" className="flex gap-1">
              {SEKMELER.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={s.id === aktif.id}
                  onClick={() => setSekme(s.id)}
                  className={`cursor-pointer border-0 border-b-2 bg-transparent px-3 pb-2 text-[11px] font-bold tracking-[0.14em] uppercase ${
                    s.id === aktif.id ? "border-[#d6bb8d] text-[#f2eee8]" : "border-transparent text-[#8a8580]"
                  }`}
                >
                  {s.ad}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setAcik(false)} className="mb-2 cursor-pointer border-0 bg-transparent text-[18px] text-[#f2eee8]" aria-label="Kapat">
              ×
            </button>
          </header>
          <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-4">
            {SEKMELER.map((s) => (
              <div key={s.id} hidden={s.id !== aktif.id}>
                {s.icerik()}
              </div>
            ))}
          </div>
        </aside>
    </div>
  );
}
