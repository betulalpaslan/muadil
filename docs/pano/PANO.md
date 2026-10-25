# PANO — güncel durum (oturum başında SADECE bunu oku)
_Son güncelleme: 2026-10-25_

## Aktif
- Dal: `feature/MUAD-yonetim-toplu-yukleme`
- Mimari: ADR-008 → `web/` (Next.js + Postgres). Eski .NET/Vite kod donduruldu.
- Aktif iş: Ana sayfa cam/pembe yeniden tasarım (3 palet: gul/gece/adacayi, Roboto). Kullanıcı tarayıcıda görsel kontrol edecek.

## Sıradakiler
1. (kullanıcı/inbox'tan gelenler buraya)

## Bekleyen kararlar
- Muadil puan önerileri: Bargello/Mad/Muscent/Loris Excel'leri hazır (kök dizin). Detay → hafıza.

## Son yapılanlar (en fazla 10 satır, eskiyi sil)
- Ana sayfa arka planı: `public/arka-dalga.webp` (ipek dalga) `.arka-dalga` ile VS'ye bağlı; kırılma noktası (%47.24, %60.87) VS merkezinde, z -1 (.sayfa katmanı), kenarlar solar. `.hero > *` z-index kaldırıldı. Eski `dalga.webp` kullanılmıyor. <900px'te gizli. tsc temiz, görsel kontrol kullanıcıda.
- Tasarım yenilendi: globals.css paletleri `[data-palet]`, dev widget → Tasarım → "Palet"; font @fontsource/roboto; TemaDugmesi kaldırıldı (yerine hesap ikonu); karsilastirma.tsx ana sayfa düzeni yeni. tsc temiz, görsel doğrulama kullanıcıda.
- Yeniden mimari ADR-008 yazıldı; token-tasarruflu yapı (pano/inbox/dropoff) kuruldu.

## Önemli sabitler
- Slug değişmez: `/muadil/{slug}`, `/parfum/{slug}`, `/marka/{slug}`, `/nota/{slug}`.
- Veri değişince `POST /api/yenile` önbelleği tazeler.
