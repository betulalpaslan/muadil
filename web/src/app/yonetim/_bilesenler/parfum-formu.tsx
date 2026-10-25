import { CINSIYET_ADI } from "@/lib/site";
import { parfumKaydet } from "../actions";
import { YonetimFormu } from "./form";
import { GorselAlani } from "./gorsel-alani";
import { NotaSecici } from "./nota-secici";
import { Alan } from "./ortak";

type Kayit = {
  id: number;
  ad: string;
  markaAd: string;
  cinsiyet: "kadin" | "erkek" | "unisex";
  gorselUrl: string | null;
  renk: string | null;
  notalar: { ust: string[]; orta: string[]; alt: string[] };
};

export function ParfumFormu({ kayit, markalar, notalar }: { kayit?: Kayit; markalar: string[]; notalar: string[] }) {
  return (
    // key: görsel kaydedilince aynı sayfaya dönülür; form yeniden kurulsun ki dosya seçici eski dosyayı tutmasın.
    <YonetimFormu key={kayit?.gorselUrl ?? "gorselsiz"} action={parfumKaydet.bind(null, kayit?.id ?? null)} etiket={kayit ? "Değişiklikleri kaydet" : "Parfümü ekle"}>
      <div className="y-kart space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Alan etiket="Marka" htmlFor="marka" ipucu="Kayıtlı bir marka seç ya da yeni marka yaz; yoksa oluşturulur.">
            <input id="marka" name="marka" required maxLength={100} list="marka-listesi" defaultValue={kayit?.markaAd} placeholder="ör. Yves Saint Laurent" className="y-girdi" />
            <datalist id="marka-listesi">
              {markalar.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Alan>
          <Alan etiket="Parfüm adı" htmlFor="ad">
            <input id="ad" name="ad" required maxLength={200} defaultValue={kayit?.ad} placeholder="ör. Libre" className="y-girdi" />
          </Alan>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Alan etiket="Cinsiyet" htmlFor="cinsiyet">
            <select id="cinsiyet" name="cinsiyet" defaultValue={kayit?.cinsiyet ?? "unisex"} className="y-girdi">
              {Object.entries(CINSIYET_ADI).map(([d, ad]) => (
                <option key={d} value={d}>
                  {ad}
                </option>
              ))}
            </select>
          </Alan>
          <Alan etiket="Şişe rengi (isteğe bağlı)" htmlFor="renk" ipucu="Görsel yokken şişe çizimi bu renkle çıkar.">
            <input id="renk" name="renk" type="text" pattern="#[0-9a-fA-F]{6}" placeholder="#c8a46a" defaultValue={kayit?.renk ?? ""} className="y-girdi" />
          </Alan>
        </div>
        <GorselAlani mevcut={kayit?.gorselUrl ?? null} etiket="Parfüm görseli" />
      </div>
      <div className="y-kart">
        <NotaSecici baslangic={kayit?.notalar ?? { ust: [], orta: [], alt: [] }} mevcut={notalar} />
      </div>
    </YonetimFormu>
  );
}
