import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiIstek } from "../api/client";
import { gorselAdresi } from "../gorsel";
import { tl } from "../para";
import { pastel } from "../tasarim/renk";
import type { ParfumListe } from "../types";
import { Footer } from "./OrtakYerlesim";
import ParfumSisesi from "./tasarim/ParfumSisesi";
import { HataMesaji } from "./ui";

// Menüdeki PARFÜMLER (/parfumler): tüm orijinal parfümler marka ve ada göre sıralı, her satırda muadilleri
// (marka, kod, fiyat). Satırın tamamı parfümün detay sayfasına (/parfum/:id) gider.
export default function ParfumlerSayfasi() {
  const [parfumler, setParfumler] = useState<ParfumListe[] | null>(null);
  const [hata, setHata] = useState("");

  useEffect(() => {
    apiIstek<ParfumListe[]>("/api/parfumler")
      .then((liste) => setParfumler([...liste].sort((a, b) => a.marka.localeCompare(b.marka, "tr") || a.ad.localeCompare(b.ad, "tr"))))
      .catch((e) => setHata(e.message));
  }, []);

  const muadilSayisi = parfumler?.reduce((t, p) => t + p.muadilSayisi, 0) ?? 0;

  return (
    <>
      <section aria-label="Parfümler" className="px-(--kenar) pt-10 pb-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h1 className="genis m-0 text-[clamp(30px,3.6vw,48px)] leading-[1.3] [word-spacing:.2em]">
            <span className="text-vurgu">tüm</span> parfümler
          </h1>
          {parfumler && (
            <span className="kucuk text-soluk">
              {parfumler.length} orijinal · {muadilSayisi} muadil
            </span>
          )}
        </div>

        {parfumler === null && !hata && <p className="text-sm text-soluk">Yükleniyor...</p>}
        {parfumler?.length === 0 && <p className="text-sm">Henüz parfüm eklenmedi.</p>}

        {parfumler && parfumler.length > 0 && (
          <ul className="m-0 flex list-none flex-col p-0">
            {parfumler.map((p) => {
              const gorsel = gorselAdresi(p.gorselUrl);
              return (
                <li key={p.id} className="border-t-[1.5px] border-yazi last:border-b-[1.5px]">
                  <Link
                    to={`/parfum/${p.id}`}
                    className="flex flex-wrap items-center gap-x-6 gap-y-4 py-6 text-yazi no-underline"
                  >
                    <div className="flex h-[88px] w-[68px] shrink-0 items-center justify-center overflow-hidden" style={{ background: pastel(p.renk, 0.8) }}>
                      {gorsel ? (
                        <img src={gorsel} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain mix-blend-multiply" />
                      ) : (
                        <ParfumSisesi genislik={36} govde="#0B0B0B" parlak="#F2EEE8" />
                      )}
                    </div>

                    <div className="min-w-0 flex-[1_1_220px]">
                      <div className="kucuk text-soluk">{p.marka}</div>
                      <div className="genis text-xl font-extrabold">{p.ad}</div>
                      <div className="kucuk mt-1.5 text-[9px] text-soluk">
                        {p.muadilSayisi} muadil{p.enUygunMuadil != null && ` · en uygun ${tl(p.enUygunMuadil)}`}
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-[2_1_320px] flex-wrap gap-2">
                      {p.muadilOzetleri.length === 0 ? (
                        <span className="kucuk text-[9px] text-soluk">henüz muadil eklenmedi</span>
                      ) : (
                        p.muadilOzetleri.map((m) => (
                          <span
                            key={m.marka + m.kod}
                            className="inline-flex min-h-[46px] flex-col justify-center gap-0.5 rounded-full border-[1.5px] border-yazi px-[18px]"
                          >
                            <span className="kucuk text-[8px] opacity-60">{m.marka}</span>
                            <span className="text-[14px] font-bold tracking-[0.1em]">
                              {m.kod} <span className="text-[11px] font-medium opacity-70">{tl(m.fiyat)}</span>
                            </span>
                          </span>
                        ))
                      )}
                    </div>

                    <span className="kucuk inline-flex items-center gap-2">
                      detaya git
                      <svg width="10" height="10" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M5 15L15 5M7 5h8v8" fill="none" stroke="currentColor" strokeWidth="2.6" />
                      </svg>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <HataMesaji mesaj={hata} />
      </section>
      <Footer />
    </>
  );
}
