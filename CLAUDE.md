# Muadil — Claude çalışma kuralları (kısa tut)

## Başlangıç (her oturum, bu sırayla, başka bir şey okuma)
1. `docs/pano/PANO.md` — güncel durum, aktif iş, sıradakiler. Tek doğruluk kaynağı.
1b. `docs/pano/DERSLER.md` — geçmiş hatalardan çıkan kurallar (kısa, mutlaka uy).
2. `docs/inbox/` doluysa (README.md hariç) kullanıcı notlarını işle → pano'ya yaz → dosyayı `docs/arsiv/`'e taşı.
Geri kalan her şeyi **gerektiğinde** oku; "bağlam için" dosya gezme.

## Yapı
- `web/` — AKTİF kod (Next.js + Postgres/Drizzle, ADR-008). Önce `web/AGENTS.md`.
- `backend/`, `frontend/`, `muadil-tasarim-k/` — ESKİ (.NET + Vite). Kullanıcı açıkça istemedikçe okuma/değiştirme.
- `docs/adr/` — kararlar. Yalnız ilgili ADR'yi aç. Güncel olan: 008.
- Kökteki .xlsx / .zip / .html / .log / .jpg dosyaları ham çıktı; açma.

## Token tasarrufu
- Önce Grep/Glob, sonra `Read` ile **sadece ilgili satır aralığı** (offset/limit). Tam dosya okuma yalnız küçük dosyada.
- Büyük çıktıyı (liste, tablo, log, analiz) sohbete basma → `docs/dropoff/` altına yaz; sohbette yol + en çok 5 satır özet ver.
- Aynı bilgiyi tekrar türetme: karar/bulgu pano'da varsa oradan al.
- Uzun keşif/arama gerekirse Explore alt-ajanı kullan (ham çıktı ana bağlamı doldurmasın).
- Bitişte pano'yu güncelle (≤10 satır değişiklik): ne yapıldı, ne sıradaki. Oturum başı yeniden keşfi önler.
- Yanıtlar kısa: önsöz/özet tekrarı yok.

## Testler
- Yalnız **test senaryosu YAZ**, `docs/test-senaryolari/` veya ilgili test projesine. **Koşma** (npm test, dotnet test, vitest, playwright vb. çalıştırma). Koşmayı kullanıcı yapar.
- Tarayıcı otomasyonu (Claude in Chrome) önce sorulmadan kullanılmaz.

## Git
- Commit/push yalnız kullanıcı isterse.

## Hatalardan ders çıkarma
Amaç: aynı hata ve yanlış anlamayı tekrarlamamak. Dersi **Claude kendisi yazar**, kullanıcıdan istemez/sormaz. Şu durumlarda **aynı turda** `docs/pano/DERSLER.md`'ye tek satır ekle (`[tarih] Hata → Kural`):
- Kullanıcı düzeltti, itiraz etti veya aracı reddetti.
- İsteği yanlış anladım (kullanıcı "bunu demedim", "kastım şuydu" dedi) → yanlış yorum + doğru anlam.
- Bir komut/derleme/tip hatası beklenmedik şekilde çıktı ve kök neden bulundu.
- Aynı hatayı ikinci kez yapmak üzereysin (önce dosyayı kontrol et).
Tekrarlayan ders → mevcut satırı güçlendir, çoğaltma. Genel kullanıcı tercihi ise ayrıca hafızaya da yaz.
