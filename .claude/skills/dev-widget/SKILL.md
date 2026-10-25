---
name: dev-widget
description: Muadil `web/` (Next.js) projesindeki geliştirici widget'ı (sağ kenardaki "◐ DEV" paneli) ile ilgili her iş için kullan — widget'a sekme/araç ekleme, Tasarım sekmesini (renk, arka plan deseni, tema ayarı) değiştirme, canlı palet ayarlarını globals.css'e taşıma. "dev widget", "geliştirici modu", "renk ayarı", "arka plan ayarı", "widget'a sekme ekle", "paleti kopyala" gibi isteklerde otomatik devreye gir. Eski `frontend/` (Vite) ve `backend/` projeleri için KULLANMA.
---

# Geliştirici widget'ı (`web/`)

Yalnızca `npm run dev`te görünen, sağ kenardan açılan sekmeli panel. Üretimde render edilmez.

## Yerleşim
- `web/src/components/dev/dev-widget.tsx` — kabuk + `SEKMELER` listesi. Yeni araç = listeye `{ id, ad, icerik }` satırı.
- `web/src/components/dev/tasarim-sekmesi.tsx` — "Tasarım" sekmesi: hazır temalar (6 şablon), ana renk (altın tonları türetilir), arka plan görseli/CSS, arka plan rengi, elle ince ayar, "CSS'i kopyala", "Sıfırla".
- `web/src/components/dev/arka-plan.tsx` — "Arka plan görseli / CSS" bölümü (görsel URL'si ya da dosya yükle, ham `background` CSS'i, karartma, sabit, kaldır).
- `web/src/components/dev/yazi-tipi.tsx` — "Yazı tipi" bölümü: `--serif` (başlık) / `--sans` (gövde) seçici, Google fontu canlı yüklenir, temadan bağımsız (`yazi-tipi-ayari`).
- `web/src/components/dev/renk.ts` — hex/HSL/rgb yardımcıları.
- `web/src/app/layout.tsx` — `process.env.NODE_ENV === "development" && <DevWidget />`.

## Nasıl çalışır
- Ayarlar `<html>` üzerine inline CSS değişkeni olarak yazılır (`globals.css`teki `--bg`, `--ink`, `--gold-hi`, `--btn`, `--line`, `--zemin-isik`…). Tema `<html data-theme="light">` ile ayrılır; ayarlar tema başına `localStorage`ta (`renk-ayari-dark` / `renk-ayari-light`).
- Arka plan: sitede artık oluklu cam deseni (`#zemin`) YOK; düz `--bg` var. Widget istenirse `body`nin başına `#dev-arka-plan` adlı sabit bir katman ekler (z-index 0, `.sayfa` üstünde kalır); site CSS'i değişmez. Ayar tema başına `localStorage`ta (`arka-plan-ayari-dark/light`). Kalıcı yapmak için "CSS'i kopyala" çıktısındaki `body { … }` bloğu `globals.css`e işlenir (yüklenen dosya `public/` altına konur).
- Panel kapalıyken de sekmeler bağlı kalır (hidden); kayıtlı ayarlar yenilemede uygulanır.
- Yeni bir değişken ayarlanacaksa `DEGISKENLER` listesine de ekle (yoksa tema değişince/sıfırlayınca temizlenmez).

## Kurallar
- Widget kodu **yalnızca geliştirmede** çalışmalı: layout'taki `NODE_ENV` koşulunu kaldırma. Sunucuya dosya okuyan/yazan dev endpoint'i eklersen `NODE_ENV !== "development"` ise 404 dön.
- Widget'ın kendi görünümü sabit koyu renklerle yazılır (site temasına bağlı olmasın, kendini bozmasın).
- Next bu projede standart bilgiden farklı olabilir: yeni route/API yazmadan önce `web/node_modules/next/dist/docs/` ve `web/AGENTS.md`ye bak. (Örn. `cacheComponents` açık: route'ta `export const dynamic` kullanma.)
- Beğenilen palet kalıcı olacaksa: "CSS'i kopyala" çıktısını `web/src/app/globals.css`te ilgili bloğa (`:root` / `:root[data-theme="light"]`) işle; kullanıcı istemeden commit etme.
- Doğrulama: `cd web && npx tsc --noEmit`, ana sayfayı `curl` ile kontrol et. Kullanıcı istemeden tarayıcı aracı (Claude in Chrome) açma.
