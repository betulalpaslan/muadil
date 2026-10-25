"use server";

import { and, eq, isNull, like, ne, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema as s } from "@/db";
import { linkGecerli } from "@/lib/ice-aktar";
import { notaAdiDuzenle } from "@/lib/nota-adi";
import { benzersizSlug, slugla } from "@/lib/slug";
import { CEREZ_SURESI, OTURUM_CEREZI, cerezDegeri, sifreDogruMu, sifreTanimli } from "@/lib/yonetim/cerez";
import { GorselHatasi, dosyaVarMi, gorselKaydet, yetimGorseliSil } from "@/lib/yonetim/gorsel";
import { yetkiGerek } from "@/lib/yonetim/oturum";

// Her eylem başında yetkiGerek() çağırır: form yalnızca giriş yapmış sayfada görünse de eylem uçları herkese açıktır.

export type Sonuc = { hata?: string } | undefined;

type Cinsiyet = "kadin" | "erkek" | "unisex";
const CINSIYETLER: Cinsiyet[] = ["kadin", "erkek", "unisex"];
type Katman = "ust" | "orta" | "alt";
const KATMANLAR: Katman[] = ["ust", "orta", "alt"];

const tr = (m: string) => m.toLocaleLowerCase("tr-TR");
const metin = (fd: FormData, ad: string) => String(fd.get(ad) ?? "").trim();
const tamsayi = (v: string) => (/^\d+$/.test(v) ? Number(v) : null);

class Hata extends Error {}

// Eylemleri ortak sarar: doğrulama hataları forma metin olarak döner, beklenmeyenler loglanır.
async function sarmala(is: () => Promise<void>): Promise<Sonuc> {
  try {
    await is();
  } catch (e) {
    if (e instanceof Hata || e instanceof GorselHatasi) return { hata: e.message };
    if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    console.error("[yonetim]", e);
    return { hata: "Beklenmeyen bir hata oluştu. Kayıt yapılmadı; tekrar dene." };
  }
}

function tazele() {
  updateTag("katalog");
  revalidatePath("/yonetim", "layout");
}

// ---------- Giriş / çıkış ----------

// Kaba kuvvet denemelerini yavaşlatır: aynı adresten 15 dakikada en çok 8 yanlış şifre. Süreç belleğinde tutulur.
const denemeler = new Map<string, { sayi: number; bitis: number }>();

export async function girisYap(_onceki: Sonuc, fd: FormData): Promise<Sonuc> {
  if (!sifreTanimli()) return { hata: "Yönetim kapalı: sunucuda ADMIN_SIFRE (en az 8 karakter) tanımlı değil." };

  const adres = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "yerel";
  const simdi = Date.now();
  const kayit = denemeler.get(adres);
  if (kayit && kayit.bitis > simdi && kayit.sayi >= 8) return { hata: "Çok fazla yanlış deneme. Biraz bekleyip tekrar dene." };

  if (!sifreDogruMu(metin(fd, "sifre"))) {
    const yeni = kayit && kayit.bitis > simdi ? { ...kayit, sayi: kayit.sayi + 1 } : { sayi: 1, bitis: simdi + 15 * 60_000 };
    denemeler.set(adres, yeni);
    return { hata: "Şifre yanlış." };
  }

  denemeler.delete(adres);
  (await cookies()).set(OTURUM_CEREZI, cerezDegeri(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CEREZ_SURESI,
  });
  redirect("/yonetim");
}

export async function cikisYap() {
  (await cookies()).delete(OTURUM_CEREZI);
  redirect("/yonetim/giris");
}

// ---------- Ortak parçalar ----------

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Markayı büyük/küçük harf ve Türkçe karakter duyarsız bulur, yoksa oluşturur. Tür çakışırsa hata verir. */
async function markaBul(tx: Tx, ad: string, tur: "orijinal" | "muadil") {
  if (!ad) throw new Hata("Marka adı boş olamaz.");
  if (ad.length > 100) throw new Hata("Marka adı en fazla 100 karakter olabilir.");
  const hepsi = await tx.select().from(s.marka);
  const var_ = hepsi.find((m) => tr(m.ad) === tr(ad));
  if (var_) {
    if (var_.tur !== tur)
      throw new Hata(`"${var_.ad}" sistemde ${var_.tur === "orijinal" ? "orijinal" : "muadil"} marka olarak kayıtlı; bu alanda ${tur} marka girilmeli.`);
    return var_;
  }
  const [yeni] = await tx
    .insert(s.marka)
    .values({ ad, slug: benzersizSlug(slugla(ad), new Set(hepsi.map((m) => m.slug))), tur })
    .returning();
  return yeni;
}

