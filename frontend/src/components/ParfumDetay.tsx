import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../api/client";
import { gorselAdresi } from "../gorsel";
import { tl } from "../para";
import type { Marka, Muadil, ParfumDetayVeri } from "../types";
import { ALAN, BUTON, BUTON_SADE, HataMesaji } from "./ui";

type Olcut = "benzerlik" | "fiyat" | "kalicilik";

const OLCUTLER: { deger: Olcut; etiket: string }[] = [
  { deger: "benzerlik", etiket: "En benzer" },
  { deger: "fiyat", etiket: "En ucuz" },
  { deger: "kalicilik", etiket: "En kalıcı" },
];

// Piramit: üstte dar, altta geniş. Sınıflar tam yazılmalı (Tailwind parça birleştirmeyi göremez).
const PIRAMIT = [
  { katman: "Ust", etiket: "Üst notalar", sinif: "w-3/5 bg-ust" },
  { katman: "Orta", etiket: "Orta notalar", sinif: "w-4/5 bg-orta" },
  { katman: "Alt", etiket: "Alt notalar", sinif: "w-full bg-alt text-cam" },
] as const;

function sirala(liste: Muadil[], olcut: Olcut): Muadil[] {
  return [...liste].sort((a, b) => {
    if (olcut === "fiyat") return a.fiyat - b.fiyat || b.benzerlikPuani - a.benzerlikPuani;
    if (olcut === "kalicilik") return b.kalicilikPuani - a.kalicilikPuani || b.benzerlikPuani - a.benzerlikPuani;
    return b.benzerlikPuani - a.benzerlikPuani || a.fiyat - b.fiyat;
  });
}

