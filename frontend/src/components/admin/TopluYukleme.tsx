import { useState } from "react";
import type { ChangeEvent } from "react";
import { useAuth } from "react-oidc-context";
import { ApiHatasi, apiIstek } from "../../api/client";
import { BUTON, BUTON_SADE, HataMesaji } from "../ui";

type Ozet = {
  yeniParfum: number;
  guncellenenParfum: number;
  yeniMuadil: number;
  guncellenenMuadil: number;
  yeniMarka: number;
  yeniNota: number;
  yeniMarkalar: string[];
  yeniNotalar: string[];
};

type SatirHatasi = { sayfa: string; satir: number; mesaj: string };

type Durum =
  | { tur: "bos" }
  | { tur: "hatali"; hatalar: SatirHatasi[] }
  | { tur: "kontrol"; ozet: Ozet }
  | { tur: "yuklendi"; ozet: Ozet };

const SAYILAR: [keyof Ozet, string][] = [
  ["yeniParfum", "Yeni parfüm"],
  ["guncellenenParfum", "Güncellenen parfüm"],
  ["yeniMuadil", "Yeni muadil"],
  ["guncellenenMuadil", "Güncellenen muadil"],
  ["yeniMarka", "Yeni marka"],
  ["yeniNota", "Yeni nota"],
];

function OzetGorunumu({ ozet }: { ozet: Ozet }) {
  return (
    <>
      <dl className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-3">
        {SAYILAR.map(([alan, etiket]) => (
          <div key={alan} className="flex justify-between gap-2">
            <dt className="text-buhar">{etiket}</dt>
            <dd className="tabular-nums">{ozet[alan] as number}</dd>
          </div>
        ))}
      </dl>
      {ozet.yeniMarkalar.length > 0 && (
        <p className="mt-3 text-sm">
          <span className="text-buhar">Yeni markalar: </span>
          {ozet.yeniMarkalar.join(", ")}
        </p>
      )}
      {ozet.yeniNotalar.length > 0 && (
        <p className="mt-1 text-sm">
          <span className="text-buhar">Yeni notalar: </span>
          {ozet.yeniNotalar.join(", ")}
        </p>
      )}
    </>
  );
}

export default function TopluYukleme() {
  const token = useAuth().user?.access_token;
  const [dosya, setDosya] = useState<File | null>(null);
  const [durum, setDurum] = useState<Durum>({ tur: "bos" });
  const [hata, setHata] = useState("");
  const [calisiyor, setCalisiyor] = useState(false);

  function dosyaSec(e: ChangeEvent<HTMLInputElement>) {
    setDosya(e.target.files?.[0] ?? null);
    setDurum({ tur: "bos" });
    setHata("");
  }

  async function gonder(onizleme: boolean) {
    if (!dosya) return;
    setHata("");
    setCalisiyor(true);
    try {
      const veri = new FormData();
      veri.append("dosya", dosya);
      const ozet = await apiIstek<Ozet>(`/api/ice-aktarma?onizleme=${onizleme}`, token, {
        method: "POST",
        body: veri,
      });
      setDurum(onizleme ? { tur: "kontrol", ozet } : { tur: "yuklendi", ozet });
    } catch (e) {
      const hatalar = e instanceof ApiHatasi ? (e.govde as { hatalar?: SatirHatasi[] } | null)?.hatalar : undefined;
      if (hatalar?.length) setDurum({ tur: "hatali", hatalar });
      else setHata((e as Error).message);
    } finally {
      setCalisiyor(false);
    }
  }

  return (
    <section className="space-y-6">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-buhar">
        <li>
          <a href="/sablon/muadil-veri-sablonu.xlsx" download className="text-murekkep underline underline-offset-4">
            Şablonu indir
          </a>
          , Parfümler ve Muadiller sayfalarını doldur.
        </li>
        <li>Dosyayı seç ve kontrol et. Kaydetmeden önce neyin ekleneceğini görürsün.</li>
        <li>Özet doğruysa yüklemeyi onayla.</li>
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <input type="file" accept=".xlsx" onChange={dosyaSec} aria-label="Excel dosyası" className="text-sm" />
        <button onClick={() => gonder(true)} disabled={!dosya || calisiyor} className={BUTON}>
          {calisiyor && durum.tur !== "kontrol" ? "Kontrol ediliyor..." : "Kontrol et"}
        </button>
      </div>

      <HataMesaji mesaj={hata} />

      {durum.tur === "hatali" && (
        <div role="alert">
          <p className="font-medium">
            Dosyada {durum.hatalar.length} sorun var. Hiçbir şey kaydedilmedi; düzeltip tekrar kontrol et.
          </p>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-buhar">
              <tr>
                <th className="py-1 pr-4 font-normal">Sayfa</th>
                <th className="py-1 pr-4 font-normal">Satır</th>
                <th className="py-1 font-normal">Sorun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cizgi">
              {durum.hatalar.map((h, i) => (
                <tr key={i}>
                  <td className="py-2 pr-4">{h.sayfa}</td>
                  <td className="py-2 pr-4 tabular-nums">{h.satir || "–"}</td>
                  <td className="py-2">{h.mesaj}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {durum.tur === "kontrol" && (
        <div className="rounded-lg border border-cizgi bg-white p-5">
          <p className="font-medium">Dosya hatasız. Yüklenince şunlar olacak:</p>
          <OzetGorunumu ozet={durum.ozet} />
          {durum.ozet.yeniNotalar.length > 0 && (
            <p className="mt-3 text-sm text-buhar">
              Yeni notalarda yazım hatası olmadığından emin ol; "Bergamott" gibi bir hata yeni bir nota olarak eklenir.
            </p>
          )}
          <div className="mt-4 flex items-center gap-4">
            <button onClick={() => gonder(false)} disabled={calisiyor} className={BUTON}>
              {calisiyor ? "Yükleniyor..." : "Yüklemeyi onayla"}
            </button>
            <button onClick={() => setDurum({ tur: "bos" })} className={BUTON_SADE}>
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {durum.tur === "yuklendi" && (
        <div role="status" className="rounded-lg border border-cizgi bg-white p-5">
          <p className="font-medium">Yükleme tamamlandı.</p>
          <OzetGorunumu ozet={durum.ozet} />
        </div>
      )}
    </section>
  );
}
