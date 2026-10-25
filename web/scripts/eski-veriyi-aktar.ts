// Tek seferlik: eski .NET sürümünün Postgres verisini yeni şemaya taşır.
// Kullanım: ESKI_DATABASE_URL ve DATABASE_URL tanımlıyken `npx tsx scripts/eski-veriyi-aktar.ts`
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import * as s from "../src/db/schema";
import { benzersizSlug, slugla } from "../src/lib/slug";

const eski = postgres(process.env.ESKI_DATABASE_URL!);
const yeniSql = postgres(process.env.DATABASE_URL!);
const db = drizzle(yeniSql, { schema: s });

const CINSIYET = { 1: "kadin", 2: "erkek", 3: "unisex" } as const;
const TUR = { 1: "orijinal", 2: "muadil" } as const;
const KATMAN = { 1: "ust", 2: "orta", 3: "alt" } as const;

async function main() {
const markalar = await eski`select * from "Markalar" order by "Id"`;
const parfumler = await eski`select * from "Parfumler" where "SilinmeTarihi" is null order by "Id"`;
const muadiller = await eski`select * from "MuadilParfumler" where "SilinmeTarihi" is null order by "Id"`;
const notalar = await eski`select * from "Notalar" order by "Id"`;
const parfumNotalar = await eski`select * from "ParfumNotalar"`;

await db.transaction(async (tx) => {
  // Yeniden çalıştırılabilsin diye önce boşalt.
  await tx.execute(
    sql`truncate cikis_tiklamasi, arama_logu, parfum_nota, muadil, parfum, nota, marka restart identity cascade`,
  );

  const markaSlug = new Set<string>();
  const markaId = new Map<number, number>();
  for (const m of markalar) {
    const [r] = await tx
      .insert(s.marka)
      .values({ ad: m.Ad, slug: benzersizSlug(slugla(m.Ad), markaSlug), tur: TUR[m.Tur as 1 | 2], gorselUrl: m.GorselUrl })
      .returning({ id: s.marka.id });
    markaId.set(m.Id, r.id);
  }

  const notaSlug = new Set<string>();
  const notaId = new Map<number, number>();
  for (const n of notalar) {
    const [r] = await tx
      .insert(s.nota)
      .values({ ad: n.Ad, slug: benzersizSlug(slugla(n.Ad), notaSlug), gorselUrl: n.GorselUrl, aciklama: n.Aciklama })
      .returning({ id: s.nota.id });
    notaId.set(n.Id, r.id);
  }

  const markaAd = new Map(markalar.map((m) => [m.Id, m.Ad as string]));
  const parfumSlug = new Set<string>();
  const parfumId = new Map<number, number>();
  for (const p of parfumler) {
    const [r] = await tx
      .insert(s.parfum)
      .values({
        markaId: markaId.get(p.MarkaId)!,
        ad: p.Ad,
        slug: benzersizSlug(slugla(`${markaAd.get(p.MarkaId)} ${p.Ad}`), parfumSlug),
        cinsiyet: CINSIYET[p.Cinsiyet as 1 | 2 | 3],
        gorselUrl: p.GorselUrl,
        renk: p.Renk,
      })
      .returning({ id: s.parfum.id });
    parfumId.set(p.Id, r.id);
  }

  const aktifPn = parfumNotalar.filter((x) => parfumId.has(x.ParfumId));
  if (aktifPn.length)
    await tx.insert(s.parfumNota).values(
      aktifPn.map((x) => ({
        parfumId: parfumId.get(x.ParfumId)!,
        notaId: notaId.get(x.NotaId)!,
        katman: KATMAN[x.Katman as 1 | 2 | 3],
      })),
    );

  const muadilSlug = new Set<string>();
  let atlanan = 0;
  for (const m of muadiller) {
    if (!parfumId.has(m.ParfumId)) {
      atlanan++;
      continue;
    }
    await tx.insert(s.muadil).values({
      parfumId: parfumId.get(m.ParfumId)!,
      markaId: markaId.get(m.MarkaId)!,
      kod: m.Kod,
      slug: benzersizSlug(slugla(`${markaAd.get(m.MarkaId)} ${m.Kod}`), muadilSlug),
      cinsiyet: CINSIYET[m.Cinsiyet as 1 | 2 | 3],
      fiyat: String(m.Fiyat),
      urunLinki: m.UrunLinki,
      kalicilikPuani: m.KalicilikPuani,
      benzerlikPuani: m.BenzerlikPuani,
    });
  }
  console.log({ marka: markalar.length, nota: notalar.length, parfum: parfumler.length, parfumNota: aktifPn.length, muadil: muadiller.length - atlanan, silinmisParfumunMuadiliAtlanan: atlanan });
});

await eski.end();
await yeniSql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
