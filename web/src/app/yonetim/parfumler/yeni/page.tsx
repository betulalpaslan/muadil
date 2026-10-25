import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { yetkiGerek } from "@/lib/yonetim/oturum";
import { markaAdlari, notaAdlari } from "@/lib/yonetim/veri";
import { ParfumFormu } from "../../_bilesenler/parfum-formu";
import { SayfaBasligi, Yukleniyor } from "../../_bilesenler/ortak";

export const metadata: Metadata = { title: "Parfüm ekle" };

export default function YeniParfum() {
  return (
    <Suspense fallback={<Yukleniyor />}>
      <Icerik />
    </Suspense>
  );
}

async function Icerik() {
  await yetkiGerek();
  const [markalar, notalar] = await Promise.all([markaAdlari("orijinal"), notaAdlari()]);
  return (
    <>
      <SayfaBasligi baslik="Parfüm ekle">
        <Link href="/yonetim/parfumler" className="y-ikincil">
          ← Parfümler
        </Link>
      </SayfaBasligi>
      <ParfumFormu markalar={markalar} notalar={notalar} />
    </>
  );
}
