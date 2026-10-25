import { eq } from "drizzle-orm";
import { readSheet } from "read-excel-file/node";
import { db, schema as s } from "@/db";
import { notaAdiDuzenle } from "@/lib/nota-adi";
import { benzersizSlug, slugla } from "@/lib/slug";

// Excel şablonu: "Parfümler" ve "Muadiller" sayfaları. Bir nota birden fazla katmanda yer alabilir. Kurallar eski .NET içe aktarmayla aynıdır:
// tek hata bile varsa hiçbir şey kaydedilmez (ya hepsi ya hiçbiri).

export const PARFUM_SAYFASI = "Parfümler";
export const MUADIL_SAYFASI = "Muadiller";

type Cinsiyet = "kadin" | "erkek" | "unisex";

export type ParfumSatiri = {
  satir: number;
  marka: string;
  ad: string;
  cinsiyet: Cinsiyet;
  ust: string[];
  orta: string[];
  alt: string[];
};

export type MuadilSatiri = {
  satir: number;
  orijinalMarka: string;
  parfum: string;
  muadilMarka: string;
  kod: string;
  cinsiyet: Cinsiyet;
  fiyat: number;
  kalicilik: number;
  benzerlik: number;
  urunLinki: string;
};

export type SatirHatasi = { sayfa: string; satir: number; mesaj: string };

export type Ozet = {
  yeniParfum: number;
  guncellenenParfum: number;
  yeniMuadil: number;
  guncellenenMuadil: number;
  yeniMarkalar: string[];
  yeniNotalar: string[];
};

const tr = (m: string) => m.toLocaleLowerCase("tr-TR");
const anahtar = (...p: string[]) => p.map(tr).join("\u001f");

function notalar(metin: string): string[] {
  const goruldu = new Set<string>();
  const sonuc: string[] = [];
  for (const parca of metin.split(/[,;]/)) {
    const n = notaAdiDuzenle(parca);
    if (n && !goruldu.has(tr(n))) {
      goruldu.add(tr(n));
      sonuc.push(n);
    }
  }
  return sonuc;
}

function cinsiyetAyristir(metin: string): Cinsiyet | null {
  const k = tr(metin.trim());
  if (k === "") return "unisex";
  if (k === "kadın" || k === "kadin") return "kadin";
  if (k === "erkek") return "erkek";
  if (k === "unisex") return "unisex";
  return null;
}

// Cinsiyet sütunu konumla değil başlıkla bulunur: puan önerisi dosyalarında 9. sütundan sonra kanıt sütunları gelir.
const cinsiyetSutunu = (sayfa: unknown[][]) => (sayfa[0] ?? []).findIndex((b) => tr(String(b ?? "").trim()) === "cinsiyet");

const hucre = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

function fiyatAyristir(v: unknown): number | null {
  if (typeof v === "number") return Math.round(v * 100) / 100;
  const metin = hucre(v).replace("₺", "").replace(/tl/i, "").trim();
  if (!/^\d+([.,]\d{1,2})?$/.test(metin)) return null;
  return Number(metin.replace(",", "."));
}

function tamsayiAyristir(v: unknown): number | null {
  if (typeof v === "number") return Number.isInteger(v) ? v : null;
  const metin = hucre(v);
  return /^\d+$/.test(metin) ? Number(metin) : null;
}

