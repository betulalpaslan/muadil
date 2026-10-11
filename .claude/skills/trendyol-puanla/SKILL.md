---
name: trendyol-puanla
description: Bir muadil markasının (Bargello, Mad, Muscent, Loris…) kalıcılık/benzerlik puanlarını Trendyol yorumlarından önerir; eksik muadil kodlarını bulur ve toplu yükleme şablonunda kanıtlı bir Excel hazırlar. "X markasını puanla", "X'in eksik kodlarını bul", "puanları Trendyol'dan çıkar" gibi isteklerde kullan. Claude in Chrome gerekir.
---

# Trendyol yorumlarından muadil puanı önerme

Çıktı her zaman bir **öneri Excel'idir**; kullanıcı onaylayıp yönetim sayfasındaki toplu yüklemeyle kendisi içe aktarır.

## Kurallar (pazarlıksız)
- Veritabanına yazma, muadil MCP'sinin yazma araçlarını (`muadil_ekle`, `muadil_guncelle`, `parfum_ekle`) çağırma. Okuma araçları serbest.
- Sayfaları normal kullanıcı hızında gez: istekler arası 2,5–3,5 sn, aynı sitede tek kuyruk.
- Cloudflare doğrulaması, CAPTCHA ya da HTTP hatası çıkarsa dur ve kullanıcıya sor; aşmaya çalışma. Yorum kuyruğu hata görünce zaten kendiliğinden durur.
- Kullanıcının açık sekmelerine dokunma; kendi sekmeni aç, iş bitince kapat.
- Commit/push yapma.

## Bu klasördeki dosyalar
- `siniflandirici.js`: trendyol.com sekmesine bir kez yapıştırılır. İçinde yorum çekme kuyruğu, kalıcılık/benzerlik sınıflandırıcısı, puan formülü, dışa aktarma ve kod doğrulama (`__mention`) var. Kurallar Bargello'da kullanılanın aynısı; değiştirme, değiştirirsen eski puanlarla karşılaştırılamaz.
- `birlestir.py`: tarayıcı sayımlarını + eşleştirme bilgisini `kayitlar.json`'da birleştirir.
- `excel_olustur.py`: `kayitlar.json` → şablon biçiminde Excel (Muadiller / Eksik kanıt / Yöntem).
- `dogrula.py`: Excel'i içe aktarıcının kurallarına göre denetler.
- `yontem.txt`: "Yöntem" sayfasının şablonu; `<...>` yerlerini o çalışmaya göre doldurup scratchpad'e kopyala.

Python betikleri `openpyxl` ister. Yoksa sisteme kurma; `py -3.13 -m pip install --target <scratchpad>/pylib openpyxl` ile scratchpad'e kur ve `PYTHONPATH=<scratchpad>/pylib PYTHONIOENCODING=utf-8` ile çalıştır.

## Adımlar

### 1. Listeyi çıkar
- Mevcut muadiller: `muadilleri_listele` (muadilMarka verilerek). Orijinal parfümler ve notaları: `parfum_ara` / `parfum_detay` ya da kullanıcının verdiği Excel'in "Parfümler" sayfası.
- "Eksik kodları bul" isteniyorsa: markanın karşılığı olmayan orijinalleri listele.
- Kullanıcıya iş planını ve tahmini süreyi söyle. İlk birkaç muadili yapıp yöntemi göster, onay gelince devam et.

### 2. Kod eşleştirme (eksik kodlar için)
Sırayla dene; tek kaynakla yetinme:
1. **Markanın kendi sitesi.** Bazı siteler orijinal adıyla da arar (Muscent: `muscent.com/arama?q=noa` → F043 CNova). Sitemap'ten tüm ürün listesini al (`/sitemap.xml`).
2. **Notalar.** Site ürün sayfasında nota piramidi varsa (Mad: madparfum.com) orijinalin notalarıyla örtüşmesine bak. Ayırt edici notalar (ör. kimyon, havyar, votka, zeytin çiçeği) güçlü kanıttır.
3. **Üçüncü taraf listeler.** eniyilerden.com, habergazetesi.com.tr vb. Yalnız ipucudur, kendi başına yeterli değildir.
4. **Kullanıcının verdiği kodlar.** Bunları da doğrula; tutmayanı nedeniyle birlikte raporla.

Doğrulama: aday ilanın yorumlarını çekip `__mention(contentId)` çalıştır; orijinalin adı yorumlarda geçmeli. Örnek: D114 "Delina" diye verilmişti ama 58 yorumda "Miss Dior" geçtiği için reddedildi.

