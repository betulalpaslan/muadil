import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { yetkiGerek } from "@/lib/yonetim/oturum";
import { parfumSayfasi } from "@/lib/yonetim/veri";
import { HizliGorsel } from "../_bilesenler/hizli-gorsel";
import { Arama, SayfaBasligi, Sayfalama, Yukleniyor, sorgu } from "../_bilesenler/ortak";

export const metadata: Metadata = { title: "Parfümler" };

export default function ParfumListesi({ searchParams }: PageProps<"/yonetim/parfumler">) {
  return (
    <Suspense fallback={<Yukleniyor />}>
      <Icerik searchParams={searchParams} />
    </Suspense>
  );
}

async function Icerik({ searchParams }: { searchParams: PageProps<"/yonetim/parfumler">["searchParams"] }) {
  await yetkiGerek();
  const { q, sayfa, gorselsiz, silinen } = await sorgu(searchParams);
  const { satirlar, toplam } = await parfumSayfasi({ q, sayfa, gorselsiz, silinen });

  return (
    <>
      <SayfaBasligi baslik="Parfümler" aciklama="Orijinal parfümler. Muadiller bir parfüme bağlanır.">
        <Link href="/yonetim/parfumler/yeni" className="dugme y-btn">
          Parfüm ekle
        </Link>
      </SayfaBasligi>
      <Arama yol="/yonetim/parfumler" q={q} gorselsiz={gorselsiz} silinen={silinen} yer="Marka ya da parfüm ara" />
      <div className="y-kart overflow-x-auto" style={{ padding: 0 }}>
        <table className="y-tablo">
          <thead>
            <tr>
              <th>Görsel</th>
              <th>Parfüm</th>
              <th>Muadil</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {satirlar.map((p) => (
              <tr key={p.id}>
                <td>
                  <HizliGorsel tur="parfum" id={p.id} gorselUrl={p.gorselUrl} ad={`${p.markaAd} ${p.ad}`} />
                </td>
                <td>
                  <Link href={`/yonetim/parfumler/${p.id}`} className="font-bold">
                    {p.ad}
                  </Link>
                  <div className="y-ipucu" style={{ marginTop: 0 }}>
                    {p.markaAd}
                  </div>
                </td>
                <td>{p.muadilSayisi}</td>
                <td className="text-right">
                  <Link href={`/yonetim/muadiller/yeni?parfum=${p.id}`} className="y-ikincil">
                    Muadil ekle
                  </Link>
                </td>
              </tr>
            ))}
            {satirlar.length === 0 && (
              <tr>
                <td colSpan={4} className="y-ipucu">
                  Kayıt yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Sayfalama toplam={toplam} sayfa={sayfa} yol="/yonetim/parfumler" parametreler={{ q, gorselsiz: gorselsiz ? "1" : undefined, silinen: silinen ? "1" : undefined }} />
    </>
  );
}
