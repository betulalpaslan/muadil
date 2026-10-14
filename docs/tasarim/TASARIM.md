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
| Yazı tipi | Syne, tek aile (400–800), `@fontsource/syne`. Google Fonts kullanılmaz. Değiştirmek gerekirse yalnızca `--font-govde` değişir; Poppins ve Jost denendi. |
| ₺ işareti | "Lira Isareti" yüzü yalnızca U+20BA için Inter kullanır. `tl()` biçimi aynen kalır. |
| Başlık | `genis` sınıfı: büyük harf, `letter-spacing: .14em`, 500 ağırlık. Vurgulu kelime 800 ağırlık ya da `text-vurgu` renginde. Satır yüksekliği 1.3–1.45, kelime aralığı .2–.35em. |
| Etiket | `kucuk` sınıfı: 10px, 600, `letter-spacing: .22em`, büyük harf. |
| Çizgi | 1.5px `yazi` renginde. Bölümler arası tam genişlik yatay çizgi. |
| Düğme | Hap (`rounded-full`) ya da daire. Çizgili olanlar `cizgili` ile hover'da dolar; ana düğme dolu. |
| Görsel | `Cerceve`: düz, eğik değil, tırtık yok. Kenarlarda 14px pay, altta etiket satırı ("SAUVAGE ... NO. 02"). |
| Numara | Bölüm ve kartlarda "01, 02, 03..." küçük kalın rakamlar dergi havası verir. |
| Süsler | Yıldız işareti (asterisk), yıldız patlaması, dönen yazılı rozet, yukarı ok. Hepsi `aria-hidden`, telefonda bir kısmı gizlenir. |
| Hareket | Rozet döner, şerit kayar, şişe animasyonu var. Hepsi `prefers-reduced-motion` ile kapanır. |

## 2. Tema (gece / gündüz)

Renkler CSS değişkeni; `<html data-tema="gunduz">` gündüzü açar. Tailwind adları ve değerleri:

| Tailwind | Değişken | Gece | Gündüz | Nerede |
|---|---|---|---|---|
| `zemin` | `--si` | #0B0B0B | #F4F0E9 | sayfa zemini |
| `yazi` | `--be` | #F2EEE8 | #141212 | yazı, çizgi, çerçeve, ters bantların zemini |
| `vurgu` | `--ta` | #C8B497 | #7A6548 | vurgu kelimeleri, etiketler |
| `vurgu-ters` | `--ta2` | #7A6548 | #C8B497 | ters bantlardaki vurgu |
| `yuzey` | `--gr` | #1A1A1A | #E3DDD3 | görsel yer tutucu, sekme hover |
| `soluk` | `--gr2` | #8A8580 | #6F6A64 | ikincil yazı |
| — | `--p1` / `--p2` | açık gümüş | koyu gümüş | şişe parıltıları |

Gündüzde zemin ve yazı yer değiştirir. Gecede krem olan "ters bantlar" (popüler paneli, blog bandı, çerçeveler) gündüzde koyu olur. Bu bilinçli bir tercih, iki temada da sayfanın ritmi aynı kalsın diye.

