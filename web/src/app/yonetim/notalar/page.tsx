import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { yetkiGerek } from "@/lib/yonetim/oturum";
import { notaSayfasi } from "@/lib/yonetim/veri";
import { HizliGorsel } from "../_bilesenler/hizli-gorsel";
import { Arama, SayfaBasligi, Sayfalama, Yukleniyor, sorgu } from "../_bilesenler/ortak";

export const metadata: Metadata = { title: "Notalar" };

export default function NotaListesi({ searchParams }: PageProps<"/yonetim/notalar">) {
  return (
    <Suspense fallback={<Yukleniyor />}>
      <Icerik searchParams={searchParams} />
    </Suspense>
  );
}

async function Icerik({ searchParams }: { searchParams: PageProps<"/yonetim/notalar">["searchParams"] }) {
  await yetkiGerek();
  const { q, sayfa, gorselsiz } = await sorgu(searchParams);
  const { satirlar, toplam } = await notaSayfasi({ q, sayfa, gorselsiz });

  return (
    <>
      <SayfaBasligi baslik="Notalar" aciklama="Parfüm eklerken yeni yazılan notalar burada otomatik oluşur; görsellerini buradan ekle.">
        <Link href="/yonetim/notalar/yeni" className="dugme y-btn">
          Nota ekle
        </Link>
      </SayfaBasligi>
      <Arama yol="/yonetim/notalar" q={q} gorselsiz={gorselsiz} yer="Nota ara" />
      <div className="y-kart overflow-x-auto" style={{ padding: 0 }}>
        <table className="y-tablo">
          <thead>
            <tr>
              <th>Görsel</th>
              <th>Nota</th>
              <th>Parfüm sayısı</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.map((n) => (
              <tr key={n.id}>
                <td>
                  <HizliGorsel tur="nota" id={n.id} gorselUrl={n.gorselUrl} ad={n.ad} />
                </td>
                <td>
                  <Link href={`/yonetim/notalar/${n.id}`} className="font-bold">
                    {n.ad}
                  </Link>
                </td>
                <td className="tabular-nums">{n.parfumSayisi}</td>
              </tr>
            ))}
            {satirlar.length === 0 && (
              <tr>
                <td colSpan={3} className="y-ipucu">
                  Kayıt yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Sayfalama toplam={toplam} sayfa={sayfa} yol="/yonetim/notalar" parametreler={{ q, gorselsiz: gorselsiz ? "1" : undefined }} />
    </>
  );
}
