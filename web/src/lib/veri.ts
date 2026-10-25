import { cacheLife, cacheTag } from "next/cache";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";

// Tüm okuma sorguları 'katalog' etiketiyle önbelleğe alınır; içe aktarma sonrası revalidateTag("katalog") ile tazelenir.

export type MuadilOzet = {
  id: number;
  slug: string;
  kod: string;
  markaAd: string;
  markaSlug: string;
  markaLogo: string | null;
  fiyat: number;
  kalicilik: number;
  benzerlik: number;
  fiyatTarihi: string;
};

export type ParfumOzet = {
  id: number;
  slug: string;
  ad: string;
  markaAd: string;
  markaSlug: string;
  gorselUrl: string | null;
  renk: string | null;
  muadilSayisi: number;
  enUcuz: number | null;
};

// Karşılaştırma bileşeninin ihtiyacı olan her şey: orijinal, notalarının kısa özeti ve muadilleri.
export type KarsilastirmaVeri = {
  slug: string;
  ad: string;
  markaAd: string;
  gorselUrl: string | null;
  renk: string | null;
  notalar: string[];
  muadiller: MuadilOzet[];
};

const muadilSecimi = {
  id: s.muadil.id,
  slug: s.muadil.slug,
  kod: s.muadil.kod,
  markaAd: s.marka.ad,
  markaSlug: s.marka.slug,
  markaLogo: s.marka.gorselUrl,
  fiyat: s.muadil.fiyat,
  kalicilik: s.muadil.kalicilikPuani,
  benzerlik: s.muadil.benzerlikPuani,
  fiyatTarihi: s.muadil.fiyatTarihi,
};

function muadilOzeti(r: Omit<MuadilOzet, "fiyat" | "fiyatTarihi"> & { fiyat: string; fiyatTarihi: Date }): MuadilOzet {
  return { ...r, fiyat: Number(r.fiyat), fiyatTarihi: r.fiyatTarihi.toISOString() };
}

export async function parfumListesi(): Promise<ParfumOzet[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("katalog");

  const satirlar = await db
    .select({
      id: s.parfum.id,
      slug: s.parfum.slug,
      ad: s.parfum.ad,
      markaAd: s.marka.ad,
      markaSlug: s.marka.slug,
      gorselUrl: s.parfum.gorselUrl,
      renk: s.parfum.renk,
      muadilSayisi: sql<number>`count(${s.muadil.id})::int`,
      enUcuz: sql<string | null>`min(${s.muadil.fiyat})`,
    })
    .from(s.parfum)
    .innerJoin(s.marka, eq(s.marka.id, s.parfum.markaId))
    .leftJoin(s.muadil, and(eq(s.muadil.parfumId, s.parfum.id), isNull(s.muadil.silinmeTarihi)))
    .where(isNull(s.parfum.silinmeTarihi))
    .groupBy(s.parfum.id, s.marka.id)
    .orderBy(asc(s.marka.ad), asc(s.parfum.ad));

  return satirlar.map((r) => ({ ...r, enUcuz: r.enUcuz === null ? null : Number(r.enUcuz) }));
}

export async function populerParfumler(adet = 6): Promise<ParfumOzet[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("katalog");
  const hepsi = await parfumListesi();
  return [...hepsi].sort((a, b) => b.muadilSayisi - a.muadilSayisi || a.id - b.id).slice(0, adet);
}

// Parfüm sayfasındaki karşılaştırma için tek parfümün verisi.
export function karsilastirmaVerisi(p: NonNullable<Awaited<ReturnType<typeof parfumDetay>>>): KarsilastirmaVeri {
  const ilk = (l: { ad: string }[]) => l[0]?.ad;
  return {
    slug: p.slug,
    ad: p.ad,
    markaAd: p.markaAd,
    gorselUrl: p.gorselUrl,
    renk: p.renk,
    notalar: [ilk(p.notalar.ust), ilk(p.notalar.orta), ilk(p.notalar.alt)].filter((n): n is string => Boolean(n)),
    muadiller: p.muadiller,
  };
}

// Ana sayfa vitrini: en çok muadili olan parfümler, karşılaştırmaya hazır.
export async function vitrin(adet = 5): Promise<KarsilastirmaVeri[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("katalog");
  const populer = await populerParfumler(adet);
  const detaylar = await Promise.all(populer.map((p) => parfumDetay(p.slug)));
  return detaylar.filter((d): d is NonNullable<typeof d> => d !== null && d.muadiller.length > 0).map(karsilastirmaVerisi);
}

export async function sayilar() {
  "use cache";
  cacheLife("hours");
  cacheTag("katalog");
  const sonuc = await db.execute<{ parfum: number; muadil: number; nota: number }>(sql`
    select
      (select count(*) from parfum where silinme_tarihi is null)::int as parfum,
      (select count(*) from muadil where silinme_tarihi is null)::int as muadil,
      (select count(*) from nota)::int as nota`);
  return sonuc[0];
}

