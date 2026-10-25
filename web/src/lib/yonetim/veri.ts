import { and, asc, desc, eq, isNotNull, isNull, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, schema as s } from "@/db";

// Yönetim ekranlarının okuma sorguları. Herkese açık katalogdan farklı olarak önbelleksizdir ve
// silinmiş kayıtları da görebilir. Her çağıran sayfa önce yetkiGerek() çağırmalıdır.

export const SAYFA_BOYUTU = 40;

// Muadil listesinde hem muadil markası hem orijinal parfümün markası gerekir.
const orijinalMarka = alias(s.marka, "orijinal_marka");

const eslesme = (kolon: unknown, q: string) => sql`ara_norm(${kolon}) like ara_norm(${`%${q.replace(/[%_\\]/g, "\\$&")}%`})`;
const sayfaDegeri = (v: number) => Math.max(1, Math.floor(v) || 1);

export async function ozet() {
  const [r] = await db.execute<{
    parfum: number; muadil: number; nota: number; marka: number;
    parfum_gorselsiz: number; nota_gorselsiz: number; marka_gorselsiz: number; muadilsiz_parfum: number;
  }>(sql`
    select
      (select count(*) from parfum where silinme_tarihi is null)::int as parfum,
      (select count(*) from muadil where silinme_tarihi is null)::int as muadil,
      (select count(*) from nota)::int as nota,
      (select count(*) from marka)::int as marka,
      (select count(*) from parfum where silinme_tarihi is null and gorsel_url is null)::int as parfum_gorselsiz,
      (select count(*) from nota where gorsel_url is null)::int as nota_gorselsiz,
      (select count(*) from marka where gorsel_url is null)::int as marka_gorselsiz,
      (select count(*) from parfum p where silinme_tarihi is null
         and not exists (select 1 from muadil m where m.parfum_id = p.id and m.silinme_tarihi is null))::int as muadilsiz_parfum`);
  return r;
}

export type Filtre = { q?: string; sayfa?: number; gorselsiz?: boolean; silinen?: boolean };

export async function parfumSayfasi({ q, sayfa = 1, gorselsiz, silinen }: Filtre) {
  const kosullar: (SQL | undefined)[] = [
    silinen ? isNotNull(s.parfum.silinmeTarihi) : isNull(s.parfum.silinmeTarihi),
    gorselsiz ? isNull(s.parfum.gorselUrl) : undefined,
    q ? eslesme(sql`${s.marka.ad} || ' ' || ${s.parfum.ad}`, q) : undefined,
  ];
  const where = and(...kosullar);
  const [{ toplam }] = await db
    .select({ toplam: sql<number>`count(*)::int` })
    .from(s.parfum)
    .innerJoin(s.marka, eq(s.marka.id, s.parfum.markaId))
    .where(where);
  const satirlar = await db
    .select({
      id: s.parfum.id,
      ad: s.parfum.ad,
      slug: s.parfum.slug,
      gorselUrl: s.parfum.gorselUrl,
      renk: s.parfum.renk,
      markaAd: s.marka.ad,
      muadilSayisi: sql<number>`(select count(*)::int from muadil m where m.parfum_id = ${s.parfum.id} and m.silinme_tarihi is null)`,
    })
    .from(s.parfum)
    .innerJoin(s.marka, eq(s.marka.id, s.parfum.markaId))
    .where(where)
    .orderBy(asc(s.marka.ad), asc(s.parfum.ad))
    .limit(SAYFA_BOYUTU)
    .offset((sayfaDegeri(sayfa) - 1) * SAYFA_BOYUTU);
  return { satirlar, toplam };
}

