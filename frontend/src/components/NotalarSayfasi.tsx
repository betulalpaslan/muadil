import { useEffect, useMemo, useState } from "react";
import { apiIstek } from "../api/client";
import { gorselAdresi } from "../gorsel";
import { notaAnahtar } from "../tasarim/notaAnahtar";
import type { Nota } from "../types";
import { Footer } from "./OrtakYerlesim";
import { NotaYildizi } from "./tasarim/NotaSprey";
import { HataMesaji } from "./ui";

// Menüdeki NOTALAR (/notalar): tüm notalar alfabetik, her kartta numara, ikon, ad ve kısa açıklama.
// Üstteki kutu ad ve açıklamada arar (büyük-küçük harf ve Türkçe karakter farkı yok sayılır).
export default function NotalarSayfasi() {
  const [notalar, setNotalar] = useState<Nota[] | null>(null);
  const [ara, setAra] = useState("");
  const [hata, setHata] = useState("");

  useEffect(() => {
    apiIstek<Nota[]>("/api/notalar")
      .then((liste) => setNotalar([...liste].sort((a, b) => a.ad.localeCompare(b.ad, "tr"))))
      .catch((e) => setHata(e.message));
  }, []);

  // Numara alfabetik sıradaki yerdir; arama yapınca kartların numarası değişmesin
  const numarali = useMemo(() => (notalar ?? []).map((n, i) => ({ ...n, no: i + 1 })), [notalar]);
  const gorunen = useMemo(() => {
    const anahtar = notaAnahtar(ara);
    if (!anahtar) return numarali;
    return numarali.filter((n) => notaAnahtar(`${n.ad} ${n.aciklama ?? ""}`).includes(anahtar));
  }, [numarali, ara]);

  return (
    <>
      <section aria-label="Notalar" className="px-[clamp(16px,5vw,70px)] pt-10 pb-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h1 className="genis m-0 text-[clamp(30px,3.6vw,48px)] leading-[1.3] [word-spacing:.2em]">
            <span className="text-vurgu">tüm</span> notalar
          </h1>
          {notalar && (
            <span className="kucuk text-soluk">
              {ara ? `${gorunen.length} / ${notalar.length} nota` : `${notalar.length} nota`}
            </span>
          )}
        </div>

        <div className="mb-8 max-w-[520px]">
          <label htmlFor="nota-ara" className="sr-only">
            Nota ara
          </label>
          <input
            id="nota-ara"
            type="search"
            value={ara}
            onChange={(e) => setAra(e.target.value)}
            placeholder="NOTA YA DA KOKU TARİFİ ARA"
            className="h-[52px] w-full rounded-full border-[1.5px] border-yazi bg-transparent px-6 text-[11px] font-semibold tracking-[0.18em] text-yazi"
          />
        </div>

        {notalar === null && !hata && <p className="text-sm text-soluk">Yükleniyor...</p>}
        {notalar && notalar.length === 0 && <p className="text-sm">Henüz nota eklenmedi.</p>}
        {notalar && notalar.length > 0 && gorunen.length === 0 && (
          <p className="text-sm">"{ara}" için nota bulunamadı. Başka bir kelime dene.</p>
        )}

        {gorunen.length > 0 && (
          <ul className="m-0 grid list-none grid-cols-1 border-t-[1.5px] border-l-[1.5px] border-yazi p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {gorunen.map((n) => {
              const gorsel = gorselAdresi(n.gorselUrl);
              return (
                <li key={n.id} className="border-r-[1.5px] border-b-[1.5px] border-yazi">
                  <article className="flex h-full flex-col gap-4 p-6">
                    <span className="kucuk text-soluk">{String(n.no).padStart(2, "0")}</span>
                    <div className="flex h-24 items-center justify-center">
                      {gorsel ? (
                        <img
                          src={gorsel}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="nota-ikon block h-24 w-24 object-contain"
                        />
                      ) : (
                        <NotaYildizi boyut={96} />
                      )}
                    </div>
                    <h2 className="genis m-0 text-center text-lg leading-[1.3] font-extrabold">{n.ad}</h2>
                    {n.aciklama && (
                      <p className="m-0 text-center text-[13px] leading-[1.7] tracking-[0.03em]">{n.aciklama}</p>
                    )}
                  </article>
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
