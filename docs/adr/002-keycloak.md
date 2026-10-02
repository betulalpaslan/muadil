# ADR-002: Kimlik doğrulama için Keycloak kullanılması

**Durum:** Kabul edildi
**Tarih:** 02.10.2026

## Bağlam
Sistemde "Kullanıcı" ve "Admin" olmak üzere iki rol bulunur (FR-05.4).
Admin paneline yalnızca Admin rolü erişebilmelidir (FR-06.1).
Kayıt MVP'de açıktır ve proje canlıya alınacaktır; bu nedenle şifre
güvenliği ve KVKK uyumu kritik önemdedir. Kimlik doğrulamanın
OAuth2 / OpenID Connect standardına uygun olması gerekir (NFR-02.3).
Projenin bir hedefi de kurumsal ortamlarda yaygın kullanılan
yapıları öğrenmektir.

## Değerlendirilen seçenekler
1. **Keycloak:** Açık kaynak, kendi sunucumuzda çalışan kimlik sunucusu
2. **ASP.NET Core Identity:** .NET'e gömülü kimlik sistemi
3. **Auth0:** Bulut tabanlı hazır kimlik servisi

## Karar
Keycloak seçildi. Şifreleri uygulama kodundan tamamen ayırır,
rol yönetimini hazır sunar, OIDC standardına tam uyar ve
kullanıcı verisi kendi sunucumuzda kalır.

- ASP.NET Core Identity seçilmedi: şifre yönetimi ve giriş/kayıt
  ekranları uygulamanın sorumluluğuna kalır, OIDC desteği sınırlıdır.
- Auth0 seçilmedi: kullanıcı sayısı arttıkça ücretlidir, kullanıcı
  verisi yurt dışında tutulur (KVKK açısından ek değerlendirme
  gerektirir), öğrenme hedefine katkısı düşüktür.

## Sonuçlar
**Olumlu**
- Şifreler hiçbir zaman React veya .NET koduna ulaşmaz
- .NET, token imzasını yerel olarak doğrular; her istekte
  Keycloak'a gidilmez
- Admin / Kullanıcı rolleri token içinde taşınır
- Şifre sıfırlama, e-posta doğrulama gibi akışlar hazır gelir
- Kurumsal projelerde geçerli bir deneyim kazanılır

**Olumsuz**
- Ayrı bir sunucu bileşeni olarak ek bellek tüketir;
  barındırma maliyetini artırır
- İlk kurulum ve yapılandırma karmaşıktır
- Proxy (örn. Cloudflare) arkasında ek ayar gerektirir
- Keycloak çökerse yeni giriş yapılamaz

**Azaltma:** Keycloak, ayrı bir veritabanı sunucusu yerine
projenin PostgreSQL sunucusunda ayrı bir veritabanı kullanacaktır.
