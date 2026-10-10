# ADR-007: Yönetim için yerel MCP sunucusu (stdio)

**Durum:** Kabul edildi | **Tarih:** 10.10.2026

## Bağlam
Toplu veri girişinden sonra asıl iş tek tek güncellemeler: muadil puanları,
eksik fiyatlar, yeni parfümler. Bunları formlarla ya da Excel'de satır arayarak
yapmak yavaş. Bir yapay zekâ asistanına doğal dille yaptırmak istiyoruz
(ör. "Bargello 567'nin kalıcılığını 8 yap"). Model Context Protocol (MCP) bunun
standart yolu. Yazma araçları korunmalı. Resmi C# MCP SDK'sı (2.0) HTTP üzerinde
uçtan uca OAuth yetkilendirmesini henüz tam sunmuyor.

## Değerlendirilen seçenekler
1. API içinde HTTP uç noktası (`/mcp`), Keycloak ile OAuth
2. Ayrı, yerel çalışan bir stdio MCP sunucusu (konsol uygulaması)
3. MCP kullanmamak, admin formlarıyla devam etmek

## Karar
Seçenek 2: `backend/Muadil.Mcp`. Claude Desktop ya da Claude Code onu kendi
bilgisayarında bir süreç olarak başlatır ve stdin/stdout üzerinden konuşur.
Veritabanına `Muadil.Infrastructure` üzerinden erişir; yazma işlemleri
`IceAktarmaServisi`'ni kullanır, yani Excel yüklemesiyle aynı kurallardan geçer.

## Sonuçlar
Olumlu: Ağa hiçbir şey açılmaz; yalnızca yerel bilgisayardaki kullanıcı
kullanabilir, bu yüzden ayrıca oturum açma gerekmez. Kurulumu basit. İş
kuralları tek yerde (servis).
Olumsuz: Yalnızca geliştirici bilgisayarında çalışır; ziyaretçilere açık bir
MCP sunucusu değildir. Veritabanı bağlantı şifresi istemci yapılandırmasında
ortam değişkeni olarak durur. API'deki iş kurallarının bir kısmı (ör. marka
türü kontrolü) servise taşınmadığı için araçlarda tekrar yazıldı.
Sonra: Canlıda ziyaretçilere açık, yalnızca okuma araçlı bir HTTP MCP uç
noktası (E8) ayrı bir karar olarak değerlendirilecek.
