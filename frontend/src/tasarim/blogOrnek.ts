// Blog yazısı özelliği gelene kadar sabit örnek veri. TASARIM.md §5.
// Mockup'taki köşeli parantezli "[Yazı başlığı]" gerçek yazı gelene dek yer tutucu olarak kalır.

export const ONE_CIKAN_BLOG = {
  marka: "Zara",
  sayi: "10",
  baslikSonu: "parfümü",
  soru: "hangisi?",
  aciklama:
    "Zara'nın en çok konuşulan on kokusunu tek tek denedik: hangisi hangi orijinale benziyor, hangisi gün boyu kalıyor, hangisi parasını hak ediyor. Listenin sonunda her biri için Bargello, Mad ve Muscent'teki karşılığını da bulacaksın.",
  etiket: "blog · liste · 6 dk okuma",
};

export const SON_YAZILAR: { kategori: string; sure: string; baslik: string }[] = [
  { kategori: "karşılaştırma", sure: "4 dk", baslik: "[Yazı başlığı]" },
  { kategori: "nota rehberi", sure: "5 dk", baslik: "[Yazı başlığı]" },
  { kategori: "rehber", sure: "3 dk", baslik: "[Yazı başlığı]" },
];
