# Muadil tasarımı: K · Siyah dergi (gece / gündüz)

Kesinleşen tasarım budur; önceki paketteki "I · Karışım"ın yerini alır. Siyah zemin, ince çizgiler, geniş aralıklı büyük harf başlıklar, taupe vurgu var; cinsiyet açısından nötr. İki teması var: gece (varsayılan) ve gündüz.

Bu klasördekiler:
- `mockup/*.html`: statik HTML referansları. Ölçü, boşluk ve renkler buradan okunur. Her sayfanın `-gece` ve `-gunduz` hali ayrı dosya.
- `ekran/*.png`: aynı sayfaların 1280 ve 390 genişlikte ekran görüntüleri.
- Referans kod `frontend/src/` altında, olduğu gibi kullanılır:
  - `tasarim/tasarim.css`: tema değişkenleri, yazı tipi, yardımcı sınıflar
  - `tasarim/tema.ts`: gece/gündüz kancası (`useTema`)
  - `tasarim/renk.ts`: parfüm renginden pastel üretir
  - `components/tasarim/`: `Logo`, `TemaDugmesi`, `Cerceve`, `KayanSerit`, `ParfumSisesi`, `NotaSprey`, `PopulerSekmeler`

## 1. Temel kurallar

| Konu | Kural |
|---|---|
| Yazı tipi | Tüm sistem tek aile: Outfit (200–800, `@fontsource/outfit`); başka font kullanılmaz. Kapak başlığındaki fark ("ZARA" 400, alt başlık 200) yalnızca ağırlıktan gelir. Google Fonts kullanılmaz. Değiştirmek gerekirse yalnızca `--font-govde` değişir; Syne (çok geniş durduğu için), Poppins, Jost, Bodoni Moda ve Cormorant Garamond denendi. |
| ₺ işareti | "Lira Isareti" yüzü yalnızca U+20BA için Inter kullanır. `tl()` biçimi aynen kalır. |
| Başlık | `genis` sınıfı: büyük harf, `letter-spacing: .08em`, 500 ağırlık. Vurgulu kelime 800 ağırlık ya da `text-vurgu` renginde. Satır yüksekliği 1.3–1.45, kelime aralığı .2–.35em. |
| Etiket | `kucuk` sınıfı: 11px, 500, `letter-spacing: .16em`, büyük harf. |
| Çizgi | 1.5px `yazi` renginde. Bölümler arası tam genişlik yatay çizgi. |
| Düğme | Hap (`rounded-full`) ya da daire. Çizgili olanlar `cizgili` ile hover'da dolar; ana düğme dolu. |
| Görsel | `Cerceve`: düz, eğik değil, tırtık yok. Kenarlarda 14px pay, altta etiket satırı ("SAUVAGE ... NO. 02"). |
| Numara | Bölüm ve kartlarda "01, 02, 03..." küçük kalın rakamlar dergi havası verir. |
| Süsler | Yıldız işareti (asterisk), yıldız patlaması, yukarı ok. Hepsi `aria-hidden`, telefonda bir kısmı gizlenir. |
| Hareket | Şerit kayar, şişe animasyonu var. Hepsi `prefers-reduced-motion` ile kapanır. |

## 2. Tema (gece / gündüz)

Renkler CSS değişkeni; `<html data-tema="gunduz">` gündüzü açar. Tailwind adları ve değerleri:

| Tailwind | Değişken | Gece | Gündüz | Nerede |
|---|---|---|---|---|
| `zemin` | `--si` | #0B0B0B | #F4F0E9 | sayfa zemini |
| `yazi` | `--be` | #F2EEE8 | #141212 | yazı, çizgi, çerçeve, ters bantların zemini |
| `vurgu` | `--ta` | #D6BB8D | #7A6548 | vurgu kelimeleri, etiketler |
| `vurgu-ters` | `--ta2` | #7A6548 | #C8B497 | ters bantlardaki vurgu |
| `yuzey` | `--gr` | #1A1A1A | #E3DDD3 | görsel yer tutucu, sekme hover |
| `soluk` | `--gr2` | #8A8580 | #6F6A64 | ikincil yazı |
| — | `--p1` / `--p2` | açık gümüş | koyu gümüş | şişe parıltıları |

Gündüzde zemin ve yazı yer değiştirir. Gecede krem olan "ters bantlar" (popüler paneli, çerçeveler) gündüzde koyu olur. Bu bilinçli bir tercih, iki temada da sayfanın ritmi aynı kalsın diye.

