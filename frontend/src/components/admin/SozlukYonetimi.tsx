import { useEffect, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../../api/client";
import type { MarkaTuru } from "../../types";
import { ALAN, BUTON, BUTON_SADE, HataMesaji } from "../ui";

type Kayit = { id: number; ad: string; tur?: MarkaTuru };

type Props = {
  uc: string;       // "/api/markalar" ya da "/api/notalar"
  tekil: string;    // ekranda görünen ad: "marka", "nota"
  turlu?: boolean;  // markaların türü var, notaların yok
};

export default function SozlukYonetimi({ uc, tekil, turlu = false }: Props) {
  const token = useAuth().user?.access_token;
  const [kayitlar, setKayitlar] = useState<Kayit[]>([]);
  const [yeniAd, setYeniAd] = useState("");
  const [yeniTur, setYeniTur] = useState<MarkaTuru>("Orijinal");
  const [duzenlenen, setDuzenlenen] = useState<Kayit | null>(null);
  const [hata, setHata] = useState("");

  async function yukle() {
    setKayitlar(await apiIstek<Kayit[]>(uc));
  }

  useEffect(() => {
    yukle().catch((e) => setHata(e.message));
  }, [uc]);

  const govde = (ad: string, tur?: MarkaTuru) => JSON.stringify(turlu ? { ad, tur } : { ad });

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
    const tamam = await calistir(() => apiIstek(uc, token, { method: "POST", body: govde(yeniAd, yeniTur) }));
    if (tamam) setYeniAd("");
  }

  async function kaydet(e: FormEvent) {
    e.preventDefault();
    if (!duzenlenen) return;
    const { id, ad, tur } = duzenlenen;
    const tamam = await calistir(() => apiIstek(`${uc}/${id}`, token, { method: "PUT", body: govde(ad, tur) }));
    if (tamam) setDuzenlenen(null);
  }

  function escIleVazgec(e: KeyboardEvent) {
    if (e.key === "Escape") setDuzenlenen(null);
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
        <button type="submit" className={BUTON}>Ekle</button>
      </form>

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
                <button type="submit" className={BUTON}>Kaydet</button>
                <button type="button" onClick={() => setDuzenlenen(null)} className={BUTON_SADE}>Vazgeç</button>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <span>
                  {k.ad}
                  {turlu && <span className="ml-2 text-sm text-buhar">{k.tur}</span>}
                </span>
                <button onClick={() => setDuzenlenen(k)} className={BUTON_SADE}>Düzenle</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}