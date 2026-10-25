import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { tl } from "@/lib/site";
import { yetkiGerek } from "@/lib/yonetim/oturum";
import { markaAdlari, notaAdlari, parfumKaydi } from "@/lib/yonetim/veri";
import { parfumGeriGetir, parfumSil } from "../../actions";
import { EylemDugmesi } from "../../_bilesenler/eylem-dugmesi";
import { ParfumFormu } from "../../_bilesenler/parfum-formu";
import { Bildirim, SayfaBasligi, Yukleniyor, kimlik, sorgu } from "../../_bilesenler/ortak";

export const metadata: Metadata = { title: "Parfümü düzenle" };

export default function ParfumDuzenle(props: PageProps<"/yonetim/parfumler/[id]">) {
  return (
    <Suspense fallback={<Yukleniyor />}>
      <Icerik {...props} />
    </Suspense>
  );
}

async function Icerik({ params, searchParams }: PageProps<"/yonetim/parfumler/[id]">) {
  await yetkiGerek();
  const id = kimlik((await params).id);
  if (id === null) notFound();
  const [p, markalar, notalar, { eklendi, guncellendi }] = await Promise.all([
    parfumKaydi(id),
    markaAdlari("orijinal"),
    notaAdlari(),
    sorgu(searchParams),
  ]);
  if (!p) notFound();

  const aktifler = p.muadiller.filter((m) => !m.silinmeTarihi);

  return (
    <>
      <SayfaBasligi baslik={`${p.markaAd} ${p.ad}`} aciklama={p.silinmeTarihi ? "Bu parfüm silinmiş; sitede görünmüyor." : undefined}>
        <Link href="/yonetim/parfumler" className="y-ikincil">
          ← Parfümler
        </Link>
        {!p.silinmeTarihi && (
          <Link href={`/parfum/${p.slug}`} className="y-ikincil" target="_blank">
            Sitede gör ↗
          </Link>
        )}
      </SayfaBasligi>
      <Bildirim eklendi={eklendi} guncellendi={guncellendi} />

      <ParfumFormu kayit={p} markalar={markalar} notalar={notalar} />

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="genis text-xl">Muadilleri ({aktifler.length})</h2>
          {!p.silinmeTarihi && (
            <Link href={`/yonetim/muadiller/yeni?parfum=${p.id}`} className="dugme y-btn">
              Muadil ekle
            </Link>
          )}
        </div>
        <div className="y-kart overflow-x-auto" style={{ padding: 0 }}>
          <table className="y-tablo">
            <tbody>
              {p.muadiller.map((m) => (
                <tr key={m.id} style={m.silinmeTarihi ? { opacity: 0.5 } : undefined}>
                  <td>
                    <Link href={`/yonetim/muadiller/${m.id}`} className="font-bold">
                      {m.markaAd} {m.kod}
                    </Link>
                    {m.silinmeTarihi && <span className="y-ipucu"> · silinmiş</span>}
                  </td>
                  <td className="text-right tabular-nums">{tl(Number(m.fiyat))}</td>
                </tr>
              ))}
              {p.muadiller.length === 0 && (
                <tr>
                  <td className="y-ipucu">Henüz muadil yok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        {p.silinmeTarihi ? (
          <EylemDugmesi action={parfumGeriGetir.bind(null, p.id)} etiket="Parfümü geri getir" />
        ) : (
          <EylemDugmesi action={parfumSil.bind(null, p.id)} etiket="Parfümü sil" tehlike onay={`${p.markaAd} ${p.ad} silinsin mi? Sitede görünmez olur; geri getirilebilir.`} />
        )}
      </section>
    </>
  );
}