export async function parfumKaydi(id: number) {
  const [p] = await db
    .select({
      id: s.parfum.id, ad: s.parfum.ad, slug: s.parfum.slug, cinsiyet: s.parfum.cinsiyet, gorselUrl: s.parfum.gorselUrl,
      renk: s.parfum.renk, silinmeTarihi: s.parfum.silinmeTarihi, markaAd: s.marka.ad,
    })
    .from(s.parfum)
    .innerJoin(s.marka, eq(s.marka.id, s.parfum.markaId))
    .where(eq(s.parfum.id, id));
  if (!p) return null;

  const notalar = await db
    .select({ ad: s.nota.ad, katman: s.parfumNota.katman })
    .from(s.parfumNota)
    .innerJoin(s.nota, eq(s.nota.id, s.parfumNota.notaId))
    .where(eq(s.parfumNota.parfumId, id))
    .orderBy(asc(s.nota.ad));
  const muadiller = await db
    .select({
      id: s.muadil.id, kod: s.muadil.kod, cinsiyet: s.muadil.cinsiyet, fiyat: s.muadil.fiyat, markaAd: s.marka.ad,
      silinmeTarihi: s.muadil.silinmeTarihi,
    })
    .from(s.muadil)
    .innerJoin(s.marka, eq(s.marka.id, s.muadil.markaId))
    .where(eq(s.muadil.parfumId, id))
    .orderBy(asc(s.muadil.fiyat));

  const katman = (k: "ust" | "orta" | "alt") => notalar.filter((n) => n.katman === k).map((n) => n.ad);
  return { ...p, notalar: { ust: katman("ust"), orta: katman("orta"), alt: katman("alt") }, muadiller };
}

export async function muadilSayfasi({ q, sayfa = 1, silinen }: Filtre) {
  const where = and(
    silinen ? isNotNull(s.muadil.silinmeTarihi) : isNull(s.muadil.silinmeTarihi),
    q
      ? sql`(${eslesme(sql`${s.marka.ad} || ' ' || ${s.muadil.kod}`, q)} or ${eslesme(sql`${orijinalMarka.ad} || ' ' || ${s.parfum.ad}`, q)})`
      : undefined,
  );
  const temel = db
    .select({ toplam: sql<number>`count(*)::int` })
    .from(s.muadil)
    .innerJoin(s.marka, eq(s.marka.id, s.muadil.markaId))
    .innerJoin(s.parfum, eq(s.parfum.id, s.muadil.parfumId))
    .innerJoin(orijinalMarka, eq(orijinalMarka.id, s.parfum.markaId))
    .where(where);
  const [{ toplam }] = await temel;
  const satirlar = await db
    .select({
      id: s.muadil.id, kod: s.muadil.kod, cinsiyet: s.muadil.cinsiyet, fiyat: s.muadil.fiyat,
      kalicilik: s.muadil.kalicilikPuani, benzerlik: s.muadil.benzerlikPuani,
      markaAd: s.marka.ad, parfumAd: s.parfum.ad, parfumMarka: orijinalMarka.ad,
    })
    .from(s.muadil)
    .innerJoin(s.marka, eq(s.marka.id, s.muadil.markaId))
    .innerJoin(s.parfum, eq(s.parfum.id, s.muadil.parfumId))
    .innerJoin(orijinalMarka, eq(orijinalMarka.id, s.parfum.markaId))
    .where(where)
    .orderBy(asc(s.marka.ad), asc(s.muadil.kod))
    .limit(SAYFA_BOYUTU)
    .offset((sayfaDegeri(sayfa) - 1) * SAYFA_BOYUTU);
  return { satirlar, toplam };
}

export async function muadilKaydi(id: number) {
  const [m] = await db
    .select({
      id: s.muadil.id, parfumId: s.muadil.parfumId, kod: s.muadil.kod, slug: s.muadil.slug, cinsiyet: s.muadil.cinsiyet,
      fiyat: s.muadil.fiyat, fiyatTarihi: s.muadil.fiyatTarihi, urunLinki: s.muadil.urunLinki,
      kalicilik: s.muadil.kalicilikPuani, benzerlik: s.muadil.benzerlikPuani, silinmeTarihi: s.muadil.silinmeTarihi,
      markaAd: s.marka.ad,
    })
    .from(s.muadil)
    .innerJoin(s.marka, eq(s.marka.id, s.muadil.markaId))
    .where(eq(s.muadil.id, id));
  return m ?? null;
}