async function parfumNotalari(parfumId: number) {
  const satirlar = await db
    .select({ ad: s.nota.ad, slug: s.nota.slug, gorselUrl: s.nota.gorselUrl, aciklama: s.nota.aciklama, katman: s.parfumNota.katman })
    .from(s.parfumNota)
    .innerJoin(s.nota, eq(s.nota.id, s.parfumNota.notaId))
    .where(eq(s.parfumNota.parfumId, parfumId))
    .orderBy(asc(s.nota.ad));
  return {
    ust: satirlar.filter((n) => n.katman === "ust"),
    orta: satirlar.filter((n) => n.katman === "orta"),
    alt: satirlar.filter((n) => n.katman === "alt"),
  };
}

export async function parfumDetay(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("katalog");

  const [p] = await db
    .select({
      id: s.parfum.id,
      slug: s.parfum.slug,
      ad: s.parfum.ad,
      cinsiyet: s.parfum.cinsiyet,
      gorselUrl: s.parfum.gorselUrl,
      renk: s.parfum.renk,
      markaAd: s.marka.ad,
      markaSlug: s.marka.slug,
    })
    .from(s.parfum)
    .innerJoin(s.marka, eq(s.marka.id, s.parfum.markaId))
    .where(and(eq(s.parfum.slug, slug), isNull(s.parfum.silinmeTarihi)));
  if (!p) return null;

  const muadiller = (
    await db
      .select(muadilSecimi)
      .from(s.muadil)
      .innerJoin(s.marka, eq(s.marka.id, s.muadil.markaId))
      .where(and(eq(s.muadil.parfumId, p.id), isNull(s.muadil.silinmeTarihi)))
      .orderBy(asc(s.muadil.fiyat))
  ).map(muadilOzeti);

  return { ...p, muadiller, notalar: await parfumNotalari(p.id) };
}

export async function muadilDetay(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("katalog");

  const [m] = await db
    .select({ ...muadilSecimi, cinsiyet: s.muadil.cinsiyet, parfumId: s.muadil.parfumId })
    .from(s.muadil)
    .innerJoin(s.marka, eq(s.marka.id, s.muadil.markaId))
    .where(and(eq(s.muadil.slug, slug), isNull(s.muadil.silinmeTarihi)));
  if (!m) return null;

  const [o] = await db
    .select({
      id: s.parfum.id,
      slug: s.parfum.slug,
      ad: s.parfum.ad,
      gorselUrl: s.parfum.gorselUrl,
      renk: s.parfum.renk,
      markaAd: s.marka.ad,
      markaSlug: s.marka.slug,
    })
    .from(s.parfum)
    .innerJoin(s.marka, eq(s.marka.id, s.parfum.markaId))
    .where(eq(s.parfum.id, m.parfumId));

  const digerleri = (
    await db
      .select(muadilSecimi)
      .from(s.muadil)
      .innerJoin(s.marka, eq(s.marka.id, s.muadil.markaId))
      .where(and(eq(s.muadil.parfumId, m.parfumId), isNull(s.muadil.silinmeTarihi)))
      .orderBy(asc(s.muadil.fiyat))
  )
    .map(muadilOzeti)
    .filter((d) => d.id !== m.id);

  return {
    ...muadilOzeti(m),
    cinsiyet: m.cinsiyet,
    orijinal: o,
    notalar: await parfumNotalari(o.id),
    digerleri,
  };
}

export async function markaDetay(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("katalog");

  const [m] = await db.select().from(s.marka).where(eq(s.marka.slug, slug));
  if (!m) return null;

  if (m.tur === "orijinal") {
    const parfumler = (await parfumListesi()).filter((p) => p.markaSlug === slug);
    return { ...m, parfumler, muadiller: [] as (MuadilOzet & { orijinalAd: string; orijinalSlug: string })[] };
  }

  const satirlar = await db
    .select({ ...muadilSecimi, orijinalAd: s.parfum.ad, orijinalSlug: s.parfum.slug })
    .from(s.muadil)
    .innerJoin(s.marka, eq(s.marka.id, s.muadil.markaId))
    .innerJoin(s.parfum, eq(s.parfum.id, s.muadil.parfumId))
    .where(and(eq(s.muadil.markaId, m.id), isNull(s.muadil.silinmeTarihi), isNull(s.parfum.silinmeTarihi)))
    .orderBy(asc(s.parfum.ad), asc(s.muadil.kod));
  return {
    ...m,
    parfumler: [] as ParfumOzet[],
    muadiller: satirlar.map((r) => ({ ...muadilOzeti(r), orijinalAd: r.orijinalAd, orijinalSlug: r.orijinalSlug })),
  };
}

export async function markaListesi() {
  "use cache";
  cacheLife("hours");
  cacheTag("katalog");
  return db.select().from(s.marka).orderBy(asc(s.marka.tur), asc(s.marka.ad));
}

