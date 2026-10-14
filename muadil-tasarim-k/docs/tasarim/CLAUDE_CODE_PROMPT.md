Muadil'in herkese açık sayfalarını yeni tasarıma geçireceğiz: **K · Siyah dergi**, gece ve gündüz temalı. Tasarım kesin; ayrıntılar `docs/tasarim/TASARIM.md` içinde. Varsa önceki "I · Karışım" paketinden kalan dosyaları bu paketteki sürümler geçersiz kılar.

Önce şunları oku:
- `docs/tasarim/TASARIM.md`
- `docs/tasarim/mockup/` içindeki HTML'ler
- `docs/tasarim/ekran/` içindeki PNG'ler

Mockup'lar ölçü, boşluk ve renk için birebir referans; inline stilleri Tailwind sınıflarına çevir. Renkler doğrudan hex olarak değil, tema sınıflarıyla yazılır: `bg-zemin`, `text-yazi`, `text-vurgu`, `bg-yuzey` ve diğerleri.

Şu dosyalar hazır, içeriklerini değiştirmeden kullan:
- `frontend/src/tasarim/tasarim.css`
- `frontend/src/tasarim/tema.ts`
- `frontend/src/tasarim/renk.ts`
- `frontend/src/components/tasarim/` altındaki `Logo`, `TemaDugmesi`, `Cerceve`, `KayanSerit`, `ParfumSisesi`, `NotaSprey`, `PopulerSekmeler`

## Backend

1. `Parfum` tablosuna `Renk` alanını ekle (daha önce eklendiyse bu adımı atla).
   - Tip: `string?`, en çok 7 karakter. `^#[0-9A-Fa-f]{6}$` biçiminde doğrula.
   - Migration adı: `ParfumRenk`.
   - Ekleme, güncelleme ve detay DTO'larında taşınsın.
2. Parfüm listesi (`GET /api/parfumler`), her parfüm için iki yeni alan döndürsün; `?ara=` davranışı değişmeden kalsın.
   - `renk`
   - `muadilOzetleri`: `{ marka, kod, fiyat }[]` biçiminde, fiyata göre artan sırada.
3. Yönetim formuna (`ParfumFormu`) renk seçici ekle: `<input type="color">` ve yanında hex metin kutusu. Boş bırakılabilsin.

## Frontend

1. Paketleri kur: `npm i @fontsource/syne @fontsource/inter`.
2. `index.css` içinde, `@import "tailwindcss";` satırından sonra `@import "./tasarim/tasarim.css";` ekle.
3. Eski tema tokenlarını ve Karışım'a ait sınıfları herkese açık sayfalardan kaldır. Admin sayfası kırılmasın; gerekiyorsa eski tokenları yeni değişkenlere eşle.
4. `index.html` `<head>` içine, `tema.ts` başındaki tek satırlık scripti ekle (ilk boyamada tema yanıp sönmesin).
5. Ortak yerleşim bileşenini kur ve `App.tsx` onu kullansın. Mevcut auth mantığına dokunma. Yerleşim şunlardan oluşur:
   - Header'ın üç satırı: logo ile tema düğmesi, menü, uzun arama çubuğu. **Arama her sayfada en üstte.**
   - `KayanSerit`
   - Footer
6. Ana sayfa (`AnaSayfa`), sırasıyla:
   1. Blogda öne çıkan
   2. Kayan şerit
   3. `PopulerSekmeler`: muadil sayısına göre ilk 6 parfüm
   4. Blog bandı: statik, veri `src/tasarim/blogOrnek.ts`
   5. "Sevdiğin koku" bölümü
   
   Arama doluyken ilk iki bölümün yerine sonuç listesi gelir.
7. Detay (`ParfumDetay`), sırasıyla:
   1. Hero (çerçeve)
   2. Kayan şerit
   3. Muadil kartları
   4. `NotaSprey`
   
   Sıralama ölçütleri, admin muadil ekleme ve görsel yükleme işlevleri aynen kalsın. "Kodu kopyala" çalışsın ve sonucu `aria-live` ile duyursun.
8. Parfüm rengini yalnızca `renk.ts` üzerinden kullan. Animasyonlar `prefers-reduced-motion` ayarına uysun.

## Kontrol

- Şunlar hatasız geçsin: `dotnet build`, migration, `npm run build`, lint.
- İki sayfayı 390 ve 1280 genişlikte, **iki temada da** mockup PNG'leriyle karşılaştır.
  - Yatay kaydırma olmasın.
  - ₺ işareti doğru görünsün.
  - Gündüzde metinler okunaklı olsun.
- Tema seçimi sayfa yenilenince korunsun. Hiç seçim yapılmamışsa sistem tercihine uysun.
- Sekmeler fareyle, dokunarak ve klavyeyle (← → Home End) gezilebilsin.
- Notalar bölümü ekrana girince bir kez sıkılsın; tıklayınca tekrar sıkılsın.
- Bitince neyi nerede değiştirdiğini kısaca özetle.
