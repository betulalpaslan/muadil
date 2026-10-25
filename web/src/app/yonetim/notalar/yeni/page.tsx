import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { yetkiGerek } from "@/lib/yonetim/oturum";
import { NotaFormu } from "../../_bilesenler/nota-formu";
import { SayfaBasligi, Yukleniyor } from "../../_bilesenler/ortak";

export const metadata: Metadata = { title: "Nota ekle" };

export default function YeniNota() {
  return (
    <Suspense fallback={<Yukleniyor />}>
      <Icerik />
    </Suspense>
  );
}

async function Icerik() {
  await yetkiGerek();
  return (
    <>
      <SayfaBasligi baslik="Nota ekle">
        <Link href="/yonetim/notalar" className="y-ikincil">
          ← Notalar
        </Link>
      </SayfaBasligi>
      <NotaFormu />
    </>
  );
}
