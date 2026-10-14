import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../api/client";
import { gorselAdresi } from "../gorsel";
import { tl } from "../para";
import { gercekRenk, pastel } from "../tasarim/renk";
import type { Cinsiyet, Marka, Muadil, ParfumDetayVeri } from "../types";
import { Footer } from "./OrtakYerlesim";
import Asterisk from "./tasarim/Asterisk";
import Cerceve from "./tasarim/Cerceve";
import NotaSprey from "./tasarim/NotaSprey";
import ParfumSisesi from "./tasarim/ParfumSisesi";
import { HataMesaji } from "./ui";

type Olcut = "benzerlik" | "fiyat" | "kalicilik";

const OLCUTLER: { deger: Olcut; etiket: string }[] = [
  { deger: "benzerlik", etiket: "En benzer" },
  { deger: "fiyat", etiket: "En uygun" },
  { deger: "kalicilik", etiket: "En kalıcı" },
];

// Kart zeminleri sırayla yuzey, vurgu ve yazi renginde (TASARIM.md §6).
const KART_ZEMIN = ["bg-yuzey text-yazi", "bg-vurgu text-zemin", "bg-yazi text-zemin"];

function sirala(liste: Muadil[], olcut: Olcut): Muadil[] {
  return [...liste].sort((a, b) => {
    if (olcut === "fiyat") return a.fiyat - b.fiyat || b.benzerlikPuani - a.benzerlikPuani;
    if (olcut === "kalicilik") return b.kalicilikPuani - a.kalicilikPuani || b.benzerlikPuani - a.benzerlikPuani;
    return b.benzerlikPuani - a.benzerlikPuani || a.fiyat - b.fiyat;
  });
}

function Ok({ boyut = 12 }: { boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 15L15 5M7 5h8v8" fill="none" stroke="currentColor" strokeWidth={2.6} />
    </svg>
  );
}

function OkDairesi({ boyut = 46 }: { boyut?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-yazi bg-vurgu"
      style={{ width: boyut, height: boyut }}
    >
      <svg width={boyut * 0.4} height={boyut * 0.4} viewBox="0 0 20 20">
        <path d="M5 15L15 5M7 5h8v8" fill="none" strokeWidth={2.6} strokeLinecap="square" style={{ stroke: "var(--si)" }} />
      </svg>
    </span>
  );
}

