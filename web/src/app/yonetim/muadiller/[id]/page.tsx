import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { tarih } from "@/lib/site";
import { yetkiGerek } from "@/lib/yonetim/oturum";
import { markaAdlari, muadilKaydi, parfumSecenekleri } from "@/lib/yonetim/veri";
import { muadilGeriGetir, muadilSil } from "../../actions";
import { EylemDugmesi } from "../../_bilesenler/eylem-dugmesi";
import { MuadilFormu } from "../../_bilesenler/muadil-formu";
import { Bildirim, SayfaBasligi, Yukleniyor, kimlik, sorgu } from "../../_bilesenler/ortak";

export const metadata: Metadata = { title: "Muadili düzenle" };

export default function MuadilDuzenle(props: PageProps<"/yonetim/muadiller/[id]">) {
  return (
    <Suspense fallback={<Yukleniyor />}>
      <Icerik {...props} />
    </Suspense>
  );
}

async function Icerik({ params, searchParams }: PageProps<"/yonetim/muadiller/[id]">) {
  await yetkiGerek();
  const id = kimlik((await params).id);
  if (id === null) notFound();
  const [m, parfumlar, markalar, { eklendi, guncellendi }] = await Promise.all([
    muadilKaydi(id),
    parfumSecenekleri(),
    markaAdlari("muadil"),
    sorgu(searchParams),
  ]);
  if (!m) notFound();

  return (
    <>
      <SayfaBasligi
        baslik={`${m.markaAd} ${m.kod}`}
        aciklama={m.silinmeTarihi ? "Bu muadil silinmiş; sitede görünmüyor." : `Fiyat son ${tarih(m.fiyatTarihi.toISOString())} tarihinde güncellendi.`}
      >
        <Link href="/yonetim/muadiller" className="y-ikincil">
          ← Muadiller
        </Link>
        {!m.silinmeTarihi && (
          <Link href={`/muadil/${m.slug}`} className="y-ikincil" target="_blank">
            Sitede gör ↗
          </Link>
        )}
      </SayfaBasligi>
      <Bildirim eklendi={eklendi} guncellendi={guncellendi} />

      <MuadilFormu kayit={m} parfumlar={parfumlar} markalar={markalar} />

      <section className="mt-10">
        {m.silinmeTarihi ? (
          <EylemDugmesi action={muadilGeriGetir.bind(null, m.id)} etiket="Muadili geri getir" />
        ) : (
          <EylemDugmesi action={muadilSil.bind(null, m.id)} etiket="Muadili sil" tehlike onay={`${m.markaAd} ${m.kod} silinsin mi? Sitede görünmez olur; geri getirilebilir.`} />
        )}
      </section>
    </>
  );
}
