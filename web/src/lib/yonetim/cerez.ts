import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Yönetim girişi: tek paylaşılan şifre (ADMIN_SIFRE) ve imzalı, süreli çerez. Veritabanında oturum tutulmaz.
// Şifre değişirse tüm açık oturumlar geçersiz olur. Kimlik sağlayıcılı giriş (ADR-008) gelince bu dosya değişir.
// Yalnızca saf hesaplama içerir; proxy ve sunucu kodu ortak kullanır.

export const OTURUM_CEREZI = "yonetim_oturum";
export const CEREZ_SURESI = 60 * 60 * 24 * 7;
const EN_KISA_SIFRE = 8;

export const sifreTanimli = () => (process.env.ADMIN_SIFRE ?? "").length >= EN_KISA_SIFRE;

const anahtar = () => createHash("sha256").update(`muadil-yonetim|${process.env.ADMIN_SIFRE}`).digest();
const imza = (bitis: number) => createHmac("sha256", anahtar()).update(String(bitis)).digest("base64url");

export function sifreDogruMu(girilen: string): boolean {
  if (!sifreTanimli()) return false;
  const a = createHash("sha256").update(girilen).digest();
  const b = createHash("sha256").update(process.env.ADMIN_SIFRE!).digest();
  return timingSafeEqual(a, b);
}

export function cerezDegeri(): string {
  const bitis = Math.floor(Date.now() / 1000) + CEREZ_SURESI;
  return `${bitis}.${imza(bitis)}`;
}

/** Çerez değeri geçerli mi: imza tutuyor ve süresi dolmamış. */
export function cerezGecerliMi(deger: string | undefined): boolean {
  if (!deger || !sifreTanimli()) return false;
  const [bitisMetni, gelen] = deger.split(".");
  const bitis = Number(bitisMetni);
  if (!Number.isInteger(bitis) || !gelen || bitis < Date.now() / 1000) return false;
  const beklenen = Buffer.from(imza(bitis));
  const alinan = Buffer.from(gelen);
  return beklenen.length === alinan.length && timingSafeEqual(beklenen, alinan);
}
