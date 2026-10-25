import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { yetkiGerek } from "@/lib/yonetim/oturum";
import { ozet, sonEklenenler } from "@/lib/yonetim/veri";
import { SayfaBasligi, Yukleniyor } from "./_bilesenler/ortak";

export const metadata: Metadata = { title: "Panel" };

export default function Panel() {
  return (
    <Suspense fallback={<Yukleniyor />}>
      <Icerik />
    </Suspense>
  );
}

async function Icerik() {
  await yetkiGerek();
  const [o, son] = await Promise.all([ozet(), sonEklenenler()]);

  const sayilar = [
    { ad: "Parfüm", deger: o.parfum, yeni: "/yonetim/parfumler/yeni", liste: "/yonetim/parfumler" },
    { ad: "Muadil", deger: o.muadil, yeni: "/yonetim/muadiller/yeni", liste: "/yonetim/muadiller" },
    { ad: "Nota", deger: o.nota, yeni: "/yonetim/notalar/yeni", liste: "/yonetim/notalar" },
    { ad: "Marka", deger: o.marka, yeni: null, liste: "/yonetim/markalar" },
  ];
  const eksikler = [
    { ad: "Görseli olmayan parfüm", deger: o.parfum_gorselsiz, href: "/yonetim/parfumler?gorselsiz=1" },
    { ad: "Görseli olmayan nota", deger: o.nota_gorselsiz, href: "/yonetim/notalar?gorselsiz=1" },
    { ad: "Logosu olmayan marka", deger: o.marka_gorselsiz, href: "/yonetim/markalar?gorselsiz=1" },
    { ad: "Muadili olmayan parfüm", deger: o.muadilsiz_parfum, href: "/yonetim/parfumler" },
  ];

  return (
    <>
      <SayfaBasligi baslik="Yönetim paneli" aciklama="Kayıt ekle, görsel yükle, puanları güncelle. Değişiklikler sitede hemen yansır." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sayilar.map((s) => (
          <div key={s.ad} className="y-kart">
            <p className="y-etiket" style={{ marginBottom: 2 }}>
              {s.ad}
            </p>
            <p className="genis text-4xl tabular-nums">{s.deger}</p>
            <div className="mt-4 flex gap-2">
              <Link href={s.liste} className="y-ikincil">
                Liste
              </Link>
              {s.yeni && (
                <Link href={s.yeni} className="y-ikincil">
                  + Ekle
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <h2 className="genis mb-3 mt-10 text-xl">Tamamlanması gerekenler</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {eksikler.map((e) => (
          <Link key={e.ad} href={e.href} className="y-kart flex items-center justify-between no-underline">
            <span>{e.ad}</span>
            <span className="genis text-2xl tabular-nums">{e.deger}</span>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="genis mb-3 text-xl">Son eklenen parfümler</h2>
          <ul className="y-kart space-y-2">
            {son.parfumler.map((p) => (
              <li key={p.id}>
                <Link href={`/yonetim/parfumler/${p.id}`}>
                  {p.markaAd} {p.ad}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="genis mb-3 text-xl">Son eklenen muadiller</h2>
          <ul className="y-kart space-y-2">
            {son.muadiller.map((m) => (
              <li key={m.id}>
                <Link href={`/yonetim/muadiller/${m.id}`}>
                  {m.markaAd} {m.kod}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
