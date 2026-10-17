import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../../api/client";
import { gorselAdresi } from "../../gorsel";
import type { MarkaTuru } from "../../types";
import { ALAN, BUTON, BUTON_SADE, HataMesaji } from "../ui";

type Kayit = { id: number; ad: string; tur?: MarkaTuru; gorselUrl?: string | null; aciklama?: string | null };

type Props = {
  uc: string;        // "/api/markalar" ya da "/api/notalar"
  tekil: string;      // ekranda görünen ad: "marka", "nota"
  turlu?: boolean;    // markaların türü var, notaların yok
  gorselli?: boolean; // görsel yükleme alanı: markada logo, notada nota görseli
  gorselAdi?: string; // yükleme düğmesindeki ad: "Logo", "Görsel"
  topluGorsel?: boolean; // çok dosyayı bir seferde yükle; dosya adı kaydın adıyla eşleşir (yalnız notalar)
  aciklamali?: boolean; // kısa açıklama alanı (notalar sayfasında görünür; yalnız notalar)
};

type TopluSonuc = { dosya: string; durum: "yuklendi" | "eslesmedi" | "hatali"; nota: string | null; mesaj: string | null };

// Sunucu tek istekte en fazla 10 dosya kabul eder
const TOPLU_PAKET = 10;

function Logo({ url }: { url: string | null | undefined }) {
  const [yuklenemedi, setYuklenemedi] = useState(false);
  const adres = gorselAdresi(url ?? null);
  if (!adres || yuklenemedi) return null;
  return (
    <img
      src={adres}
      alt=""
      className="h-6 w-6 shrink-0 rounded-full bg-white object-contain"
      onError={() => setYuklenemedi(true)}
    />
  );
}

