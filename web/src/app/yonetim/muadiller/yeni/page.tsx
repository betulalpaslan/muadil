import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { yetkiGerek } from "@/lib/yonetim/oturum";
import { markaAdlari, parfumSecenekleri } from "@/lib/yonetim/veri";
import { MuadilFormu } from "../../_bilesenler/muadil-formu";
import { SayfaBasligi, Yukleniyor, kimlik, sorgu } from "../../_bilesenler/ortak";

export const metadata: Metadata = { title: "Muadil ekle" };

export default function YeniMuadil({ searchParams }: PageProps<"/yonetim/muadiller/yeni">) {
  return (
    <Suspense fallback={<Yukleniyor />}>
      <Icerik searchParams={searchParams} />
    </Suspense>
  );
}

async function Icerik({ searchParams }: { searchParams: PageProps<"/yonetim/muadiller/yeni">["searchParams"] }) {
  await yetkiGerek();
  // ?parfum=<id> ile bir parfüm sayfasından gelindiğinde orijinal parfüm hazır seçili gelir.
  const { tek } = await sorgu(searchParams);
  const [parfumlar, markalar] = await Promise.all([parfumSecenekleri(), markaAdlari("muadil")]);
  return (
    <>
      <SayfaBasligi baslik="Muadil ekle">
        <Link href="/yonetim/muadiller" className="y-ikincil">
          ← Muadiller
        </Link>
      </SayfaBasligi>
      <MuadilFormu parfumlar={parfumlar} markalar={markalar} baslangicParfumId={kimlik(tek("parfum") ?? "")} />
    </>
  );
}
