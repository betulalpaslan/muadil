import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiIstek } from "../api/client";
import { tl } from "../para";
import type { ParfumListe } from "../types";
import { HataMesaji } from "./ui";

export default function Parfumler() {
  const [parfumler, setParfumler] = useState<ParfumListe[]>([]);
  const [ara, setAra] = useState("");
  const [hata, setHata] = useState("");

  useEffect(() => {
    if (ara.length === 1) return;
    let gecersiz = false;
    const zamanlayici = setTimeout(
      () => {
        const sorgu = ara ? `?ara=${encodeURIComponent(ara)}` : "";
        apiIstek<ParfumListe[]>(`/api/parfumler${sorgu}`)
          .then((sonuc) => {
            if (!gecersiz) setParfumler(sonuc);
          })
          .catch((e) => setHata(e.message));
      },
      ara ? 300 : 0
    );
    return () => {
      gecersiz = true;
      clearTimeout(zamanlayici);
    };
  }, [ara]);

  return (
    <section>
      <h1 className="font-baslik text-4xl leading-tight sm:text-5xl">Hangi parfümün muadilini arıyorsun?</h1>

      <label className="mt-6 block">
        <span className="sr-only">Parfüm, marka veya muadil kodu</span>
        <input
          value={ara}
          onChange={(e) => setAra(e.target.value)}
          placeholder="Parfüm, marka ya da muadil kodu"
          className="w-full border-b-2 border-murekkep bg-transparent py-2 text-xl placeholder:text-buhar focus:outline-none"
        />
      </label>

      {parfumler.length === 0 ? (
        <p className="mt-8 text-buhar">
          {ara ? `"${ara}" için sonuç yok. Parfüm adını, markayı ya da muadil kodunu dene.` : "Henüz parfüm eklenmedi."}
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-cizgi">
          {parfumler.map((p) => (
            <li key={p.id}>
              <Link to={`/parfum/${p.id}`} className="flex items-baseline justify-between gap-4 py-4 hover:opacity-70">
                <span>
                  <span className="block font-baslik text-2xl">{p.ad}</span>
                  <span className="text-sm text-buhar">{p.marka}</span>
                </span>
                <span className="shrink-0 text-right">
                  {p.enUygunMuadil !== null ? (
                    <>
                      <span className="block tabular-nums">{tl(p.enUygunMuadil)}'den</span>
                      <span className="text-sm text-buhar">{p.muadilSayisi} muadil</span>
                    </>
                  ) : (
                    <span className="text-sm text-buhar">Muadil yok</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <HataMesaji mesaj={hata} />
    </section>
  );
}