function TopluSonucu({ sonuclar }: { sonuclar: TopluSonuc[] }) {
  const yuklenen = sonuclar.filter((s) => s.durum === "yuklendi").length;
  const eslesmeyen = sonuclar.filter((s) => s.durum === "eslesmedi");
  const hatali = sonuclar.filter((s) => s.durum === "hatali");
  return (
    <div role="status" className="mt-4 rounded-lg border border-cizgi bg-white p-4 text-sm">
      <p className="font-medium">{yuklenen} görsel yüklendi.</p>
      {eslesmeyen.length > 0 && (
        <p className="mt-2">
          <span className="text-buhar">Eşleşmeyen dosyalar ({eslesmeyen.length}), bu adda nota yok: </span>
          {eslesmeyen.map((s) => s.dosya).join(", ")}
        </p>
      )}
      {hatali.length > 0 && (
        <ul className="mt-2 space-y-1 text-red-700">
          {hatali.map((s) => (
            <li key={s.dosya}>
              {s.dosya}: {s.mesaj}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SozlukYonetimi({
  uc,
  tekil,
  turlu = false,
  gorselli = false,
  gorselAdi = "Logo",
  topluGorsel = false,
  aciklamali = false,
}: Props) {
  const token = useAuth().user?.access_token;
  const [kayitlar, setKayitlar] = useState<Kayit[]>([]);
  const [topluSonuc, setTopluSonuc] = useState<TopluSonuc[] | null>(null);
  const [topluCalisiyor, setTopluCalisiyor] = useState(false);
  const [yeniAd, setYeniAd] = useState("");
  const [yeniAciklama, setYeniAciklama] = useState("");
  const [yeniTur, setYeniTur] = useState<MarkaTuru>("Orijinal");
  const [duzenlenen, setDuzenlenen] = useState<Kayit | null>(null);
  const [hata, setHata] = useState("");

  async function yukle() {
    setKayitlar(await apiIstek<Kayit[]>(uc));
  }

  useEffect(() => {
    yukle().catch((e) => setHata(e.message));
  }, [uc]);

  const govde = (ad: string, tur?: MarkaTuru, aciklama?: string | null) =>
    JSON.stringify({ ad, ...(turlu && { tur }), ...(aciklamali && { aciklama: aciklama ?? "" }) });

  // Ekleme ve güncelleme aynı kalıpla çalışır: işlemi yap, listeyi yenile, hatayı göster
  async function calistir(islem: () => Promise<unknown>) {
    setHata("");
    try {
      await islem();
      await yukle();
      return true;
    } catch (e) {
      setHata((e as Error).message);
      return false;
    }
  }

  async function ekle(e: FormEvent) {
    e.preventDefault();
    const tamam = await calistir(() => apiIstek(uc, token, { method: "POST", body: govde(yeniAd, yeniTur, yeniAciklama) }));
    if (tamam) {
      setYeniAd("");
      setYeniAciklama("");
    }
  }

  async function kaydet(e: FormEvent) {
    e.preventDefault();
    if (!duzenlenen) return;
    const { id, ad, tur, aciklama } = duzenlenen;
    const tamam = await calistir(() => apiIstek(`${uc}/${id}`, token, { method: "PUT", body: govde(ad, tur, aciklama) }));
    if (tamam) setDuzenlenen(null);
  }

  function escIleVazgec(e: KeyboardEvent) {
    if (e.key === "Escape") setDuzenlenen(null);
  }

  async function gorselYukle(e: ChangeEvent<HTMLInputElement>, id: number) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    setHata("");
    try {
      const veri = new FormData();
      veri.append("dosya", dosya);
      await apiIstek(`${uc}/${id}/gorsel`, token, { method: "POST", body: veri });
      await yukle();
    } catch (err) {
      setHata((err as Error).message);
    } finally {
      e.target.value = "";
    }
  }

  async function topluGorselYukle(e: ChangeEvent<HTMLInputElement>) {
    const dosyalar = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (dosyalar.length === 0) return;

    setHata("");
    setTopluSonuc(null);
    setTopluCalisiyor(true);
    const sonuclar: TopluSonuc[] = [];
    try {
      for (let i = 0; i < dosyalar.length; i += TOPLU_PAKET) {
        const veri = new FormData();
        dosyalar.slice(i, i + TOPLU_PAKET).forEach((d) => veri.append("dosyalar", d));
        sonuclar.push(...(await apiIstek<TopluSonuc[]>(`${uc}/gorseller`, token, { method: "POST", body: veri })));
      }
    } catch (err) {
      setHata((err as Error).message);
    } finally {
      // Hata ortada çıksa da o ana kadar yüklenenler gösterilir
      setTopluSonuc(sonuclar);
      setTopluCalisiyor(false);
      yukle().catch((err) => setHata(err.message));
    }
  }

  const turSecimi = (deger: MarkaTuru | undefined, degistir: (t: MarkaTuru) => void) => (
    <select value={deger} onChange={(e) => degistir(e.target.value as MarkaTuru)} aria-label="Tür" className={`${ALAN} w-auto`}>
      <option value="Orijinal">Orijinal</option>
      <option value="Muadil">Muadil</option>
    </select>
  );

  return (
    <section>
      <form onSubmit={ekle} className="flex flex-wrap gap-2">
        <input
          value={yeniAd}
          onChange={(e) => setYeniAd(e.target.value)}
          placeholder={`Yeni ${tekil} adı`}
          aria-label={`Yeni ${tekil} adı`}
          className={`${ALAN} min-w-48 flex-1`}
        />
        {turlu && turSecimi(yeniTur, setYeniTur)}
        {aciklamali && (
          <textarea
            value={yeniAciklama}
            onChange={(e) => setYeniAciklama(e.target.value)}
            placeholder="Kısa açıklama (notalar sayfasında görünür)"
            aria-label={`Yeni ${tekil} açıklaması`}
            maxLength={500}
            rows={2}
            className={`${ALAN} basis-full`}
          />
        )}
        <button type="submit" className={BUTON}>Ekle</button>
      </form>

      {gorselli && topluGorsel && (
        <div className="mt-4">
          <label className={`${BUTON_SADE} cursor-pointer underline underline-offset-4`}>
            {topluCalisiyor ? "Görseller yükleniyor..." : "Toplu görsel yükle"}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={topluGorselYukle}
              disabled={topluCalisiyor}
              className="hidden"
            />
          </label>
          <p className="mt-1 text-sm text-buhar">
            Dosya adı {tekil} adı olmalı: vanilya.png, kayisi-cicegi.webp. Büyük-küçük harf ve Türkçe karakter fark etmez.
            Her görsel en fazla 2 MB.
          </p>
        </div>
      )}

      {topluSonuc && <TopluSonucu sonuclar={topluSonuc} />}

      <HataMesaji mesaj={hata} />

      <ul className="mt-6 divide-y divide-cizgi">
        {kayitlar.map((k) => (
          <li key={k.id} className="py-3">
            {duzenlenen?.id === k.id ? (
              <form onSubmit={kaydet} onKeyDown={escIleVazgec} className="flex flex-wrap items-center gap-2">
                <input
                  autoFocus
                  value={duzenlenen.ad}
                  onChange={(e) => setDuzenlenen((d) => d && { ...d, ad: e.target.value })}
                  aria-label={`${tekil} adı`}
                  className={`${ALAN} min-w-48 flex-1`}
                />
                {turlu && turSecimi(duzenlenen.tur, (t) => setDuzenlenen((d) => d && { ...d, tur: t }))}
                {aciklamali && (
                  <textarea
                    value={duzenlenen.aciklama ?? ""}
                    onChange={(e) => setDuzenlenen((d) => d && { ...d, aciklama: e.target.value })}
                    aria-label={`${tekil} açıklaması`}
                    maxLength={500}
                    rows={2}
                    className={`${ALAN} basis-full`}
                  />
                )}
                <button type="submit" className={BUTON}>Kaydet</button>
                <button type="button" onClick={() => setDuzenlenen(null)} className={BUTON_SADE}>Vazgeç</button>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <span className="flex min-w-0 items-center gap-2">
                  {gorselli && <Logo url={k.gorselUrl} />}
                  <span className="min-w-0">
                    {k.ad}
                    {turlu && <span className="ml-2 text-sm text-buhar">{k.tur}</span>}
                    {aciklamali && (
                      <span className={`block truncate text-sm ${k.aciklama ? "text-buhar" : "text-red-700"}`}>
                        {k.aciklama || "açıklama yok"}
                      </span>
                    )}
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  {gorselli && (
                    <label className={`${BUTON_SADE} cursor-pointer`}>
                      {k.gorselUrl ? `${gorselAdi} değiştir` : `${gorselAdi} yükle`}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => gorselYukle(e, k.id)}
                        className="hidden"
                      />
                    </label>
                  )}
                  <button onClick={() => setDuzenlenen(k)} className={BUTON_SADE}>Düzenle</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}