export function linkGecerli(link: string): boolean {
  if (link.length > 500) return false;
  try {
    const u = new URL(link);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function excelOku(dosya: string | Buffer) {
  const hatalar: SatirHatasi[] = [];
  const parfumler: ParfumSatiri[] = [];
  const muadiller: MuadilSatiri[] = [];

  let parfumSayfasi: unknown[][] | null = null;
  let muadilSayfasi: unknown[][] | null = null;
  try {
    parfumSayfasi = (await readSheet(dosya as never, PARFUM_SAYFASI)) as unknown[][];
  } catch {
    /* sayfa yok */
  }
  try {
    muadilSayfasi = (await readSheet(dosya as never, MUADIL_SAYFASI)) as unknown[][];
  } catch {
    /* sayfa yok */
  }
  if (!parfumSayfasi && !muadilSayfasi) {
    hatalar.push({ sayfa: "Dosya", satir: 0, mesaj: `"${PARFUM_SAYFASI}" ve "${MUADIL_SAYFASI}" sayfaları bulunamadı. Şablonu kullan.` });
    return { parfumler, muadiller, hatalar };
  }

  const parfumCinsiyetSutunu = cinsiyetSutunu(parfumSayfasi ?? []);
  const muadilCinsiyetSutunu = cinsiyetSutunu(muadilSayfasi ?? []);

  (parfumSayfasi ?? []).slice(1).forEach((r, i) => {
    const satir = i + 2;
    if (r.slice(0, 5).every((v) => hucre(v) === "")) return;
    const h: string[] = [];
    const marka = hucre(r[0]);
    const ad = hucre(r[1]);
    const ust = notalar(hucre(r[2]));
    const orta = notalar(hucre(r[3]));
    const alt = notalar(hucre(r[4]));
    const hepsi = [...ust, ...orta, ...alt];
    const cinsiyet = cinsiyetAyristir(parfumCinsiyetSutunu < 0 ? "" : hucre(r[parfumCinsiyetSutunu]));

    if (!marka) h.push("Marka boş.");
    else if (marka.length > 100) h.push("Marka adı en fazla 100 karakter olabilir.");
    if (!ad) h.push("Parfüm adı boş.");
    else if (ad.length > 200) h.push("Parfüm adı en fazla 200 karakter olabilir.");
    if (hepsi.length === 0) h.push("En az bir nota girilmeli.");
    if (hepsi.some((n) => n.length > 100)) h.push("Nota adları en fazla 100 karakter olabilir.");
    if (!cinsiyet) h.push('Cinsiyet "Kadın", "Erkek" ya da "Unisex" olmalı (boş bırakılırsa Unisex sayılır).');

    if (h.length) h.forEach((mesaj) => hatalar.push({ sayfa: PARFUM_SAYFASI, satir, mesaj }));
    else parfumler.push({ satir, marka, ad, cinsiyet: cinsiyet!, ust, orta, alt });
  });

  (muadilSayfasi ?? []).slice(1).forEach((r, i) => {
    const satir = i + 2;
    if (r.slice(0, 8).every((v) => hucre(v) === "")) return;
    const h: string[] = [];
    const orijinalMarka = hucre(r[0]);
    const parfum = hucre(r[1]);
    const muadilMarka = hucre(r[2]);
    const kod = hucre(r[3]);
    const fiyat = fiyatAyristir(r[4]);
    const kalicilik = tamsayiAyristir(r[5]);
    const benzerlik = tamsayiAyristir(r[6]);
    const link = hucre(r[7]);
    const cinsiyet = cinsiyetAyristir(muadilCinsiyetSutunu < 0 ? "" : hucre(r[muadilCinsiyetSutunu]));

    if (!orijinalMarka) h.push("Orijinal marka boş.");
    if (!parfum) h.push("Parfüm adı boş.");
    if (!muadilMarka) h.push("Muadil marka boş.");
    else if (muadilMarka.length > 100) h.push("Muadil marka adı en fazla 100 karakter olabilir.");
    if (!kod) h.push("Kod boş.");
    else if (kod.length > 50) h.push("Kod en fazla 50 karakter olabilir.");
    if (fiyat === null || fiyat < 1 || fiyat > 100000) h.push("Fiyat 1 ile 100000 arasında olmalı (ör. 650 ya da 650,50).");
    if (kalicilik === null || kalicilik < 1 || kalicilik > 10) h.push("Kalıcılık 1 ile 10 arasında bir tam sayı olmalı.");
    if (benzerlik === null || benzerlik < 1 || benzerlik > 10) h.push("Benzerlik 1 ile 10 arasında bir tam sayı olmalı.");
    if (!linkGecerli(link)) h.push("Ürün linki https:// ile başlayan geçerli bir adres olmalı.");
    if (!cinsiyet) h.push('Cinsiyet "Kadın", "Erkek" ya da "Unisex" olmalı (boş bırakılırsa Unisex sayılır).');

    if (h.length) h.forEach((mesaj) => hatalar.push({ sayfa: MUADIL_SAYFASI, satir, mesaj }));
    else
      muadiller.push({
        satir, orijinalMarka, parfum, muadilMarka, kod, cinsiyet: cinsiyet!,
        fiyat: fiyat!, kalicilik: kalicilik!, benzerlik: benzerlik!, urunLinki: link,
      });
  });

  return { parfumler, muadiller, hatalar };
}

/** Satırları veritabanına uygular. kaydet=false ise yalnızca ne olacağını döner (kuru çalıştırma). */
export async function uygula(
  parfumSatirlari: ParfumSatiri[],
  muadilSatirlari: MuadilSatiri[],
  kaydet: boolean,
): Promise<{ ozet: Ozet | null; hatalar: SatirHatasi[] }> {
  const hatalar: SatirHatasi[] = [];

  return db.transaction(async (tx) => {
    const markalar = new Map((await tx.select().from(s.marka)).map((m) => [tr(m.ad), m]));
    const notaTablosu = new Map((await tx.select().from(s.nota)).map((n) => [tr(n.ad), n]));
    const parfumTablosu = new Map(
      (await tx.select({ p: s.parfum, markaAd: s.marka.ad }).from(s.parfum).innerJoin(s.marka, eq(s.marka.id, s.parfum.markaId))).map(
        (r) => [anahtar(r.markaAd, r.p.ad), r.p],
      ),
    );
    const muadilTablosu = new Map(
      (await tx.select({ m: s.muadil, markaAd: s.marka.ad }).from(s.muadil).innerJoin(s.marka, eq(s.marka.id, s.muadil.markaId))).map(
        (r) => [anahtar(r.markaAd, r.m.kod, r.m.cinsiyet), r.m],
      ),
    );
    const slugMarka = new Set([...markalar.values()].map((m) => m.slug));
    const slugNota = new Set([...notaTablosu.values()].map((n) => n.slug));
    const slugParfum = new Set([...parfumTablosu.values()].map((p) => p.slug));
    const slugMuadil = new Set([...muadilTablosu.values()].map((m) => m.slug));

    const yeniMarkalar: string[] = [];
    const yeniNotalar: string[] = [];
    let yeniParfum = 0, guncellenenParfum = 0, yeniMuadil = 0, guncellenenMuadil = 0;

    async function markaBul(ad: string, tur: "orijinal" | "muadil", sayfa: string, satir: number) {
      const var_ = markalar.get(tr(ad));
      if (var_) {
        if (var_.tur === tur) return var_;
        hatalar.push({ sayfa, satir, mesaj: `"${var_.ad}" sistemde ${var_.tur} marka olarak kayıtlı.` });
        return null;
      }
      const [yeni] = await tx.insert(s.marka).values({ ad, slug: benzersizSlug(slugla(ad), slugMarka), tur }).returning();
      markalar.set(tr(ad), yeni);
      yeniMarkalar.push(ad);
      return yeni;
    }

    async function notaBul(ad: string) {
      const var_ = notaTablosu.get(tr(ad));
      if (var_) return var_;
      const [yeni] = await tx.insert(s.nota).values({ ad, slug: benzersizSlug(slugla(ad), slugNota) }).returning();
      notaTablosu.set(tr(ad), yeni);
      yeniNotalar.push(ad);
      return yeni;
    }

    const dosyadakiParfumler = new Set<string>();
    for (const p of parfumSatirlari) {
      const k = anahtar(p.marka, p.ad);
      if (!dosyadakiParfumler.add(k)) {
        hatalar.push({ sayfa: PARFUM_SAYFASI, satir: p.satir, mesaj: `${p.marka} ${p.ad} dosyada birden fazla kez var.` });
        continue;
      }
      const marka = await markaBul(p.marka, "orijinal", PARFUM_SAYFASI, p.satir);
      if (!marka) continue;

      const hedef: { notaId: number; katman: "ust" | "orta" | "alt" }[] = [];
      for (const [katman, liste] of [["ust", p.ust], ["orta", p.orta], ["alt", p.alt]] as const)
        for (const ad of liste) hedef.push({ notaId: (await notaBul(ad)).id, katman });

      let parfum = parfumTablosu.get(k);
      if (parfum) {
        await tx.update(s.parfum).set({ cinsiyet: p.cinsiyet, silinmeTarihi: null }).where(eq(s.parfum.id, parfum.id));
        await tx.delete(s.parfumNota).where(eq(s.parfumNota.parfumId, parfum.id));
        guncellenenParfum++;
      } else {
        [parfum] = await tx
          .insert(s.parfum)
          .values({ markaId: marka.id, ad: p.ad, slug: benzersizSlug(slugla(`${p.marka} ${p.ad}`), slugParfum), cinsiyet: p.cinsiyet })
          .returning();
        parfumTablosu.set(k, parfum);
        yeniParfum++;
      }
      if (hedef.length) await tx.insert(s.parfumNota).values(hedef.map((h) => ({ parfumId: parfum!.id, ...h })));
    }

    const dosyadakiMuadiller = new Set<string>();
    for (const m of muadilSatirlari) {
      const parfum = parfumTablosu.get(anahtar(m.orijinalMarka, m.parfum));
      if (!parfum) {
        hatalar.push({
          sayfa: MUADIL_SAYFASI,
          satir: m.satir,
          mesaj: `"${m.orijinalMarka} ${m.parfum}" bulunamadı. Parfümler sayfasına ekle ya da adını kontrol et.`,
        });
        continue;
      }
      const marka = await markaBul(m.muadilMarka, "muadil", MUADIL_SAYFASI, m.satir);
      if (!marka) continue;

      const k = anahtar(marka.ad, m.kod, m.cinsiyet);
      if (!dosyadakiMuadiller.add(k)) {
        hatalar.push({ sayfa: MUADIL_SAYFASI, satir: m.satir, mesaj: `${marka.ad} ${m.kod} (${m.cinsiyet}) dosyada birden fazla kez var.` });
        continue;
      }

      const mevcut = muadilTablosu.get(k);
      const fiyat = m.fiyat.toFixed(2);
      if (mevcut) {
        await tx
          .update(s.muadil)
          .set({
            parfumId: parfum.id,
            fiyat,
            // Fiyat tarihi yalnızca fiyat değiştiğinde yenilenir.
            ...(Number(mevcut.fiyat) !== m.fiyat && { fiyatTarihi: new Date() }),
            kalicilikPuani: m.kalicilik,
            benzerlikPuani: m.benzerlik,
            urunLinki: m.urunLinki,
            silinmeTarihi: null,
          })
          .where(eq(s.muadil.id, mevcut.id));
        guncellenenMuadil++;
      } else {
        const [yeni] = await tx
          .insert(s.muadil)
          .values({
            parfumId: parfum.id,
            markaId: marka.id,
            kod: m.kod,
            slug: benzersizSlug(slugla(`${marka.ad} ${m.kod}`), slugMuadil),
            cinsiyet: m.cinsiyet,
            fiyat,
            urunLinki: m.urunLinki,
            kalicilikPuani: m.kalicilik,
            benzerlikPuani: m.benzerlik,
          })
          .returning();
        muadilTablosu.set(k, yeni);
        yeniMuadil++;
      }
    }

    // Hata varsa ya da kuru çalıştırmaysa işlem hata fırlatılarak geri alınır.
    if (hatalar.length > 0 || !kaydet) {
      const ozet = { yeniParfum, guncellenenParfum, yeniMuadil, guncellenenMuadil, yeniMarkalar, yeniNotalar };
      throw new GeriAl(hatalar.length > 0 ? null : ozet, hatalar);
    }
    return {
      ozet: { yeniParfum, guncellenenParfum, yeniMuadil, guncellenenMuadil, yeniMarkalar, yeniNotalar },
      hatalar,
    };
  }).catch((e) => {
    if (e instanceof GeriAl) return { ozet: e.ozet, hatalar: e.hatalar };
    throw e;
  });
}

class GeriAl extends Error {
  constructor(public ozet: Ozet | null, public hatalar: SatirHatasi[]) {
    super("geri alındı");
  }
}