function Puan({ etiket, deger }: { etiket: string; deger: number }) {
  return (
    <div>
      <p className="mb-1 flex justify-between text-xs text-buhar">
        <span>{etiket}</span>
        <span className="tabular-nums">{deger}/10</span>
      </p>
      <div className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < deger ? "bg-murekkep" : "bg-cizgi"}`} />
        ))}
      </div>
    </div>
  );
}

const BOS_FORM = { markaId: "0", kod: "", fiyat: "", urunLinki: "", kalicilikPuani: "5", benzerlikPuani: "5" };

export default function ParfumDetay({ adminMi }: { adminMi: boolean }) {
  const { id } = useParams();
  const auth = useAuth();
  const token = auth.user?.access_token;

  const [parfum, setParfum] = useState<ParfumDetayVeri | null>(null);
  const [olcut, setOlcut] = useState<Olcut>("benzerlik");
  const [hata, setHata] = useState("");
  const [muadilMarkalar, setMuadilMarkalar] = useState<Marka[]>([]);
  const [form, setForm] = useState(BOS_FORM);

  async function yukle() {
    setParfum(await apiIstek<ParfumDetayVeri>(`/api/parfumler/${id}`));
  }

  useEffect(() => {
    yukle().catch((e) => setHata(e.message));
  }, [id]);

  useEffect(() => {
    if (!adminMi) return;
    apiIstek<Marka[]>("/api/markalar?tur=Muadil").then(setMuadilMarkalar).catch((e) => setHata(e.message));
  }, [adminMi]);

  function alan(ad: keyof typeof BOS_FORM) {
    return {
      value: form[ad],
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [ad]: e.target.value })),
    };
  }

  async function muadilEkle(e: FormEvent) {
    e.preventDefault();
    setHata("");
    try {
      await apiIstek(`/api/parfumler/${id}/muadiller`, token, {
        method: "POST",
        body: JSON.stringify({
          markaId: Number(form.markaId),
          kod: form.kod,
          fiyat: Number(form.fiyat),
          urunLinki: form.urunLinki,
          kalicilikPuani: Number(form.kalicilikPuani),
          benzerlikPuani: Number(form.benzerlikPuani),
        }),
      });
      setForm({ ...BOS_FORM, markaId: form.markaId });
      await yukle();
    } catch (err) {
      setHata((err as Error).message);
    }
  }

  async function muadilSil(m: Muadil) {
    if (!confirm(`${m.marka} ${m.kod} silinsin mi?`)) return;
    try {
      await apiIstek(`/api/muadiller/${m.id}`, token, { method: "DELETE" });
      await yukle();
    } catch (err) {
      setHata((err as Error).message);
    }
  }

  async function gorselYukle(e: ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    setHata("");
    try {
      const veri = new FormData();
      veri.append("dosya", dosya);
      await apiIstek(`/api/parfumler/${id}/gorsel`, token, { method: "POST", body: veri });
      await yukle();
    } catch (err) {
      setHata((err as Error).message);
    } finally {
      e.target.value = "";
    }
  }

  if (!parfum) {
    return <p className="text-buhar">{hata ? "Bu parfüm bulunamadı. Aramaya dönüp tekrar dene." : "Yükleniyor..."}</p>;
  }

  const gorsel = gorselAdresi(parfum.gorselUrl);

  return (
    <article>
      <Link to="/" className="text-sm text-buhar hover:text-murekkep">
        ← Aramaya dön
      </Link>

      <header className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end">
        {gorsel && (
          <img src={gorsel} alt={parfum.ad} className="h-48 w-48 shrink-0 rounded-lg bg-white object-contain" />
        )}
        <div>
          <h1 className="font-baslik text-5xl leading-none">{parfum.ad}</h1>
          <p className="mt-2 text-buhar">{parfum.marka}</p>
        </div>
      </header>

      <section aria-label="Nota piramidi" className="mt-10 flex flex-col items-center gap-1">
        {PIRAMIT.map((p) => {
          const notalar = parfum.notalar.filter((n) => n.katman === p.katman);
          if (notalar.length === 0) return null;
          return (
            <div key={p.katman} className={`${p.sinif} rounded-md px-4 py-3 text-center`}>
              <p className="text-xs opacity-75">{p.etiket}</p>
              <p className="font-baslik text-xl">{notalar.map((n) => n.notaAd).join(", ")}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-baslik text-3xl">Muadiller</h2>
          {parfum.muadiller.length > 1 && (
            <div role="group" aria-label="Sıralama" className="flex gap-1 rounded-full border border-cizgi p-1 text-sm">
              {OLCUTLER.map((o) => (
                <button
                  key={o.deger}
                  aria-pressed={olcut === o.deger}
                  onClick={() => setOlcut(o.deger)}
                  className={`rounded-full px-3 py-1 ${olcut === o.deger ? "bg-murekkep text-cam" : "text-buhar hover:text-murekkep"}`}
                >
                  {o.etiket}
                </button>
              ))}
            </div>
          )}
        </div>

        {parfum.muadiller.length === 0 ? (
          <p className="mt-4 text-buhar">Bu parfüm için henüz muadil eklenmedi.</p>
        ) : (
          <ul className="mt-4 divide-y divide-cizgi">
            {sirala(parfum.muadiller, olcut).map((m) => (
              <li key={m.id} className="py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-baslik text-2xl">
                    {m.marka} {m.kod}
                  </p>
                  <p className="shrink-0 text-lg tabular-nums">{tl(m.fiyat)}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 sm:max-w-sm">
                  <Puan etiket="Benzerlik" deger={m.benzerlikPuani} />
                  <Puan etiket="Kalıcılık" deger={m.kalicilikPuani} />
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <a
                    href={m.urunLinki}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium underline underline-offset-4"
                  >
                    Mağazada gör<span className="sr-only"> (yeni sekmede açılır)</span>
                  </a>
                  {adminMi && (
                    <button onClick={() => muadilSil(m)} className={BUTON_SADE}>
                      Sil
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {adminMi && (
        <section className="mt-16 space-y-6 border-t border-cizgi pt-6">
          <h2 className="font-baslik text-2xl">Yönetim</h2>

          <label className="block text-sm">
            Görsel {parfum.gorselUrl ? "değiştir" : "yükle"}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={gorselYukle} className="mt-1 block" />
          </label>

          <form onSubmit={muadilEkle} className="grid gap-3 sm:grid-cols-2">
            <h3 className="font-baslik text-xl sm:col-span-2">Muadil ekle</h3>
            <select {...alan("markaId")} className={ALAN}>
              <option value="0">Muadil markası seç</option>
              {muadilMarkalar.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.ad}
                </option>
              ))}
            </select>
            <input {...alan("kod")} placeholder="Kod (ör. 567)" className={ALAN} />
            <input {...alan("fiyat")} type="number" step="0.01" placeholder="Fiyat (50 ml)" className={ALAN} />
            <input {...alan("urunLinki")} type="url" placeholder="https://..." className={ALAN} />
            <label className="text-sm">
              Kalıcılık (1-10)
              <input {...alan("kalicilikPuani")} type="number" min={1} max={10} className={`${ALAN} mt-1`} />
            </label>
            <label className="text-sm">
              Benzerlik (1-10)
              <input {...alan("benzerlikPuani")} type="number" min={1} max={10} className={`${ALAN} mt-1`} />
            </label>
            <button type="submit" className={`${BUTON} sm:col-span-2`}>
              Muadili ekle
            </button>
          </form>
        </section>
      )}

      <HataMesaji mesaj={hata} />
    </article>
  );
}
