import Link from "next/link";
import type { ReactNode } from "react";
import { SAYFA_BOYUTU } from "@/lib/yonetim/veri";

export function SayfaBasligi({ baslik, aciklama, children }: { baslik: string; aciklama?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="genis text-3xl">{baslik}</h1>
        {aciklama && <p className="y-ipucu">{aciklama}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Alan({ etiket, ipucu, htmlFor, children }: { etiket: string; ipucu?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label className="y-etiket" htmlFor={htmlFor}>
        {etiket}
      </label>
      {children}
      {ipucu && <p className="y-ipucu">{ipucu}</p>}
    </div>
  );
}

export function Yukleniyor() {
  return <p className="y-ipucu">Yükleniyor…</p>;
}

/** Kayıttan dönüşte (?eklendi=1 / ?guncellendi=1) üstte gösterilen onay kutusu. */
export function Bildirim({ eklendi, guncellendi }: { eklendi?: boolean; guncellendi?: boolean }) {
  if (!eklendi && !guncellendi) return null;
  return (
    <div role="status" className="y-basari mb-5">
      {eklendi ? "Eklendi. Sitede birkaç saniye içinde görünür." : "Değişiklikler kaydedildi."}
    </div>
  );
}

type Parametreler = Record<string, string | undefined>;

/** Arama kutusu ve süzgeçler GET ile çalışır: adres paylaşılabilir, JavaScript gerekmez. */
export function Arama({ yol, q, gorselsiz, silinen, yer }: { yol: string; q?: string; gorselsiz?: boolean; silinen?: boolean; yer: string }) {
  return (
    <form action={yol} className="mb-5 flex flex-wrap items-center gap-3">
      <input name="q" defaultValue={q} placeholder={yer} aria-label="Ara" className="y-girdi" style={{ maxWidth: 360 }} />
      {gorselsiz !== undefined && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="gorselsiz" value="1" defaultChecked={gorselsiz} /> Görseli olmayanlar
        </label>
      )}
      {silinen !== undefined && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="silinen" value="1" defaultChecked={silinen} /> Silinenler
        </label>
      )}
      <button type="submit" className="y-ikincil">
        Ara
      </button>
    </form>
  );
}

export function Sayfalama({ toplam, sayfa, yol, parametreler }: { toplam: number; sayfa: number; yol: string; parametreler: Parametreler }) {
  const son = Math.max(1, Math.ceil(toplam / SAYFA_BOYUTU));
  const adres = (n: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(parametreler)) if (v) p.set(k, v);
    if (n > 1) p.set("sayfa", String(n));
    const metin = p.toString();
    return metin ? `${yol}?${metin}` : yol;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-soluk">
        {toplam} kayıt · sayfa {sayfa}/{son}
      </span>
      <span className="flex gap-2">
        {sayfa > 1 && (
          <Link href={adres(sayfa - 1)} className="y-ikincil">
            ← Önceki
          </Link>
        )}
        {sayfa < son && (
          <Link href={adres(sayfa + 1)} className="y-ikincil">
            Sonraki →
          </Link>
        )}
      </span>
    </div>
  );
}

/** searchParams değerlerini güvenle okur. */
export async function sorgu(sp: Promise<Record<string, string | string[] | undefined>>) {
  const d = await sp;
  const tek = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : undefined);
  return {
    q: tek("q")?.trim().slice(0, 100) || undefined,
    sayfa: Math.max(1, Number(tek("sayfa")) || 1),
    gorselsiz: tek("gorselsiz") === "1",
    silinen: tek("silinen") === "1",
    eklendi: tek("eklendi") === "1",
    guncellendi: tek("guncellendi") === "1",
    tek,
  };
}

/** Adres parçasındaki kimliği sayıya çevirir; geçersizse null. */
export const kimlik = (v: string) => (/^\d{1,9}$/.test(v) ? Number(v) : null);