**Kod çakışması:** Mad gibi markalar aynı kodu hem kadın hem erkek üründe kullanır (W150 kadın = Crystal Noir, W150 erkek = Bleu de Chanel). Toplu yükleme satırı artık **muadil marka + kod + cinsiyet** ile bulup günceller (11.10.2026: Cinsiyet alanı eklendi — ADR gerekmedi, bkz. backend/Muadil.Domain/Entities/Enum.cs). Çakışan yeni ürünün satırına şablondaki **Cinsiyet** sütununa "Kadın" ya da "Erkek" yaz; kodun kendisine eskisi gibi " E"/" K" ekleme (eski sonekli satırlar migration'da temizlendi, yeni satırlarda sonek kullanılmaz).

### 3. Trendyol ilanlarını bul
- Kod araması (`/sr?q=<Marka> <kod>`) her zaman işe yaramaz. Daha güvenilir yol, markanın tüm ilanlarını sayfalayarak toplamak: `fetch('/sr?q=<Marka>&pi=1..N')` ile gelen HTML'i `DOMParser`'la ayrıştır, `a[href*="-p-"]` kartlarından slug, `(\d\.\d)\((\d+)\)` ile puan/değerlendirme sayısı ve "Yetkili Satıcı" bilgisini al.
- Slug'da hem `15-ml` hem `15ml` yazımı olabilir; 50 ml'yi seçerken ikisini de ele.
- Seçim: markanın resmi mağazası, 50 ml, tekli ilan; birden çoksa en çok değerlendirmeli olan. 50 ml yoksa başka boyu kullan ve notta belirt. Hiç ilan yoksa satırı "Eksik kanıt"a, link olarak markanın sitesindeki ürün sayfasını yaz.
- Gerçek link: `fetch('/x/x-p-<contentId>').then(r=>r.url)` kanonik ürün adresine yönlenir.
- Ek ilan (aynı ürünün başka boyu ya da bayi ilanı) bul ve `__DEALER`'a koy; yalnız puan yetersiz kalırsa sayılır.

### 4. Yorumları çek ve puanla
1. trendyol.com'da bir sekme aç, `siniflandirici.js`'in tamamını `javascript_tool` ile bir kez çalıştır. `'siniflandirici kuruldu'` dönmeli.
2. Şunları tanımla:
   - `window.__META = {'Mad W191': [354098882, 'Dior Sauvage', 'Dior'], ...}` (değer: contentId, orijinal tam adı, orijinal marka)
   - `window.__DEALER = {...}` (ek ilanlar)
   - `window.__Q = [contentId…]` (ek ilanlar da dahil)
   - `window.__maxPages = 40`
   - ardından `window.__loop2()`
3. Kuyruk arka planda çalışır. Beklerken `Bash` ile `sleep 600` komutunu `run_in_background` olarak başlat; süre dolunca yeniden devreye girersin. Sık sık yoklama yapma. Durumu `window.__durum()` ile gör.
4. Bitince her id için `__doKod(id)`, ek ilanı olanlar için `__doComb(id)` çalıştır.
5. Gerekirse markanın kendi sitesindeki yorumları da ekle (Muscent: `/srv/service/product-detail/comments/<productID>?language=tr&page=N`). Bunları ayrı bir iş olarak `__jobs`'a koyup aynı sınıflandırıcıyla say.

Bilinen tuzaklar:
- `javascript_tool` 45 sn'de zaman aşımına uğrar. Uzun döngüleri `await` etmeden başlat, sonucu `window` değişkeninde biriktir, sonra oku.
- Bazı sitelerde Blob Worker çalışmaz (muscent.com). Orada `setTimeout` kullan; o sekmeyi öne alırsan daha hızlı ilerler.
- Araç çıktısı ~1000 karakterde kesilir. Büyük veriyi `document.body.innerText = JSON.stringify(...)` ile sayfaya yaz, `get_page_text` ile oku (en fazla 50.000 karakter; gerekirse ikiye böl).
- Çıktıda sorgu parametreli URL ya da çerez benzeri metin varsa gizlilik süzgeci "[BLOCKED…]" döndürür. Özel karakterleri temizleyerek yazdır.

### 5. Excel'i üret
1. `__export([...ids])` çıktısını `get_page_text` ile al ve scratchpad'e `sayimlar.json` olarak yaz.
2. `eslestirme.json` yaz: her muadil için `id, marka, kod, om, op, fiyat, link, durum (mevcut/yeni), ilan, not`; kod çakışması varsa `cinsiyet: "Kadın"/"Erkek"` de ekle (yoksa "Unisex" sayılır).
   - `om`/`op` veritabanındaki adla birebir aynı olmalı.
   - Fiyat markanın kendi sitesindeki 50 ml fiyatıdır; 50 ml yoksa hesaplama yöntemini notta yaz.
   - İlanı olmayanlar da girsin.
3. `py -3.13 birlestir.py --sayimlar … --eslestirme … --cikti kayitlar.json` — puanları sayımlardan yeniden hesaplar; eşik varsayılan 5 ilgili yorum (üç markada aynı kural; 5–7 yorumlu puan Excel'de "Az kanıt" diye işaretlenir). Kullanıcı başka bir eşik istemedikçe değiştirme.
4. `yontem.txt`'i kopyalayıp doldur, sonra `py -3.13 excel_olustur.py --girdi kayitlar.json --cikti D:/muadil/<marka>-puan-onerisi.xlsx --yontem <doldurulmuş>`
5. `py -3.13 dogrula.py --excel <çıktı> --parfumler <Parfümler sayfası olan xlsx>` sıfır hata vermeli.

### 6. Raporla
Kullanıcıya düz metinle şunları anlat:
- Dosya yolu.
- İçe aktarılabilir ve eksik satır sayısı.
- Öne çıkan puanlar.
- Karar gerektirenler: kod çakışmaları, tutmayan kodlar, hesaplanmış fiyatlar, şüpheli mevcut eşleşmeler.
- Veritabanına yazılmadığını ve commit edilmediğini.
