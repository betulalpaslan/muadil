import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { db, schema as s } from "@/db";
import { Kirinti } from "@/components/parcalar";
import { ara } from "@/lib/veri";

// Arama sonuçları dizine girmez (sonsuz sorgu kombinasyonu, ince içerik).
export const metadata: Metadata = { title: "Arama", robots: { index: false, follow: true } };

const ETIKET = { muadil: "Kod", parfum: "Parfüm", marka: "Marka", nota: "Nota" } as const;

async function Sonuclar({ sorgu }: { sorgu: Promise<{ q?: string | string[] }> }) {
  const { q: ham } = await sorgu;
  const q = (Array.isArray(ham) ? ham[0] : ham)?.trim() ?? "";
  if (q.length < 2) return <p className="mt-6 text-soluk">En az iki harf yaz.</p>;

  const sonuclar = await ara(q, 30);
  // Sonuç çıkmayan aramalar hangi kodu eklemem gerektiğini söyler.
  await db.insert(s.aramaLogu).values({ sorgu: q.slice(0, 200), sonucSayisi: sonuclar.length }).catch(() => {});

  if (sonuclar.length === 0)
    return (
      <p className="mt-6 text-soluk">
        &quot;{q}&quot; için sonuç bulunamadı. Yazımı kontrol et ya da <Link href="/parfumler" className="underline">tüm parfümlere</Link> göz at.
      </p>
    );

  return (
    <ul className="mt-6">
      {sonuclar.map((r) => (
        <li key={r.href} className="border-b border-yazi/20">
          <Link href={r.href} className="flex items-baseline justify-between gap-4 py-4 hover:text-vurgu">
            <span className="text-lg">
              {r.ad}
              {r.alt && <span className="ml-3 text-sm text-soluk">{r.alt}</span>}
            </span>
            <span className="kucuk text-vurgu">{ETIKET[r.tur]}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function AramaSayfasi({ searchParams }: PageProps<"/ara">) {
  return (
    <>
      <Kirinti yol={[{ ad: "Ana sayfa", href: "/" }, { ad: "Arama" }]} />
      <h1 className="genis text-3xl">Arama sonuçları</h1>
      <Suspense fallback={<p className="mt-6 text-soluk">Aranıyor…</p>}>
        <Sonuclar sorgu={searchParams} />
      </Suspense>
    </>
  );
}
