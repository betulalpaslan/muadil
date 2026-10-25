import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { yetkiGerek } from "@/lib/yonetim/oturum";
import { notaKaydi } from "@/lib/yonetim/veri";
import { notaSil } from "../../actions";
import { EylemDugmesi } from "../../_bilesenler/eylem-dugmesi";
import { NotaFormu } from "../../_bilesenler/nota-formu";
import { Bildirim, SayfaBasligi, Yukleniyor, kimlik, sorgu } from "../../_bilesenler/ortak";

export const metadata: Metadata = { title: "Notayı düzenle" };

export default function NotaDuzenle(props: PageProps<"/yonetim/notalar/[id]">) {
  return (
    <Suspense fallback={<Yukleniyor />}>
      <Icerik {...props} />
    </Suspense>
  );
}

async function Icerik({ params, searchParams }: PageProps<"/yonetim/notalar/[id]">) {
  await yetkiGerek();
  const id = kimlik((await params).id);
  if (id === null) notFound();
  const [n, { eklendi, guncellendi }] = await Promise.all([notaKaydi(id), sorgu(searchParams)]);
  if (!n) notFound();

  return (
    <>
      <SayfaBasligi baslik={n.ad} aciklama={`${n.parfumSayisi} parfümde kullanılıyor.`}>
        <Link href="/yonetim/notalar" className="y-ikincil">
          ← Notalar
        </Link>
        <Link href={`/nota/${n.slug}`} className="y-ikincil" target="_blank">
          Sitede gör ↗
        </Link>
      </SayfaBasligi>
      <Bildirim eklendi={eklendi} guncellendi={guncellendi} />
      <NotaFormu kayit={n} />
      <section className="mt-10">
        {n.parfumSayisi === 0 ? (
          <EylemDugmesi action={notaSil.bind(null, n.id)} etiket="Notayı sil" tehlike onay={`"${n.ad}" notası kalıcı olarak silinsin mi?`} />
        ) : (
          <p className="y-ipucu">Parfümlerde kullanıldığı için silinemez.</p>
        )}
      </section>
    </>
  );
}
