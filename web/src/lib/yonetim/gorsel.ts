import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";

// Yüklenen görseller UPLOAD_DIZINI'ne yazılır ve /uploads/<ad> adresinden sunulur (src/app/uploads).
// Geliştirmede varsayılan public/uploads'tır, yani mevcut kayıtlardaki /uploads/... adresleriyle aynı yer.
// Üretimde bu dizin bir Docker volume'una bağlanmalıdır; konteynerin kendi diski kalıcı değildir.

// Yol çalışma anında belirlenir; turbopackIgnore olmadan derleyici tüm projeyi (public dahil) çıktıya katar.
export const YUKLEME_DIZINI = resolve(
  /* turbopackIgnore: true */ process.env.UPLOAD_DIZINI ?? join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads"),
);

const EN_BUYUK_DOSYA = 8 * 1024 * 1024;
const EN_BUYUK_KENAR = 1200;
const DOSYA_ADI = /^[a-z0-9]{8,64}\.(webp|png|jpe?g)$/i;

export class GorselHatasi extends Error {}

/** Yüklenen dosyayı doğrular (gerçekten görsel mi), boyutunu sınırlar, WebP olarak kaydeder. Adresi döner. */
export async function gorselKaydet(dosya: File): Promise<string> {
  if (dosya.size > EN_BUYUK_DOSYA) throw new GorselHatasi("Görsel en fazla 8 MB olabilir.");
  const girdi = Buffer.from(await dosya.arrayBuffer());

  // sharp yerel kütüphane yükler; yalnızca görsel işlenirken çağrılır. Yüklenemezse giriş ve diğer eylemler etkilenmesin.
  let sharp: typeof import("sharp").default;
  try {
    sharp = (await import("sharp")).default;
  } catch (e) {
    console.error("[yonetim] sharp yüklenemedi", e);
    throw new GorselHatasi("Sunucuda görsel işleme modülü yüklenemedi; görsel kaydedilmedi.");
  }

  let cikti: Buffer;
  try {
    // Uzantıya/MIME'a güvenilmez: sharp içeriği çözemiyorsa görsel değildir.
    cikti = await sharp(girdi, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize(EN_BUYUK_KENAR, EN_BUYUK_KENAR, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer();
  } catch {
    throw new GorselHatasi("Dosya okunamadı. PNG, JPG veya WebP bir görsel yükle.");
  }

  const ad = `${randomBytes(16).toString("hex")}.webp`;
  await mkdir(/* turbopackIgnore: true */ YUKLEME_DIZINI, { recursive: true });
  await writeFile(join(/* turbopackIgnore: true */ YUKLEME_DIZINI, ad), cikti);
  return `/uploads/${ad}`;
}

/** Görsel alanlarında kullanılan, form verisinden gelen dosya var mı. */
export const dosyaVarMi = (v: FormDataEntryValue | null): v is File => v instanceof File && v.size > 0;

/** Adres artık hiçbir kayıtta kullanılmıyorsa dosyayı siler. Kayıt başarıyla güncellendikten sonra çağrılır. */
export async function yetimGorseliSil(url: string | null | undefined): Promise<void> {
  if (!url?.startsWith("/uploads/")) return;
  const ad = url.slice("/uploads/".length);
  if (!DOSYA_ADI.test(ad)) return;

  const [p, n, m] = await Promise.all([
    db.select({ id: s.parfum.id }).from(s.parfum).where(eq(s.parfum.gorselUrl, url)).limit(1),
    db.select({ id: s.nota.id }).from(s.nota).where(eq(s.nota.gorselUrl, url)).limit(1),
    db.select({ id: s.marka.id }).from(s.marka).where(eq(s.marka.gorselUrl, url)).limit(1),
  ]);
  if (p.length || n.length || m.length) return;
  await unlink(join(/* turbopackIgnore: true */ YUKLEME_DIZINI, ad)).catch(() => {});
}