- **Seçim:** `useTema` önce localStorage'daki seçimi, yoksa sistemin `prefers-color-scheme` tercihini kullanır.
- **Düğme:** `TemaDugmesi` header'ın üst satırında, sayı bilgisinin yanında durur.
- **Yanıp sönme:** İlk boyamada yanıp sönmesin diye `tema.ts` başındaki tek satırlık script `index.html` `<head>` içine eklenir.
- **Sabit renkler:** Parfüm rengiyle boyanan görsel alanları (pastel) iki temada da aynıdır. Üstlerindeki şişe ve yazı hep koyu (#0B0B0B) kalır.

## 3. Parfüm rengi

`Parfum.Renk` (`#RRGGBB`, boş olabilir) değeri `pastel(renk, 0.8)` ile görsel çerçevesinin zeminine çevrilir. Popüler panelinde `saturate(.6)` ile biraz soldurulur. Detayda marka etiketindeki 18px yuvarlak nokta, `gercekRenk(renk)` ile ham rengi gösterir.

## 4. Ortak parçalar

- **Header** (üç satır):
  1. `Logo` ve sağda "48 ORİJİNAL · 134 MUADİL · 50 ML" ile `TemaDugmesi`.
  2. Üstte ve altta çizgi olan menü: ANA SAYFA, PARFÜMLER, NOTALAR, BLOG, GİRİŞ. Öğeler satıra yayılır, bulunulan sayfa dolu hap olur. PARFÜMLER ve NOTALAR açık (`/parfumler`, `/notalar`); BLOG henüz pasif. Telefonda ANA SAYFA, PARFÜMLER ve GİRİŞ görünür (pasif öğeler gizli), ileride hamburger eklenebilir. Giriş yapılmışsa GİRİŞ yerine kullanıcı adı ve ÇIKIŞ gelir, menüye FAVORİLERİM (`/favorilerim`) eklenir; admin ise YÖNETİM de eklenir. Menü dar ekranda sığmazsa alt satıra sarar (yatay kaydırma yok).
  3. **Uzun arama çubuğu, her sayfada en üstte.** 58px yüksek çizgili hap; solda büyüteç, placeholder "PARFÜM, MARKA YA DA KOD". Yanında dolu "ARA" düğmesi. Mevcut `?ara=` davranışına bağlanır: 300 ms bekler, tek harfte aramaz. Başka sayfadayken arama ana sayfaya `?ara=` ile gider.
- **KayanSerit:** iki çizgi arasında "kodunu bul ✦ bargello ✦ mad ✦ muscent ✦ aynı koku, uygun fiyat".
- **Footer:** üst çizgi; solda gün adı ve tarih (bugün), ortada yasal not ("kodlar markaların resmi açıklaması değildir · puanlar editör değerlendirmesidir"), sağda "yapan muadil.".

## 5. Ana sayfa (`/`)

Sıra: header (arama dahil), blogda öne çıkan, kayan şerit, **bu hafta en popüler**, "sevdiğin koku uygun fiyata" bölümü, footer. ("Blogdan son yazılar" bandı kaldırıldı.)

- **Arama doluyken:** "Blogda öne çıkan" ile popüler bölümünün yerine sonuç listesi gelir. Her sonuç, popüler panelindeki satırın sade hali olur: çerçeve küçük, ad, kodlar, "detaya git".
- **Blogda öne çıkan:** tam genişlikte sahne (`BlogKapak`; gece koyu, gündüz beyaz): çerçevesiz, 5 Zara şişesi yan yana; ortadaki en önde, üstüne gelen/dokunulan şişe ortaya gelir. Sahnenin içinde, en üstte başlık (büyük Didone "ZARA", altında ince "VANİLYA SERİSİ", yanında ok dairesi; renkler sahnenin `--ks-*` değişkenlerinden gelir: gecede krem yazı ve altın degradeli marka kelimesi, gündüzde siyah yazı ve koyu bronz); başlık okuma sayfasına (`/blog/zara-vanilya-serisi`, `BlogYazisi`) gider; orada aynı şişe sahnesi durur, üstüne gelinen şişe ortaya gelir ve sahnenin altındaki panelde adı, koku ailesi, açıklaması ve yanında şişe ikonlu nota bölümü (`NotaSprey` `panel` + `duz` modu, nota ikonları veritabanındaki notalarla adla eşleşir) yazar (veri `ZARA_SISELER`, açıklamalar Zara'nın ürün sayfalarından özetlendi). Sahne temaya göre değişir: gecede `#0B0B0B` zemin ve şişelerin arkasında şampanya/bronz ışık (`kapak-isik`, nefes alır, imleçle kayar, öne gelen şişe değişince bir kez çakar; zemin gölgesi bronz yansıma olur), gündüzde beyaz zemin ve çok hafif sıcak hale. Açılış sekansı: ışık yanar, şişeler ortadan kenara yükselir, başlık soldan açılır ve marka kelimesinden arada altın parlama geçer, ok dairesi dönerek belirir; şişe omuzlarında ✦ ışıltıları yanıp söner (telefonda gizli). Ok dairesine gelince ok çapraz çıkıp karşıdan girer. Hepsi `prefers-reduced-motion` ile kapanır (tasarim.css). Şişe fotoğrafları şeffaf zeminli WebP (`src/assets/blog/zara/`). Şimdilik statik; veri `src/tasarim/blogOrnek.ts` içinde. Mockup'taki eski düzen (4:5 çerçeve, özet, kategori satırı) kalktı.
- **Bu hafta en popüler:**
  - Başlık ve dönen rozet kaldırıldı; yalnızca sağa yaslı küçük ipucu ("6 parfüm · sekmeye dokun", telefonda gizli) var. Bölüm boşlukları sıkı tutulur (ilk ekranda sekmeler görünsün).
  - Altında `PopulerSekmeler` (hazır). Sıralama şimdilik muadil sayısına göre, ilk 6.
  - Altta "TÜM PARFÜMLER (48)" çizgili hap.
- **Notalar sayfası (`/notalar`, menüde NOTALAR):** tüm notalar alfabetik, 1/2/3/4 sütunlu ince çizgili ızgara (`NotalarSayfasi`). Her kartta küçük numara, ikon (96px, `nota-ikon`), ad (`genis`) ve kısa koku açıklaması. Üstte çizgili hap arama kutusu; ad ve açıklamada arar (Türkçe karakter ve büyük-küçük harf farkı yok sayılır), numaralar alfabetik sıradaki yeri korur. Veri `GET /api/notalar` (`Nota.Aciklama`, `Nota.GorselUrl`); açıklamaları yönetim → Notalar sekmesinden düzenlenir, ilk metinler `NotaAciklamalari.cs` içindedir ve geliştirme ortamında yalnızca boş olanlara yazılır.
- **Parfümler sayfası (`/parfumler`, menüde PARFÜMLER; "tüm parfümler" hapları da buraya gider):** tüm orijinal parfümler marka ve ada göre sıralı. Her satırda küçük görsel, marka, ad, muadil sayısı ve en uygun fiyat, muadil hapları (marka, kod, fiyat) ve "detaya git"; satırın tamamı `/parfum/:id` detay sayfasına gider.
- **Sevdiğin koku, uygun fiyata:** büyük başlık, geniş çerçeve, sağda ok dairesi ile "KODUNU BUL" ve kısa açıklama. Sağ üstte yıldız patlaması. Üstte arama olduğu için buradaki arama kutusu kaldırılabilir; yerine "tüm parfümler" hapı konur.

## 6. Parfüm detay (`/parfum/:id`)

Sıra: header (arama dahil), hero, kayan şerit, muadiller, kullanıcı değerlendirmeleri, koku piramidi, footer.

- **Favori:** Hero'da "FAVORİLERE EKLE" hapı (`FavoriDugmesi`); favorideyse dolu hap ve "FAVORİLERİNDE". Giriş yoksa tıklayınca girişe gider, sonra aynı sayfaya döner. Liste `/favorilerim` sayfasında (`FavorilerSayfasi`), `GET/PUT/DELETE /api/favoriler`.
- **Kullanıcı değerlendirmeleri** (`DegerlendirmeBolumu`, `#degerlendirmeler`): kullanıcılar orijinal parfümü değil, onun **muadillerini** değerlendirir. Bölümün üstünde muadil seçici (hap düğmeler); muadil kartındaki "ortalama · N değerlendirme" bağlantısı ilgili muadili seçip bölüme kaydırır. Bir değerlendirme: zorunlu **genel** 1-5 yıldız, isteğe bağlı **benzerlik** ve **kalıcılık** 1-5 yıldız ("temizle" ile geri alınır) ve isteğe bağlı yorum (en çok 1000 karakter). Kullanıcı başına muadil başına tek kayıt, güncellenebilir ve silinebilir. Seçili muadilin başlığında genel ortalama, sayı ve (varsa) benzerlik/kalıcılık ortalamaları; ortalamalar yalnız o puanı verenler üzerinden alınır. Okumak herkese açık, yazmak giriş ister. Admin her yorumu silebilir. API: `GET /api/muadiller/{id}/degerlendirmeler`, `PUT/DELETE /api/muadiller/{id}/degerlendirme`. Bu 1-5 kullanıcı puanları, editörün 1-10 muadil puanlarından (benzerlik, kalıcılık) ayrıdır.

- **Hero:** Solda çerçeve. Çerçevenin içi parfümün pasteli; `gorselUrl` varsa `object-contain` görsel gösterilir. Etiket "MARKA · AD ... NO. 01", köşede asterisk.
  Sağda sırasıyla:
  - "← TÜM PARFÜMLER" ve "01"
  - marka etiketi (renk noktası ile)
  - ad (`genis`, 800, `clamp(38px, 5vw, 66px)`)
  - ok dairesi ile "**3 MUADİL** · EN UYGUN ₺599,99"
  - kısa açıklama
- **Muadiller:**
  - Kart düzeni: ızgara (`minmax(200px, 1fr)`). Kart 4:3 oranında. Zeminler sırayla `yuzey`, `vurgu` ve `yazi`.
  - Kart içeriği: sol üstte numara, sağ üstte en ucuz kartta "EN UYGUN" çizgili etiketi. Ortada kod (800, `clamp(44px, 5vw, 66px)`). Altta marka ile "BENZERLİK 7 · KALICILIK 6".
  - Kartın altı: "KODU KOPYALA" hapı (altında fiyat · 50 ml) ve mağaza ok dairesi.
    - Kopyalanınca 2 sn "KOPYALANDI ✓" yazar ve `aria-live` ile duyurulur.
    - Mağaza oku `urunLinki`'ye yeni sekmede gider (`rel="noopener"`).
  - Sağda dikey yazı: "3 KOD," vurgu renginde, "**MUADİL**LER". Telefonda gizli.
  - Sıralama: mevcut ölçütler (en benzer, en ucuz, en kalıcı) muadiller başlığının yanında küçük çizgili bir `select` olur.
  - Admin muadil ekleme ve görsel yükleme formları bu sayfada kalır. Görünümleri yeni stile uyar, işlevleri aynı kalır.
- **Koku piramidi:** `NotaSprey` (hazır). Başlık "KOKU **PİRAMİDİ**"; şişe tema yazı renginde. Bölüm ekrana girince bir kez kendiliğinden sıkılır, şişeye basınca tekrar sıkılır. Her nota 88px'lik bir sütun: üstte ikon, altında küçük büyük harf ad (`nota-ad`); ikon da harfler gibi sağdan uçarak yerine oturur. Ikonlar `Nota.GorselUrl` ile gelir (admin → Notalar → "Toplu görsel yükle", dosya adı nota adı). Çizim dili: tek renk, ince çizgi, botanik/baskı resmi gibi, şeffaf PNG; koyu mürekkeple çizilir, `nota-ikon` filtresiyle temaya göre boyanır (gecede krem, gündüzde koyu; ters renkli kutuda `nota-ikon-ters`). Görseli olmayan nota marka yıldızıyla gösterilir. Hazır set `docs/nota-gorselleri/` (PNG + `kaynak/*.svg`).

## 7. Boyutlar

- Kenar boşluğu `clamp(16px, 5vw, 70px)`. 390px'te yatay kaydırma yok; kayan şerit kendi kutusunda kırpılır.
- Dokunma hedefleri en az 44px. Arama 58px, kopyala hapı 56px.
- Telefonda iki sütunlu bloklar alt alta geçer (flex-wrap). Asterisk ve yan rakamlar ekran dışına taşmaz.

## 8. Dokunulmayanlar

Giriş akışı (Keycloak), yetki, API istemcisi, `tl()` ve admin işlevleri aynı kalır. Admin sayfası yeni tema değişkenlerini devralır; ayrıntılı yeniden tasarımı sonraya kalabilir.
