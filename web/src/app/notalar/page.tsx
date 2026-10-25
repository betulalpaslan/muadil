import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Kirinti } from "@/components/parcalar";
import { notaListesi } from "@/lib/veri";

export const metadata: Metadata = {
  title: "Parfüm notaları",
  description: "Parfümlerde kullanılan notalar, koku açıklamaları ve o notayı içeren parfümler.",
  alternates: { canonical: "/notalar" },
};

export default async function Notalar() {
  const liste = await notaListesi();
  return (
    <>
      <Kirinti yol={[{ ad: "Ana sayfa", href: "/" }, { ad: "Notalar" }]} />
      <h1 className="genis text-3xl">Parfüm notaları</h1>
      <p className="mt-3 text-soluk">{liste.length} nota. Birine tıklayıp o notayı içeren parfümleri gör.</p>
      <ul className="mt-8 grid gap-px border border-yazi/20 bg-yazi/20 sm:grid-cols-2 lg:grid-cols-4">
        {liste.map((n, i) => (
          <li key={n.id} className="bg-zemin">
            <Link href={`/nota/${n.slug}`} className="block h-full p-5 hover:bg-yuzey">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-vurgu">{String(i + 1).padStart(2, "0")}</span>
                {n.gorselUrl && <Image src={n.gorselUrl} alt="" width={64} height={64} className="h-16 w-16 object-contain" />}
              </div>
              <h2 className="genis mt-3 text-base">{n.ad}</h2>
              {n.aciklama && <p className="mt-2 line-clamp-3 text-sm text-soluk">{n.aciklama}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
