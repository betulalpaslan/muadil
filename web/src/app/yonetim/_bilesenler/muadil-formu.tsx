import { CINSIYET_ADI } from "@/lib/site";
import { muadilKaydet } from "../actions";
import { YonetimFormu } from "./form";
import { Alan } from "./ortak";
import { ParfumSecici } from "./parfum-secici";

type Kayit = {
  id: number;
  parfumId: number;
  markaAd: string;
  kod: string;
  cinsiyet: "kadin" | "erkek" | "unisex";
  fiyat: string;
  urunLinki: string;
  kalicilik: number;
  benzerlik: number;
};

export function MuadilFormu({
  kayit,
  baslangicParfumId,
  parfumlar,
  markalar,
}: {
  kayit?: Kayit;
  baslangicParfumId?: number | null;
  parfumlar: { id: number; etiket: string }[];
  markalar: string[];
}) {
  const puanlar = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <YonetimFormu action={muadilKaydet.bind(null, kayit?.id ?? null)} etiket={kayit ? "Değişiklikleri kaydet" : "Muadili ekle"}>
      <div className="y-kart space-y-5">
        <ParfumSecici secenekler={parfumlar} baslangicId={kayit?.parfumId ?? baslangicParfumId} />
        <div className="grid gap-5 md:grid-cols-3">
          <Alan etiket="Muadil markası" htmlFor="marka" ipucu="Kayıtlı marka seç ya da yeni yaz.">
            <input id="marka" name="marka" required maxLength={100} list="marka-listesi" defaultValue={kayit?.markaAd} placeholder="ör. Bargello" className="y-girdi" />
            <datalist id="marka-listesi">
              {markalar.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Alan>
          <Alan etiket="Kod" htmlFor="kod">
            <input id="kod" name="kod" required maxLength={50} defaultValue={kayit?.kod} placeholder="ör. 567" className="y-girdi" />
          </Alan>
          <Alan etiket="Cinsiyet" htmlFor="cinsiyet">
            <select id="cinsiyet" name="cinsiyet" defaultValue={kayit?.cinsiyet ?? "unisex"} className="y-girdi">
              {Object.entries(CINSIYET_ADI).map(([d, ad]) => (
                <option key={d} value={d}>
                  {ad}
                </option>
              ))}
            </select>
          </Alan>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <Alan etiket="Fiyat (TL)" htmlFor="fiyat" ipucu="Fiyat değişirse “son güncelleme” tarihi yenilenir.">
            <input id="fiyat" name="fiyat" required inputMode="decimal" defaultValue={kayit ? String(Number(kayit.fiyat)) : ""} placeholder="650" className="y-girdi" />
          </Alan>
          <Alan etiket="Kalıcılık (1–10)" htmlFor="kalicilik">
            <select id="kalicilik" name="kalicilik" defaultValue={kayit?.kalicilik ?? 5} className="y-girdi">
              {puanlar.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Alan>
          <Alan etiket="Benzerlik (1–10)" htmlFor="benzerlik" ipucu="Sitede yüzde olarak gösterilir (7 → %70).">
            <select id="benzerlik" name="benzerlik" defaultValue={kayit?.benzerlik ?? 5} className="y-girdi">
              {puanlar.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Alan>
        </div>
        <Alan etiket="Ürün linki" htmlFor="urunLinki" ipucu="Satın alma bağlantısı (https://…). Sitede /git/ üzerinden yönlenir.">
          <input id="urunLinki" name="urunLinki" type="url" required maxLength={500} defaultValue={kayit?.urunLinki} placeholder="https://www.trendyol.com/…" className="y-girdi" />
        </Alan>
      </div>
    </YonetimFormu>
  );
}
