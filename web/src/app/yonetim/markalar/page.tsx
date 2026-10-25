import type { Metadata } from "next";
import { Suspense } from "react";
import { yetkiGerek } from "@/lib/yonetim/oturum";
import { markaSayfasi } from "@/lib/yonetim/veri";
import { HizliGorsel } from "../_bilesenler/hizli-gorsel";
import { SayfaBasligi, Yukleniyor, sorgu } from "../_bilesenler/ortak";

export const metadata: Metadata = { title: "Markalar" };

export default function MarkaListesi({ searchParams }: PageProps<"/yonetim/markalar">) {
  return (
    <Suspense fallback={<Yukleniyor />}>
      <Icerik searchParams={searchParams} />
    </Suspense>
  );
}

async function Icerik({ searchParams }: { searchParams: PageProps<"/yonetim/markalar">["searchParams"] }) {
  await yetkiGerek();
  const { gorselsiz } = await sorgu(searchParams);
  const markalar = await markaSayfasi({ gorselsiz });
  const gruplar = [
    { baslik: "Orijinal markalar", liste: markalar.filter((m) => m.tur === "orijinal") },
    { baslik: "Muadil markalar", liste: markalar.filter((m) => m.tur === "muadil") },
  ];

  return (
    <>
      <SayfaBasligi baslik="Markalar" aciklama="Markalar parfüm ya da muadil eklerken otomatik oluşur. Buradan logosunu ekle." />
      <form action="/yonetim/markalar" className="mb-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="gorselsiz" value="1" defaultChecked={gorselsiz} /> Logosu olmayanlar
        </label>
        <button type="submit" className="y-ikincil mt-2">
          Süz
        </button>
      </form>
      {gruplar.map(({ baslik, liste }) => (
        <section key={baslik} className="mb-8">
          <h2 className="genis mb-3 text-xl">
            {baslik} ({liste.length})
          </h2>
          <div className="y-kart overflow-x-auto" style={{ padding: 0 }}>
            <table className="y-tablo">
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Marka</th>
                  <th>Kayıt</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <HizliGorsel tur="marka" id={m.id} gorselUrl={m.gorselUrl} ad={m.ad} />
                    </td>
                    <td className="font-bold">{m.ad}</td>
                    <td className="tabular-nums">{m.kayitSayisi}</td>
                  </tr>
                ))}
                {liste.length === 0 && (
                  <tr>
                    <td colSpan={3} className="y-ipucu">
                      Kayıt yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