function MarkaRozeti({ marka, url }: { marka: string; url: string | null }) {
  const [yuklenemedi, setYuklenemedi] = useState(false);
  const adres = gorselAdresi(url);
  return (
    <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F2EEE8]">
      {adres && !yuklenemedi ? (
        <img src={adres} alt="" className="h-full w-full object-contain" onError={() => setYuklenemedi(true)} />
      ) : (
        <span className="text-xl font-extrabold text-[#0B0B0B]">{marka.slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}

function KopyalaDugmesi({ kod, fiyat }: { kod: string; fiyat: number }) {
  const [kopyalandi, setKopyalandi] = useState(false);

  async function kopyala() {
    try {
      await navigator.clipboard.writeText(kod);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      // pano erişimi yoksa sessizce yok say
    }
  }

  return (
    <button
      type="button"
      onClick={kopyala}
      className="cizgili flex min-h-14 flex-1 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-yazi bg-transparent text-yazi"
    >
      <span className="text-[10px] tracking-[0.08em]" aria-live="polite">
        {kopyalandi ? "kopyalandı ✓" : `${tl(fiyat)} · 50 ml`}
      </span>
    </button>
  );
}

const BOS_FORM = { markaId: "0", kod: "", cinsiyet: "Unisex", fiyat: "", urunLinki: "", kalicilikPuani: "5", benzerlikPuani: "5" };
const CINSIYETLER: { deger: Cinsiyet; etiket: string }[] = [
  { deger: "Unisex", etiket: "Unisex" },
  { deger: "Kadin", etiket: "Kadın" },
  { deger: "Erkek", etiket: "Erkek" },
];

const YONETIM_ALAN =
  "h-11 min-w-0 rounded-full border-[1.5px] border-yazi bg-transparent px-4 text-sm text-yazi placeholder:text-soluk focus:outline-none";

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
          cinsiyet: form.cinsiyet,
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
    return <p className="p-10 text-center text-sm">{hata ? "Bu parfüm bulunamadı. Aramaya dönüp tekrar dene." : "Yükleniyor..."}</p>;
  }

  const gorsel = gorselAdresi(parfum.gorselUrl);
  const enUcuzFiyat = parfum.muadiller.length ? Math.min(...parfum.muadiller.map((m) => m.fiyat)) : null;
  const enUcuzId = parfum.muadiller.length
    ? parfum.muadiller.reduce((a, b) => (b.fiyat < a.fiyat ? b : a)).id
    : null;
  const siraliMuadiller = sirala(parfum.muadiller, olcut);

  return (
    <article>
      <section className="flex flex-col gap-5 px-[clamp(16px,5vw,70px)] pt-10 pb-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="kucuk inline-flex min-h-11 items-center text-yazi no-underline">
            ← tüm parfümler
          </Link>
          <span className="text-[13px] font-bold tracking-[0.08em]">01</span>
        </div>
        <h1 className="genis m-0 text-[clamp(26px,3.2vw,42px)] leading-[1.15] font-extrabold [word-spacing:.2em]">{parfum.ad}</h1>

        <div className="flex flex-wrap items-start gap-[clamp(24px,5vw,64px)]">
          <div className="relative min-w-0 flex-1 basis-[320px] max-w-[440px]">
            <Cerceve sol={`${parfum.marka} · ${parfum.ad}`} sag="no. 01">
              <div
                className="flex aspect-[4/5] items-center justify-center overflow-hidden"
                style={{ background: pastel(parfum.renk, 0.8) }}
              >
                {gorsel ? (
                  <img src={gorsel} alt={parfum.ad} className="h-full w-full object-cover" />
                ) : (
                  <ParfumSisesi genislik={150} govde="#0B0B0B" parlak="#F2EEE8" />
                )}
              </div>
            </Cerceve>
            <Asterisk boyut={76} className="absolute top-10 left-[max(-30px,-2vw)] z-[3]" />
          </div>

          <div className="flex min-w-0 flex-1 basis-[380px] flex-col gap-5 overflow-hidden">
            <span className="kucuk inline-flex items-center gap-2.5">
              <span
                className="h-[18px] w-[18px] rounded-full border-[1.5px] border-yazi"
                style={{ background: gercekRenk(parfum.renk) }}
                aria-hidden="true"
              />
              {parfum.marka} · orijinal
            </span>
            <div className="flex items-center gap-[18px]">
              <OkDairesi />
              <span className="genis text-[clamp(18px,2vw,24px)]">
                <span className="text-vurgu">{parfum.muadiller.length} muadil</span> · en uygun{" "}
                {enUcuzFiyat !== null ? tl(enUcuzFiyat) : "-"}
              </span>
            </div>

            <NotaSprey notalar={parfum.notalar} />
          </div>
        </div>
      </section>

      <section id="muadiller" className="relative border-t-[1.5px] border-yazi px-[clamp(16px,5vw,70px)] pt-14 pb-16">
        {parfum.muadiller.length === 0 ? (
          <p className="text-sm">Bu parfüm için henüz muadil eklenmedi.</p>
        ) : (
          <>
            {parfum.muadiller.length > 1 && (
              <label className="mb-6 flex items-center gap-2.5 self-end text-sm font-bold text-yazi">
                Sırala
                <select
                  value={olcut}
                  onChange={(e) => setOlcut(e.target.value as Olcut)}
                  className="cizgili h-11 cursor-pointer rounded-full border-2 border-yazi bg-vurgu px-4 text-sm font-bold text-zemin normal-case"
                >
                  {OLCUTLER.map((o) => (
                    <option key={o.deger} value={o.deger} className="bg-zemin text-yazi">
                      {o.etiket}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="grid min-w-0 gap-[clamp(20px,3vw,40px)]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              {siraliMuadiller.map((m, i) => (
                <div key={m.id} className="flex flex-col gap-5">
                  <div className={`relative box-border flex aspect-[4/3] flex-col justify-between p-4 ${KART_ZEMIN[i % 3]}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold tracking-[0.08em]">{String(i + 2).padStart(2, "0")}</span>
                      {m.id === enUcuzId && (
                        <span className="kucuk rounded-full border-[1.5px] px-2.5 py-[5px] text-[8px]" style={{ borderColor: "currentColor" }}>
                          en uygun
                        </span>
                      )}
                    </div>
                    <span className="flex min-w-0 flex-col items-center gap-2">
                      <MarkaRozeti marka={m.marka} url={m.markaGorselUrl} />
                      <span className="truncate text-[clamp(22px,2.6vw,32px)] leading-none font-extrabold tracking-[0.04em]">
                        {m.kod}
                      </span>
                    </span>
                    <span className="kucuk flex items-center justify-between gap-2 text-[9px]">
                      <span className="truncate">{m.marka}</span>
                      <span className="shrink-0">
                        benzerlik {m.benzerlikPuani} · kalıcılık {m.kalicilikPuani}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <KopyalaDugmesi kod={m.kod} fiyat={m.fiyat} />
                    <a
                      href={m.urunLinki}
                      target="_blank"
                      rel="noopener"
                      aria-label="Mağazaya git"
                      className="cizgili flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[1.5px] border-yazi text-yazi"
                    >
                      <Ok boyut={16} />
                      <span className="sr-only"> (yeni sekmede açılır)</span>
                    </a>
                    {adminMi && (
                      <button
                        type="button"
                        onClick={() => muadilSil(m)}
                        className="kucuk shrink-0 cursor-pointer border-0 bg-transparent text-soluk underline"
                      >
                        sil
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {adminMi && (
        <section className="space-y-6 border-t-[1.5px] border-yazi px-[clamp(16px,5vw,70px)] py-10">
          <h2 className="genis text-xl">Yönetim</h2>

          <label className="kucuk block text-soluk">
            Görsel {parfum.gorselUrl ? "değiştir" : "yükle"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={gorselYukle}
              className="mt-2 block text-sm font-sans text-yazi normal-case"
            />
          </label>

          <form onSubmit={muadilEkle} className="grid gap-3 sm:grid-cols-2">
            <h3 className="genis sm:col-span-2">Muadil ekle</h3>
            <p className="text-sm sm:col-span-2">
              Cinsiyeti yalnız marka aynı kodu kadın ve erkek üründe ayrı ayrı kullanıyorsa değiştir; aksi halde Unisex bırak.
            </p>
            <select {...alan("markaId")} className={`${YONETIM_ALAN} normal-case`}>
              <option value="0" className="bg-zemin">
                Muadil markası seç
              </option>
              {muadilMarkalar.map((m) => (
                <option key={m.id} value={m.id} className="bg-zemin">
                  {m.ad}
                </option>
              ))}
            </select>
            <input {...alan("kod")} placeholder="Kod (ör. 567)" className={YONETIM_ALAN} />
            <select {...alan("cinsiyet")} className={`${YONETIM_ALAN} normal-case`}>
              {CINSIYETLER.map((c) => (
                <option key={c.deger} value={c.deger} className="bg-zemin">
                  {c.etiket}
                </option>
              ))}
            </select>
            <input {...alan("fiyat")} type="number" step="0.01" placeholder="Fiyat (50 ml)" className={YONETIM_ALAN} />
            <input {...alan("urunLinki")} type="url" placeholder="https://..." className={YONETIM_ALAN} />
            <label className="kucuk text-soluk">
              Kalıcılık (1-10)
              <input {...alan("kalicilikPuani")} type="number" min={1} max={10} className={`${YONETIM_ALAN} mt-1 w-full`} />
            </label>
            <label className="kucuk text-soluk">
              Benzerlik (1-10)
              <input {...alan("benzerlikPuani")} type="number" min={1} max={10} className={`${YONETIM_ALAN} mt-1 w-full`} />
            </label>
            <button type="submit" className="cizgili kucuk rounded-full border-[1.5px] border-yazi px-6 py-3 sm:col-span-2">
              Muadili ekle
            </button>
          </form>

          <HataMesaji mesaj={hata} />
        </section>
      )}

      <Footer />
    </article>
  );
}
