import type { Metadata } from "next";
import Link from "next/link";
import { Kirinti } from "@/components/parcalar";
import { markaListesi } from "@/lib/veri";

export const metadata: Metadata = {
  title: "Markalar",
  description: "Orijinal parfüm markaları ve muadil kodu üreten markalar.",
  alternates: { canonical: "/markalar" },
};

export default async function Markalar() {
  const hepsi = await markaListesi();
  const gruplar = [
    { baslik: "Orijinal markalar", liste: hepsi.filter((m) => m.tur === "orijinal") },
    { baslik: "Muadil markalar", liste: hepsi.filter((m) => m.tur === "muadil") },
  ];
  return (
    <>
      <Kirinti yol={[{ ad: "Ana sayfa", href: "/" }, { ad: "Markalar" }]} />
      <h1 className="genis text-3xl">Markalar</h1>
      {gruplar.map((g) => (
        <section key={g.baslik} className="mt-10">
          <h2 className="genis border-b border-yazi/20 pb-3 text-xl">{g.baslik}</h2>
          <ul className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
            {g.liste.map((m) => (
              <li key={m.id}>
                <Link href={`/marka/${m.slug}`} className="hover:text-vurgu hover:underline">
                  {m.ad}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
