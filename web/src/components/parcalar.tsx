import Image from "next/image";
import Link from "next/link";
import { adDili, tl, tarih } from "@/lib/site";
import type { MuadilOzet, ParfumOzet } from "@/lib/veri";
import { Halka, Sise } from "@/components/sise";

// Editör puanı 1–10 olduğundan yüzde, puanın on katıdır.
export const yuzde = (benzerlik: number) => benzerlik * 10;

// Parfüm görseli: fotoğraf varsa o, yoksa parfüm renginde şişe çizimi.
export function ParfumGorseli({
  gorselUrl,
  renk,
  ad,
  boyut = 160,
}: {
  gorselUrl: string | null;
  renk: string | null;
  ad: string;
  boyut?: number;
}) {
  return (
    <div className="isilti flex shrink-0 items-center justify-center" style={{ background: "var(--surf)", borderRadius: "var(--r-md)", width: boyut, height: boyut }}>
      {gorselUrl ? (
        <Image src={gorselUrl} alt={ad} width={boyut} height={boyut} className="h-full w-full object-contain p-3" />
      ) : (
        <Sise renk={renk} olcek={boyut / 96} />
      )}
    </div>
  );
}

export function ParfumKarti({ p }: { p: ParfumOzet }) {
  return (
    <Link href={`/parfum/${p.slug}`} className="group flex gap-4 p-3" style={{ border: "1px solid var(--line)", borderRadius: "var(--r-lg)" }}>
      <ParfumGorseli gorselUrl={p.gorselUrl} renk={p.renk} ad={p.ad} boyut={96} />
      <div className="min-w-0 self-center">
        <p className="kucuk text-vurgu" lang={adDili(p.markaAd)}>
          {p.markaAd}
        </p>
        <h3 className="genis text-lg group-hover:underline">{p.ad}</h3>
        <p className="mt-1 text-sm text-soluk">
          {p.muadilSayisi} muadil{p.enUcuz !== null && <> · {tl(p.enUcuz)}&apos;den başlayan</>}
        </p>
      </div>
    </Link>
  );
}

export function Puan({ etiket, deger }: { etiket: string; deger: number }) {
  return (
    <div className="min-w-24">
      <div className="kucuk text-soluk">{etiket}</div>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-1.5 w-16" style={{ background: "var(--track)", borderRadius: "var(--r-sm)" }} role="img" aria-label={`${etiket} ${deger}/10`}>
          <div className="h-full" style={{ width: `${deger * 10}%`, background: "var(--accent)", borderRadius: "var(--r-sm)" }} />
        </div>
        <span className="text-sm tabular-nums">{deger}/10</span>
      </div>
    </div>
  );
}

// Satın alma bağlantısı doğrudan mağazaya değil /git/{id} yönlendirmesine gider: tıklama ölçülür, bağlantı tek yerden değişir.
export function SatinAl({ id, kaynak, metin = "Satıcıda gör" }: { id: number; kaynak: string; metin?: string }) {
  return (
    <a href={`/git/${id}?k=${encodeURIComponent(kaynak)}`} rel="nofollow sponsored noopener" target="_blank" className="dugme h-11 px-6 whitespace-nowrap">
      {metin}
    </a>
  );
}

// Liste satırı (marka, nota ve diğer muadil listelerinde): ad, puanlar, fiyat.
export function MuadilSatiri({ m, kaynak, orijinal }: { m: MuadilOzet; kaynak: string; orijinal?: { ad: string; slug: string } }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
      <div className="flex items-center gap-4">
        <Halka yuzde={yuzde(m.benzerlik)} boyut={52} yaziBoyutu={13} />
        <div>
          <Link href={`/muadil/${m.slug}`} className="genis text-lg hover:underline">
            {m.markaAd} <span className="text-vurgu">{m.kod}</span>
          </Link>
          {orijinal && (
            <p className="text-sm text-soluk">
              <Link href={`/parfum/${orijinal.slug}`} className="hover:underline">
                {orijinal.ad}
              </Link>{" "}
              muadili
            </p>
          )}
          <p className="text-xs text-soluk">Fiyat: {tarih(m.fiyatTarihi)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <Puan etiket="Kalıcılık" deger={m.kalicilik} />
        <span className="w-20 text-right text-lg font-bold tracking-tight tabular-nums">{tl(m.fiyat)}</span>
        <SatinAl id={m.id} kaynak={kaynak} />
      </div>
    </li>
  );
}

// isim: true olan öğe bir marka/parfüm adıdır; CSS büyük harfe çevirirken Türkçe "İ" kuralı uygulanmaz.
export function Kirinti({ yol }: { yol: { ad: string; href?: string; isim?: boolean }[] }) {
  return (
    <nav aria-label="Konum" className="kucuk mb-6 text-soluk">
      {yol.map((y, i) => (
        <span key={y.ad}>
          {i > 0 && " / "}
          {y.href ? (
            <Link href={y.href} className="hover:text-yazi" lang={y.isim ? adDili(y.ad) : undefined}>
              {y.ad}
            </Link>
          ) : (
            <span className="text-yazi" lang={y.isim ? adDili(y.ad) : undefined}>
              {y.ad}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
