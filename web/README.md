# Muadil web

Next.js (App Router) + Postgres (Drizzle). Mimari kararı: `docs/adr/008-yeniden-mimari.md`.

## Yerel çalışma
```bash
cp .env.example .env            # POSTGRES_PASSWORD, DATABASE_URL, YENILE_ANAHTARI doldur
docker compose up -d            # Postgres, port 5433
npx drizzle-kit migrate         # şema
npx tsx scripts/excel-aktar.ts ../muadil-48-gecici-puan.xlsx --kaydet   # veri
npm run dev
```
`npm run build` sayfaları veritabanından üretir; DATABASE_URL erişilebilir olmalı.

## Excel ile veri yükleme
Şablon: `Parfümler` ve `Muadiller` sayfaları (eski şablonla aynı; "Cinsiyet" sütunu başlıkla bulunur, yoksa Unisex).
```bash
npx tsx scripts/excel-aktar.ts dosya.xlsx            # kuru çalıştırma, hiçbir şey yazmaz
npx tsx scripts/excel-aktar.ts dosya.xlsx --kaydet   # kaydeder; YENILE_URL ve YENILE_ANAHTARI varsa önbelleği tazeler
```
Tek hata bile varsa hiçbir şey kaydedilmez.

## Yönetim paneli (`/yonetim`)
Parfüm, muadil, nota ekleme/düzenleme/silme ve görsel (parfüm, nota, marka logosu) yükleme. Giriş: `.env` içindeki `ADMIN_SIFRE` (en az 8 karakter; boşsa panel kapalı kalır).
Kimlik sağlayıcılı giriş (ADR-008'deki "Google, e-posta izin listesi") gelene kadar tek paylaşılan şifre ve imzalı çerez kullanılır; şifreyi değiştirmek açık oturumları kapatır.
- Parfüm eklerken olmayan marka ve nota otomatik oluşur; notaların görselini Notalar sayfasından eklersin.
- Silme geri alınabilir (parfüm, muadil). Muadili olan parfüm ve parfümde kullanılan nota silinemez.
- Görseller doğrulanır, en çok 1200 px'e küçültülür ve WebP olarak `UPLOAD_DIZINI`'ne yazılır (varsayılan `public/uploads`), `/uploads/<ad>` adresinden sunulur.
- Kayıttan sonra katalog önbelleği otomatik tazelenir (`/api/yenile` gerekmez).

## Eski verinin taşınması (tek seferlik)
`scripts/eski-veriyi-aktar.ts` eski .NET veritabanını (ESKI_DATABASE_URL) yeni şemaya taşır.

## Üretim
`.env` (sunucuda): `POSTGRES_PASSWORD`, `SITE_HOST`, `YENILE_ANAHTARI`, `ADMIN_SIFRE`. Sonra `./deploy.sh`.
Yüklenen görseller `uploads` Docker volume'unda (`/uploads`) tutulur; imajda değil, bu yüzden dağıtımda kaybolmaz. Volume'u yedeğe dahil et.
`SITE_URL` ve `SITE_INDEX` derleme anında sayfalara işlenir; alan adını değiştirirsen yeniden derle.
Staging için `SITE_INDEX` boş bırakılırsa `robots.txt` her şeyi kapatır.
