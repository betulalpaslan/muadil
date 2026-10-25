import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Kirinti, ParfumKarti } from "@/components/parcalar";
import { notaDetay, tumSluglar } from "@/lib/veri";

const KATMAN = { ust: "üst", orta: "orta", alt: "alt" } as const;

// Listede olmayan adreste ilk istek tam sayfayı beklesin: yanlış adres ilk seferde de gerçek 404 dönsün.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await tumSluglar()).notalar.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/nota/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const n = await notaDetay(slug);
  if (!n) return {};
  return {
    title: `${n.ad} notalı parfümler ve muadilleri`,
    description: `${n.ad} notası içeren ${n.parfumler.length} parfüm ve muadilleri. ${n.aciklama ?? ""}`.trim(),
    alternates: { canonical: `/nota/${slug}` },
  };
}

export default async function NotaSayfasi({ params }: PageProps<"/nota/[slug]">) {
  const { slug } = await params;
  const n = await notaDetay(slug);
  if (!n) notFound();

  return (
    <>
      <Kirinti yol={[{ ad: "Ana sayfa", href: "/" }, { ad: "Notalar", href: "/notalar" }, { ad: n.ad }]} />
      <div className="flex items-center gap-6">
        {n.gorselUrl && <Image src={n.gorselUrl} alt={n.ad} width={120} height={120} className="h-28 w-28 object-contain" />}
        <div>
          <p className="kucuk text-vurgu">Nota</p>
          <h1 className="genis mt-2 text-3xl sm:text-4xl">{n.ad} notalı parfümler</h1>
        </div>
      </div>
      {n.aciklama && <p className="mt-6 max-w-2xl text-lg text-soluk">{n.aciklama}</p>}

      <section className="mt-10" aria-labelledby="liste">
        <h2 id="liste" className="genis border-b border-yazi/20 pb-3 text-xl">
          {n.parfumler.length} parfümde kullanılıyor
        </h2>
        {n.parfumler.length === 0 ? (
          <p className="mt-6 text-soluk">Bu notayı içeren parfüm yok.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {n.parfumler.map((p) => (
              <div key={p.id}>
                <ParfumKarti p={p} />
                <p className="kucuk mt-1 text-soluk">{KATMAN[p.katman]} nota</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