- **Seçim:** `useTema` önce localStorage'daki seçimi, yoksa sistemin `prefers-color-scheme` tercihini kullanır.
- **Düğme:** `TemaDugmesi` header'ın üst satırında, sayı bilgisinin yanında durur.
- **Yanıp sönme:** İlk boyamada yanıp sönmesin diye `tema.ts` başındaki tek satırlık script `index.html` `<head>` içine eklenir.
- **Sabit renkler:** Parfüm rengiyle boyanan görsel alanları (pastel) iki temada da aynıdır. Üstlerindeki şişe ve yazı hep koyu (#0B0B0B) kalır.

## 3. Parfüm rengi

`Parfum.Renk` (`#RRGGBB`, boş olabilir) değeri `pastel(renk, 0.8)` ile görsel çerçevesinin zeminine çevrilir. Popüler panelinde `saturate(.6)` ile biraz soldurulur. Detayda marka etiketindeki 18px yuvarlak nokta, `gercekRenk(renk)` ile ham rengi gösterir.

## 4. Ortak parçalar

- **Header** (üç satır):
  1. `Logo` ve sağda "48 ORİJİNAL · 134 MUADİL · 50 ML" ile `TemaDugmesi`.
  2. Üstte ve altta çizgi olan menü: ANA SAYFA, PARFÜMLER, MARKALAR, NOTALAR, BLOG, GİRİŞ. Öğeler satıra yayılır, bulunulan sayfa dolu hap olur. Telefonda yalnızca aktif sayfa ve GİRİŞ görünür, ileride hamburger eklenebilir. Giriş yapılmışsa GİRİŞ yerine kullanıcı adı ve ÇIKIŞ gelir; admin ise YÖNETİM de eklenir.
  3. **Uzun arama çubuğu, her sayfada en üstte.** 58px yüksek çizgili hap; solda büyüteç, placeholder "PARFÜM, MARKA YA DA KOD". Yanında dolu "ARA" düğmesi. Mevcut `?ara=` davranışına bağlanır: 300 ms bekler, tek harfte aramaz. Başka sayfadayken arama ana sayfaya `?ara=` ile gider.
- **KayanSerit:** iki çizgi arasında "kodunu bul ✦ bargello ✦ mad ✦ muscent ✦ aynı koku, uygun fiyat".
- **Footer:** üst çizgi; solda gün adı ve tarih (bugün), ortada yasal not ("kodlar markaların resmi açıklaması değildir · puanlar editör değerlendirmesidir"), sağda "yapan muadil.".

## 5. Ana sayfa (`/`)

Sıra: header (arama dahil), blogda öne çıkan, kayan şerit, **bu hafta en popüler**, blog bandı, "sevdiğin koku uygun fiyata" bölümü, footer.

- **Arama doluyken:** "Blogda öne çıkan" ile popüler bölümünün yerine sonuç listesi gelir. Her sonuç, popüler panelindeki satırın sade hali olur: çerçeve küçük, ad, kodlar, "detaya git".
- **Blogda öne çıkan:** solda büyük çerçeve (4:5), sağda "01", B/M/M yuvarlakları, başlık ("EN İYİ **10** / ZARA PARFÜMÜ / HANGİSİ?" ve ok dairesi), iki yana yaslı özet, vurgu renginde kategori satırı. Şimdilik statik; örnek veri `src/tasarim/blogOrnek.ts` içinde.
- **Bu hafta en popüler:**
  - Başlık "BU HAFTA" vurgu renginde, "**EN** POPÜLER". Sağda dönen rozet.
  - Altında `PopulerSekmeler` (hazır). Sıralama şimdilik muadil sayısına göre, ilk 6.
  - Altta "TÜM PARFÜMLER (48)" çizgili hap.
- **Blog bandı:** ters renkte (gecede krem zemin). "BLOGDAN / **SON** YAZILAR" başlığı, "TÜMÜ" hapı ve 3 kart. Her kart çerçeveli görsel, kategori ve süre, başlık ve "OKU" satırından oluşur. Çerçeve bu bantta ters renktedir (`Cerceve ters`).
- **Sevdiğin koku, uygun fiyata:** büyük başlık, geniş çerçeve, sağda ok dairesi ile "KODUNU BUL" ve kısa açıklama. Sağ üstte yıldız patlaması. Üstte arama olduğu için buradaki arama kutusu kaldırılabilir; yerine "tüm parfümler" hapı konur.

## 6. Parfüm detay (`/parfum/:id`)

Sıra: header (arama dahil), hero, kayan şerit, muadiller, koku piramidi, footer.

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
- **Koku piramidi:** `NotaSprey` (hazır). Başlık "KOKU **PİRAMİDİ**"; şişe tema yazı renginde. Bölüm ekrana girince bir kez kendiliğinden sıkılır, şişeye basınca tekrar sıkılır.

## 7. Boyutlar

- Kenar boşluğu `clamp(16px, 5vw, 70px)`. 390px'te yatay kaydırma yok; kayan şerit kendi kutusunda kırpılır.
- Dokunma hedefleri en az 44px. Arama 58px, kopyala hapı 56px.
- Telefonda iki sütunlu bloklar alt alta geçer (flex-wrap). Asterisk ve yan rakamlar ekran dışına taşmaz.

## 8. Dokunulmayanlar

Giriş akışı (Keycloak), yetki, API istemcisi, `tl()` ve admin işlevleri aynı kalır. Admin sayfası yeni tema değişkenlerini devralır; ayrıntılı yeniden tasarımı sonraya kalabilir.