async function slugUret(tx: Tx, tablo: typeof s.parfum | typeof s.muadil | typeof s.nota, ad: string) {
  const taban = slugla(ad);
  const kullanilan = new Set(
    (await tx.select({ slug: tablo.slug }).from(tablo).where(like(tablo.slug, `${taban}%`))).map((r) => r.slug),
  );
  return benzersizSlug(taban, kullanilan);
}

/** Forma gelen görseli işler: yeni dosya varsa kaydeder, "kaldır" işaretliyse null yapar, yoksa mevcut adresi korur. */
async function gorselKarari(fd: FormData, mevcut: string | null): Promise<string | null> {
  const dosya = fd.get("gorsel");
  if (dosyaVarMi(dosya)) return gorselKaydet(dosya);
  if (fd.get("gorselKaldir") === "1") return null;
  return mevcut;
}

function notalariOku(fd: FormData): Record<Katman, string[]> {
  const sonuc = { ust: [], orta: [], alt: [] } as Record<Katman, string[]>;
  for (const k of KATMANLAR) {
    const goruldu = new Set<string>();
    let liste: unknown;
    try {
      liste = JSON.parse(metin(fd, k) || "[]");
    } catch {
      throw new Hata("Nota listesi okunamadı. Sayfayı yenileyip tekrar dene.");
    }
    if (!Array.isArray(liste)) throw new Hata("Nota listesi okunamadı.");
    for (const ham of liste) {
      const ad = notaAdiDuzenle(String(ham));
      if (!ad) continue;
      if (ad.length > 100) throw new Hata(`"${ad.slice(0, 30)}…" nota adı en fazla 100 karakter olabilir.`);
      if (goruldu.has(tr(ad))) throw new Hata(`"${ad}" bu katmana iki kez girilmiş.`);
      goruldu.add(tr(ad));
      sonuc[k].push(ad);
    }
  }
  if (!KATMANLAR.some((k) => sonuc[k].length)) throw new Hata("En az bir nota girilmeli.");
  return sonuc;
}

const benzersizlikHatasi = (e: unknown) => (e as { code?: string })?.code === "23505";

// ---------- Parfüm ----------

