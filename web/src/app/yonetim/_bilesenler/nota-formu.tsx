import { notaKaydet } from "../actions";
import { YonetimFormu } from "./form";
import { GorselAlani } from "./gorsel-alani";
import { Alan } from "./ortak";

export function NotaFormu({ kayit }: { kayit?: { id: number; ad: string; aciklama: string | null; gorselUrl: string | null } }) {
  return (
    // key: görsel kaydedilince aynı sayfaya dönülür; form yeniden kurulsun ki dosya seçici eski dosyayı tutmasın.
    <YonetimFormu key={kayit?.gorselUrl ?? "gorselsiz"} action={notaKaydet.bind(null, kayit?.id ?? null)} etiket={kayit ? "Değişiklikleri kaydet" : "Notayı ekle"}>
      <div className="y-kart space-y-5">
        <Alan etiket="Nota adı" htmlFor="ad" ipucu="Yazım otomatik düzenlenir (ör. “PEMBE biber” → “Pembe biber”). Adres (slug) değişmez.">
          <input id="ad" name="ad" required maxLength={100} defaultValue={kayit?.ad} placeholder="ör. Vanilya" className="y-girdi" />
        </Alan>
        <Alan etiket="Açıklama (isteğe bağlı)" htmlFor="aciklama" ipucu="Nota sayfasında gösterilir.">
          <textarea id="aciklama" name="aciklama" rows={4} maxLength={2000} defaultValue={kayit?.aciklama ?? ""} className="y-girdi" />
        </Alan>
        <GorselAlani mevcut={kayit?.gorselUrl ?? null} etiket="Nota görseli" />
      </div>
    </YonetimFormu>
  );
}