export async function notaSayfasi({ q, sayfa = 1, gorselsiz }: Filtre) {
  const where = and(gorselsiz ? isNull(s.nota.gorselUrl) : undefined, q ? eslesme(s.nota.ad, q) : undefined);
  const [{ toplam }] = await db.select({ toplam: sql<number>`count(*)::int` }).from(s.nota).where(where);
  const satirlar = await db
    .select({
      id: s.nota.id, ad: s.nota.ad, gorselUrl: s.nota.gorselUrl,
      parfumSayisi: sql<number>`(select count(*)::int from parfum_nota pn where pn.nota_id = ${s.nota.id})`,
    })
    .from(s.nota)
    .where(where)
    .orderBy(asc(s.nota.ad))
    .limit(SAYFA_BOYUTU)
    .offset((sayfaDegeri(sayfa) - 1) * SAYFA_BOYUTU);
  return { satirlar, toplam };
}

export async function notaKaydi(id: number) {
  const [n] = await db.select().from(s.nota).where(eq(s.nota.id, id));
  if (!n) return null;
  const [{ parfumSayisi }] = await db
    .select({ parfumSayisi: sql<number>`count(distinct ${s.parfumNota.parfumId})::int` })
    .from(s.parfumNota)
    .where(eq(s.parfumNota.notaId, id));
  return { ...n, parfumSayisi };
}

export async function markaSayfasi({ gorselsiz }: Filtre) {
  return db
    .select({
      id: s.marka.id, ad: s.marka.ad, tur: s.marka.tur, gorselUrl: s.marka.gorselUrl,
      kayitSayisi: sql<number>`(select count(*)::int from parfum p where p.marka_id = ${s.marka.id} and p.silinme_tarihi is null)
        + (select count(*)::int from muadil m where m.marka_id = ${s.marka.id} and m.silinme_tarihi is null)`,
    })
    .from(s.marka)
    .where(gorselsiz ? isNull(s.marka.gorselUrl) : undefined)
    .orderBy(asc(s.marka.tur), asc(s.marka.ad));
}

// Formlardaki otomatik tamamlama listeleri

export async function markaAdlari(tur: "orijinal" | "muadil") {
  return (await db.select({ ad: s.marka.ad }).from(s.marka).where(eq(s.marka.tur, tur)).orderBy(asc(s.marka.ad))).map((m) => m.ad);
}

export async function notaAdlari() {
  return (await db.select({ ad: s.nota.ad }).from(s.nota).orderBy(asc(s.nota.ad))).map((n) => n.ad);
}

export async function parfumSecenekleri() {
  const satirlar = await db
    .select({ id: s.parfum.id, ad: s.parfum.ad, markaAd: s.marka.ad })
    .from(s.parfum)
    .innerJoin(s.marka, eq(s.marka.id, s.parfum.markaId))
    .where(isNull(s.parfum.silinmeTarihi))
    .orderBy(asc(s.marka.ad), asc(s.parfum.ad));
  return satirlar.map((p) => ({ id: p.id, etiket: `${p.markaAd} ${p.ad}` }));
}

export async function sonEklenenler() {
  const [parfumler, muadiller] = await Promise.all([
    db
      .select({ id: s.parfum.id, ad: s.parfum.ad, markaAd: s.marka.ad })
      .from(s.parfum)
      .innerJoin(s.marka, eq(s.marka.id, s.parfum.markaId))
      .where(isNull(s.parfum.silinmeTarihi))
      .orderBy(desc(s.parfum.id))
      .limit(5),
    db
      .select({ id: s.muadil.id, kod: s.muadil.kod, markaAd: s.marka.ad })
      .from(s.muadil)
      .innerJoin(s.marka, eq(s.marka.id, s.muadil.markaId))
      .where(isNull(s.muadil.silinmeTarihi))
      .orderBy(desc(s.muadil.id))
      .limit(5),
  ]);
  return { parfumler, muadiller };
}