export async function notaListesi() {
  "use cache";
  cacheLife("hours");
  cacheTag("katalog");
  return db
    .select({
      id: s.nota.id,
      ad: s.nota.ad,
      slug: s.nota.slug,
      gorselUrl: s.nota.gorselUrl,
      aciklama: s.nota.aciklama,
      parfumSayisi: sql<number>`count(distinct ${s.parfumNota.parfumId})::int`,
    })
    .from(s.nota)
    .leftJoin(s.parfumNota, eq(s.parfumNota.notaId, s.nota.id))
    .groupBy(s.nota.id)
    .orderBy(asc(s.nota.ad));
}

export async function notaDetay(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("katalog");

  const [n] = await db.select().from(s.nota).where(eq(s.nota.slug, slug));
  if (!n) return null;

  const idler = await db
    .select({ id: s.parfumNota.parfumId, katman: s.parfumNota.katman })
    .from(s.parfumNota)
    .where(eq(s.parfumNota.notaId, n.id));
  const sira = { ust: 0, orta: 1, alt: 2 };
  const katman = new Map<number, (typeof idler)[number]["katman"]>();
  for (const i of idler) {
    const onceki = katman.get(i.id);
    if (!onceki || sira[i.katman] < sira[onceki]) katman.set(i.id, i.katman);
  }
  const parfumler = (await parfumListesi())
    .filter((p) => katman.has(p.id))
    .map((p) => ({ ...p, katman: katman.get(p.id)! }));
  return { ...n, parfumler };
}

// Tüm sayfaların adresleri (generateStaticParams ve sitemap için)
export async function tumSluglar() {
  "use cache";
  cacheLife("hours");
  cacheTag("katalog");
  const [parfumler, muadiller, markalar, notalar] = await Promise.all([
    db.select({ slug: s.parfum.slug }).from(s.parfum).where(isNull(s.parfum.silinmeTarihi)),
    db.select({ slug: s.muadil.slug, tarih: s.muadil.fiyatTarihi }).from(s.muadil).where(isNull(s.muadil.silinmeTarihi)),
    db.select({ slug: s.marka.slug }).from(s.marka),
    db.select({ slug: s.nota.slug }).from(s.nota),
  ]);
  return {
    parfumler: parfumler.map((r) => r.slug),
    muadiller: muadiller.map((r) => ({ slug: r.slug, tarih: r.tarih.toISOString() })),
    markalar: markalar.map((r) => r.slug),
    notalar: notalar.map((r) => r.slug),
  };
}

export type AramaSonucu = {
  tur: "muadil" | "parfum" | "marka" | "nota";
  ad: string;
  alt?: string;
  href: string;
};

// Önbelleksiz: kullanıcı sorgusu. Türkçe karakter ve büyük/küçük harf farkı ara_norm ile yok sayılır.
export async function ara(sorgu: string, limit = 8): Promise<AramaSonucu[]> {
  const q = sorgu.trim().slice(0, 100);
  if (q.length < 2) return [];
  const kalip = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  const eslesme = (kolon: unknown) => sql`ara_norm(${kolon}) like ara_norm(${kalip})`;

  const [muadiller, parfumler, markalar, notalar] = await Promise.all([
    db
      .select({ slug: s.muadil.slug, kod: s.muadil.kod, marka: s.marka.ad, orijinal: s.parfum.ad })
      .from(s.muadil)
      .innerJoin(s.marka, eq(s.marka.id, s.muadil.markaId))
      .innerJoin(s.parfum, eq(s.parfum.id, s.muadil.parfumId))
      .where(
        and(
          isNull(s.muadil.silinmeTarihi),
          sql`(${eslesme(sql`${s.marka.ad} || ' ' || ${s.muadil.kod}`)} or ${eslesme(s.muadil.kod)})`,
        ),
      )
      .limit(limit),
    db
      .select({ slug: s.parfum.slug, ad: s.parfum.ad, marka: s.marka.ad })
      .from(s.parfum)
      .innerJoin(s.marka, eq(s.marka.id, s.parfum.markaId))
      .where(and(isNull(s.parfum.silinmeTarihi), eslesme(sql`${s.marka.ad} || ' ' || ${s.parfum.ad}`)))
      .limit(limit),
    db.select({ slug: s.marka.slug, ad: s.marka.ad }).from(s.marka).where(eslesme(s.marka.ad)).limit(4),
    db.select({ slug: s.nota.slug, ad: s.nota.ad }).from(s.nota).where(eslesme(s.nota.ad)).limit(4),
  ]);

  return [
    ...muadiller.map((m): AramaSonucu => ({ tur: "muadil", ad: `${m.marka} ${m.kod}`, alt: `${m.orijinal} muadili`, href: `/muadil/${m.slug}` })),
    ...parfumler.map((p): AramaSonucu => ({ tur: "parfum", ad: `${p.marka} ${p.ad}`, alt: "Orijinal parfüm", href: `/parfum/${p.slug}` })),
    ...markalar.map((m): AramaSonucu => ({ tur: "marka", ad: m.ad, alt: "Marka", href: `/marka/${m.slug}` })),
    ...notalar.map((n): AramaSonucu => ({ tur: "nota", ad: n.ad, alt: "Nota", href: `/nota/${n.slug}` })),
  ];
}
