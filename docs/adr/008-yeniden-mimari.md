# ADR-008: Yayına çıkış için yeniden mimari (Next.js + Postgres monoliti)

**Durum:** Kabul edildi | **Tarih:** 18.10.2026
**Yerine geçtiği:** ADR-002 (Keycloak). ADR-007'nin (MCP) yönetim amacı korunur, uygulaması sonra yeniden değerlendirilir.

## Bağlam
İlk mimari (Vite SPA + .NET API + Keycloak + Postgres) yalnızca localhost için kurulmuştu.
Ürünün değeri Google'dan gelen aramalardan doğuyor: "Bargello 567 hangi parfümün muadili",
"Sauvage muadili", "vanilya notalı parfümler". Bir SPA arama motoruna boş HTML sunar.
Ayrıca Keycloak ek sunucu belleği ve işletme yükü getiriyor, çok sayıda herkese açık API ucu
gereksiz yüzey yaratıyor. Hedef: 1000+ kayıt, hızlı yayın, düşük maliyet (tek VPS).

## Karar
- **Next.js (App Router, Cache Components) + Postgres (Drizzle)**, tek TypeScript monoliti (`web/`). .NET bırakıldı.
- Sayfalar sunucuda üretilir ve önbelleğe alınır (`use cache`, `katalog` etiketi). Veri değişince `POST /api/yenile` tazeler.
- Her varlığın değişmez `slug`'ı var: `/muadil/{slug}`, `/parfum/{slug}`, `/marka/{slug}`, `/nota/{slug}`.
- Arama: Postgres `pg_trgm` + Türkçe karakter duyarsız `ara_norm()`; ayrı arama motoru yok.
- Satın alma bağlantıları `/git/{id}` üzerinden yönlenir, tıklama kaydedilir; bağlantılar şimdilik düz link, ileride affiliate.
- Kimlik doğrulama ilk sürümde yok (herkese açık içerik). Yönetim girişi (Google, e-posta izin listesi) sonraki adım.
- Dağıtım: tek VPS, Docker Compose (Caddy + Next.js + Postgres), önünde Cloudflare.

## Sonuçlar
Olumlu: SEO için hazır HTML, tek dağıtım birimi, yaklaşık 5-8 €/ay, Keycloak yok.
Olumsuz: .NET'te yazılan içe aktarma, renk algılama ve MCP yeniden yazılmalı (içe aktarma taşındı).
Kullanıcı yorumu, favori ve fiyat geçmişi yayından sonraya bırakıldı.