export async function parfumKaydet(id: number | null, _onceki: Sonuc, fd: FormData): Promise<Sonuc> {
  await yetkiGerek();
  let yeniId = id;
  let eskiGorsel: string | null = null;

  const sonuc = await sarmala(async () => {
    const markaAd = metin(fd, "marka");
    const ad = metin(fd, "ad");
    const cinsiyet = metin(fd, "cinsiyet") as Cinsiyet;
    const renk = metin(fd, "renk");
    if (!ad) throw new Hata("Parfüm adı boş olamaz.");
    if (ad.length > 200) throw new Hata("Parfüm adı en fazla 200 karakter olabilir.");
    if (!CINSIYETLER.includes(cinsiyet)) throw new Hata("Cinsiyet seçilmeli.");
    if (renk && !/^#[0-9a-f]{6}$/i.test(renk)) throw new Hata("Renk #rrggbb biçiminde olmalı.");
    const notalar = notalariOku(fd);

    const mevcut = id ? (await db.select().from(s.parfum).where(eq(s.parfum.id, id)))[0] : undefined;
    if (id && !mevcut) throw new Hata("Parfüm bulunamadı; silinmiş olabilir.");
    // Görsel transaction dışında işlenir: dosya yazma geri alınamaz, hata olursa kayıt hiç başlamaz.
    const gorselUrl = await gorselKarari(fd, mevcut?.gorselUrl ?? null);
    eskiGorsel = mevcut?.gorselUrl ?? null;

    try {
      await db.transaction(async (tx) => {
        const marka = await markaBul(tx, markaAd, "orijinal");
        const cakisan = await tx
          .select({ id: s.parfum.id })
          .from(s.parfum)
          .where(and(eq(s.parfum.markaId, marka.id), eq(s.parfum.ad, ad), id ? ne(s.parfum.id, id) : undefined));
        if (cakisan.length) throw new Hata(`"${marka.ad} ${ad}" zaten kayıtlı.`);

        const degerler = { markaId: marka.id, ad, cinsiyet, gorselUrl, renk: renk ? renk.toLowerCase() : null };
        if (mevcut) {
          await tx.update(s.parfum).set(degerler).where(eq(s.parfum.id, mevcut.id));
        } else {
          const [yeni] = await tx
            .insert(s.parfum)
            .values({ ...degerler, slug: await slugUret(tx, s.parfum, `${marka.ad} ${ad}`) })
            .returning({ id: s.parfum.id });
          yeniId = yeni.id;
        }

        const notaTablosu = new Map((await tx.select().from(s.nota)).map((n) => [tr(n.ad), n]));
        const notaSlugleri = new Set([...notaTablosu.values()].map((n) => n.slug));
        const hedef: { parfumId: number; notaId: number; katman: Katman }[] = [];
        for (const k of KATMANLAR)
          for (const notaAd of notalar[k]) {
            let nota = notaTablosu.get(tr(notaAd));
            if (!nota) {
              [nota] = await tx.insert(s.nota).values({ ad: notaAd, slug: benzersizSlug(slugla(notaAd), notaSlugleri) }).returning();
              notaTablosu.set(tr(notaAd), nota);
            }
            hedef.push({ parfumId: yeniId!, notaId: nota.id, katman: k });
          }
        await tx.delete(s.parfumNota).where(eq(s.parfumNota.parfumId, yeniId!));
        await tx.insert(s.parfumNota).values(hedef);
      });
    } catch (e) {
      // Kayıt başarısızsa az önce yazılan yeni görsel yetim kalır; temizlenir.
      if (gorselUrl !== eskiGorsel) await yetimGorseliSil(gorselUrl);
      if (benzersizlikHatasi(e)) throw new Hata("Bu parfüm zaten kayıtlı ya da adres çakıştı. Listeyi kontrol et.");
      throw e;
    }
    if (eskiGorsel !== gorselUrl) await yetimGorseliSil(eskiGorsel);
  });
  if (sonuc) return sonuc;

  tazele();
  redirect(`/yonetim/parfumler/${yeniId}?${id ? "guncellendi" : "eklendi"}=1`);
}

export async function parfumSil(id: number): Promise<Sonuc> {
  await yetkiGerek();
  const sonuc = await sarmala(async () => {
    const [{ adet }] = await db
      .select({ adet: sql<number>`count(*)::int` })
      .from(s.muadil)
      .where(and(eq(s.muadil.parfumId, id), isNull(s.muadil.silinmeTarihi)));
    if (adet > 0) throw new Hata(`Bu parfümün ${adet} muadili var. Önce muadilleri sil ya da başka parfüme taşı.`);
    await db.update(s.parfum).set({ silinmeTarihi: new Date() }).where(eq(s.parfum.id, id));
  });
  if (sonuc) return sonuc;
  tazele();
  redirect("/yonetim/parfumler");
}

export async function parfumGeriGetir(id: number): Promise<Sonuc> {
  await yetkiGerek();
  await db.update(s.parfum).set({ silinmeTarihi: null }).where(eq(s.parfum.id, id));
  tazele();
  redirect(`/yonetim/parfumler/${id}`);
}

// ---------- Muadil ----------

export async function muadilKaydet(id: number | null, _onceki: Sonuc, fd: FormData): Promise<Sonuc> {
  await yetkiGerek();
  let yeniId = id;

  const sonuc = await sarmala(async () => {
    const parfumId = tamsayi(metin(fd, "parfumId"));
    const markaAd = metin(fd, "marka");
    const kod = metin(fd, "kod");
    const cinsiyet = metin(fd, "cinsiyet") as Cinsiyet;
    const fiyatMetni = metin(fd, "fiyat").replace("₺", "").replace(/tl/i, "").trim();
    const link = metin(fd, "urunLinki");
    const kalicilik = tamsayi(metin(fd, "kalicilik"));
    const benzerlik = tamsayi(metin(fd, "benzerlik"));

    if (!parfumId) throw new Hata("Listeden bir orijinal parfüm seç.");
    if (!kod) throw new Hata("Kod boş olamaz.");
    if (kod.length > 50) throw new Hata("Kod en fazla 50 karakter olabilir.");
    if (!CINSIYETLER.includes(cinsiyet)) throw new Hata("Cinsiyet seçilmeli.");
    if (!/^\d+([.,]\d{1,2})?$/.test(fiyatMetni)) throw new Hata("Fiyat sayı olmalı (ör. 650 ya da 650,50).");
    const fiyat = Number(fiyatMetni.replace(",", "."));
    if (fiyat < 1 || fiyat > 100000) throw new Hata("Fiyat 1 ile 100000 arasında olmalı.");
    if (!linkGecerli(link)) throw new Hata("Ürün linki https:// ile başlayan geçerli bir adres olmalı (en fazla 500 karakter).");
    if (kalicilik === null || kalicilik < 1 || kalicilik > 10) throw new Hata("Kalıcılık 1 ile 10 arasında bir tam sayı olmalı.");
    if (benzerlik === null || benzerlik < 1 || benzerlik > 10) throw new Hata("Benzerlik 1 ile 10 arasında bir tam sayı olmalı.");

    try {
      await db.transaction(async (tx) => {
        const [parfum] = await tx.select({ id: s.parfum.id }).from(s.parfum).where(and(eq(s.parfum.id, parfumId), isNull(s.parfum.silinmeTarihi)));
        if (!parfum) throw new Hata("Seçilen parfüm bulunamadı.");
        const marka = await markaBul(tx, markaAd, "muadil");

        const cakisan = await tx
          .select({ id: s.muadil.id })
          .from(s.muadil)
          .where(and(eq(s.muadil.markaId, marka.id), eq(s.muadil.kod, kod), eq(s.muadil.cinsiyet, cinsiyet), id ? ne(s.muadil.id, id) : undefined));
        if (cakisan.length) throw new Hata(`${marka.ad} ${kod} (${cinsiyet}) zaten kayıtlı.`);

        const degerler = {
          parfumId, markaId: marka.id, kod, cinsiyet, fiyat: fiyat.toFixed(2), urunLinki: link,
          kalicilikPuani: kalicilik, benzerlikPuani: benzerlik,
        };
        if (id) {
          const [mevcut] = await tx.select().from(s.muadil).where(eq(s.muadil.id, id));
          if (!mevcut) throw new Hata("Muadil bulunamadı; silinmiş olabilir.");
          // Fiyat tarihi yalnızca fiyat değiştiğinde yenilenir (içe aktarmayla aynı kural).
          await tx
            .update(s.muadil)
            .set({ ...degerler, ...(Number(mevcut.fiyat) !== fiyat && { fiyatTarihi: new Date() }) })
            .where(eq(s.muadil.id, id));
        } else {
          const [yeni] = await tx
            .insert(s.muadil)
            .values({ ...degerler, slug: await slugUret(tx, s.muadil, `${marka.ad} ${kod}`) })
            .returning({ id: s.muadil.id });
          yeniId = yeni.id;
        }
      });
    } catch (e) {
      if (benzersizlikHatasi(e)) throw new Hata("Bu muadil zaten kayıtlı ya da adres çakıştı. Listeyi kontrol et.");
      throw e;
    }
  });
  if (sonuc) return sonuc;

  tazele();
  redirect(`/yonetim/muadiller/${yeniId}?${id ? "guncellendi" : "eklendi"}=1`);
}

export async function muadilSil(id: number): Promise<Sonuc> {
  await yetkiGerek();
  await db.update(s.muadil).set({ silinmeTarihi: new Date() }).where(eq(s.muadil.id, id));
  tazele();
  redirect("/yonetim/muadiller");
}

export async function muadilGeriGetir(id: number): Promise<Sonuc> {
  await yetkiGerek();
  const sonuc = await sarmala(async () => {
    const [m] = await db
      .select({ parfumSilinmis: s.parfum.silinmeTarihi })
      .from(s.muadil)
      .innerJoin(s.parfum, eq(s.parfum.id, s.muadil.parfumId))
      .where(eq(s.muadil.id, id));
    if (m?.parfumSilinmis) throw new Hata("Bu muadilin orijinal parfümü silinmiş. Önce parfümü geri getir.");
    await db.update(s.muadil).set({ silinmeTarihi: null }).where(eq(s.muadil.id, id));
  });
  if (sonuc) return sonuc;
  tazele();
  redirect(`/yonetim/muadiller/${id}`);
}

// ---------- Nota ----------

export async function notaKaydet(id: number | null, _onceki: Sonuc, fd: FormData): Promise<Sonuc> {
  await yetkiGerek();
  let yeniId = id;
  let eskiGorsel: string | null = null;

  const sonuc = await sarmala(async () => {
    const ad = notaAdiDuzenle(metin(fd, "ad"));
    const aciklama = metin(fd, "aciklama");
    if (!ad) throw new Hata("Nota adı boş olamaz.");
    if (ad.length > 100) throw new Hata("Nota adı en fazla 100 karakter olabilir.");
    if (aciklama.length > 2000) throw new Hata("Açıklama en fazla 2000 karakter olabilir.");

    const mevcut = id ? (await db.select().from(s.nota).where(eq(s.nota.id, id)))[0] : undefined;
    if (id && !mevcut) throw new Hata("Nota bulunamadı.");
    const gorselUrl = await gorselKarari(fd, mevcut?.gorselUrl ?? null);
    eskiGorsel = mevcut?.gorselUrl ?? null;

    try {
      await db.transaction(async (tx) => {
        const hepsi = await tx.select({ id: s.nota.id, ad: s.nota.ad }).from(s.nota);
        if (hepsi.some((n) => n.id !== id && tr(n.ad) === tr(ad))) throw new Hata(`"${ad}" notası zaten var.`);
        const degerler = { ad, aciklama: aciklama || null, gorselUrl };
        if (mevcut) await tx.update(s.nota).set(degerler).where(eq(s.nota.id, mevcut.id));
        else {
          const [yeni] = await tx
            .insert(s.nota)
            .values({ ...degerler, slug: await slugUret(tx, s.nota, ad) })
            .returning({ id: s.nota.id });
          yeniId = yeni.id;
        }
      });
    } catch (e) {
      if (gorselUrl !== eskiGorsel) await yetimGorseliSil(gorselUrl);
      if (benzersizlikHatasi(e)) throw new Hata("Bu nota zaten kayıtlı.");
      throw e;
    }
    if (eskiGorsel !== gorselUrl) await yetimGorseliSil(eskiGorsel);
  });
  if (sonuc) return sonuc;

  tazele();
  redirect(`/yonetim/notalar/${yeniId}?${id ? "guncellendi" : "eklendi"}=1`);
}

export async function notaSil(id: number): Promise<Sonuc> {
  await yetkiGerek();
  let gorsel: string | null = null;
  const sonuc = await sarmala(async () => {
    const [{ adet }] = await db.select({ adet: sql<number>`count(distinct ${s.parfumNota.parfumId})::int` }).from(s.parfumNota).where(eq(s.parfumNota.notaId, id));
    if (adet > 0) throw new Hata(`Bu nota ${adet} parfümde kullanılıyor; silinemez. Önce o parfümlerden çıkar.`);
    const [silinen] = await db.delete(s.nota).where(eq(s.nota.id, id)).returning({ gorselUrl: s.nota.gorselUrl });
    gorsel = silinen?.gorselUrl ?? null;
  });
  if (sonuc) return sonuc;
  await yetimGorseliSil(gorsel);
  tazele();
  redirect("/yonetim/notalar");
}

// ---------- Listelerden hızlı görsel yükleme (parfüm, nota, marka) ----------

export async function hizliGorselYukle(tur: "parfum" | "nota" | "marka", id: number, fd: FormData): Promise<Sonuc> {
  await yetkiGerek();
  let eski: string | null = null;
  const sonuc = await sarmala(async () => {
    const dosya = fd.get("gorsel");
    if (!dosyaVarMi(dosya)) throw new Hata("Bir görsel seç.");
    const tablo = { parfum: s.parfum, nota: s.nota, marka: s.marka }[tur];
    if (!tablo) throw new Hata("Geçersiz tür.");
    const [mevcut] = await db.select({ gorselUrl: tablo.gorselUrl }).from(tablo).where(eq(tablo.id, id));
    if (!mevcut) throw new Hata("Kayıt bulunamadı.");
    eski = mevcut.gorselUrl;
    const url = await gorselKaydet(dosya);
    await db.update(tablo).set({ gorselUrl: url }).where(eq(tablo.id, id));
  });
  if (sonuc) return sonuc;
  await yetimGorseliSil(eski);
  tazele();
}
