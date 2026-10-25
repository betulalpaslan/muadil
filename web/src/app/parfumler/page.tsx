import type { Metadata } from "next";
import { Kirinti, ParfumKarti } from "@/components/parcalar";
import { parfumListesi } from "@/lib/veri";

export const metadata: Metadata = {
  title: "Tüm parfümler ve muadilleri",
  description: "Orijinal parfümlerin muadil kodları, fiyatları ve puanları. Marka ve ada göre sıralı liste.",
  alternates: { canonical: "/parfumler" },
};

export default async function Parfumler() {
  const liste = await parfumListesi();
  return (
    <>
      <Kirinti yol={[{ ad: "Ana sayfa", href: "/" }, { ad: "Parfümler" }]} />
      <h1 className="genis text-3xl">Tüm parfümler</h1>
      <p className="mt-3 text-soluk">{liste.length} orijinal parfüm ve muadilleri.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {liste.map((p) => (
          <ParfumKarti key={p.id} p={p} />
        ))}
      </div>
    </>
  );
}
