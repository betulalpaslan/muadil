import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CINSIYET_ADI, tl } from "@/lib/site";
import { yetkiGerek } from "@/lib/yonetim/oturum";
import { muadilSayfasi } from "@/lib/yonetim/veri";
import { Arama, SayfaBasligi, Sayfalama, Yukleniyor, sorgu } from "../_bilesenler/ortak";

export const metadata: Metadata = { title: "Muadiller" };

export default function MuadilListesi({ searchParams }: PageProps<"/yonetim/muadiller">) {
  return (
    <Suspense fallback={<Yukleniyor />}>
      <Icerik searchParams={searchParams} />
    </Suspense>
  );
}

async function Icerik({ searchParams }: { searchParams: PageProps<"/yonetim/muadiller">["searchParams"] }) {
  await yetkiGerek();
  const { q, sayfa, silinen } = await sorgu(searchParams);
  const { satirlar, toplam } = await muadilSayfasi({ q, sayfa, silinen });

  return (
    <>
      <SayfaBasligi baslik="Muadiller" aciklama="Bir orijinal parfümün muadil kodları, fiyatları ve puanları.">
        <Link href="/yonetim/muadiller/yeni" className="dugme y-btn">
          Muadil ekle
        </Link>
      </SayfaBasligi>
      <Arama yol="/yonetim/muadiller" q={q} silinen={silinen} yer="Marka, kod ya da orijinal parfüm ara" />
      <div className="y-kart overflow-x-auto" style={{ padding: 0 }}>
        <table className="y-tablo">
          <thead>
            <tr>
              <th>Muadil</th>
              <th>Orijinal parfüm</th>
              <th>Fiyat</th>
              <th>Kalıcılık</th>
              <th>Benzerlik</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.map((m) => (
              <tr key={m.id}>
                <td>
                  <Link href={`/yonetim/muadiller/${m.id}`} className="font-bold">
                    {m.markaAd} {m.kod}
                  </Link>
                  <div className="y-ipucu" style={{ marginTop: 0 }}>
                    {CINSIYET_ADI[m.cinsiyet]}
                  </div>
                </td>
                <td>
                  {m.parfumMarka} {m.parfumAd}
                </td>
                <td className="tabular-nums">{tl(Number(m.fiyat))}</td>
                <td className="tabular-nums">{m.kalicilik}/10</td>
                <td className="tabular-nums">{m.benzerlik}/10</td>
              </tr>
            ))}
            {satirlar.length === 0 && (
              <tr>
                <td colSpan={5} className="y-ipucu">
                  Kayıt yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Sayfalama toplam={toplam} sayfa={sayfa} yol="/yonetim/muadiller" parametreler={{ q, silinen: silinen ? "1" : undefined }} />
    </>
  );
}
