// Blog yazısı özelliği gelene kadar sabit örnek veri. TASARIM.md §5.
// Mockup'taki köşeli parantezli "[Yazı başlığı]" gerçek yazı gelene dek yer tutucu olarak kalır.

import daringVanilla from "../assets/blog/zara/daring-vanilla.webp";
import hypnoticVanilla from "../assets/blog/zara/hypnotic-vanilla.webp";
import hypnoticVanillaBloom from "../assets/blog/zara/hypnotic-vanilla-bloom.webp";
import immortalVanillaBloom from "../assets/blog/zara/immortal-vanilla-bloom.webp";
import indulgentVanilla from "../assets/blog/zara/indulgent-vanilla.webp";

// Zara vanilya serisinin şişeleri: ana sayfadaki kapak (soldan sağa sırayla) ve okuma sayfası (alt alta) aynı
// diziyi kullanır. Fotoğrafların beyaz zemini silinmiş, hepsi aynı ölçüde ve aynı taban çizgisinde kırpılmış
// (161x539, şeffaf zemin); yenisini eklerken aynı biçimde hazırlanmalı.
// Açıklamalar Zara'nın ürün sayfalarındaki tanıtım metinlerinden (2026-10) Türkçe özetlendi. Notalar ülkeye göre
// değişebiliyor (ör. Hypnotic Vanilla'da bazı pazarlarda kayısı yerine armut çiçeği geçiyor).
export type ZaraSise = {
  ad: string;
  gorsel: string;
  aile: string; // koku ailesi / Zara'nın etiketi
  notalar: string[];
  aciklama: string;
};

export const ZARA_SISELER: ZaraSise[] = [
  {
    ad: "Hypnotic Vanilla",
    gorsel: hypnoticVanilla,
    aile: "Tatlı vanilya · orta yoğunluk",
    notalar: ["kayısı çiçeği", "yasemin", "Bourbon vanilyası", "yosun", "dulce de leche"],
    aciklama:
      "Kremsi ve ışıltılı bir vanilya. Bourbon vanilyası sıcak, saran bir tatlılık veriyor; kayısı çiçeği kokuya hafif bir parlaklık, kaşmir odunları ise pürüzsüz ve rahat bir doku katıyor. Zara'nın tarifiyle bağımlılık yapan, kadınsı bir buket.",
  },
  {
    ad: "Immortal Vanilla Bloom",
    gorsel: immortalVanillaBloom,
    aile: "Çiçeksi amber",
    notalar: ["armut", "tuzlu hindistan cevizi", "yasemin", "manolya", "karamel", "amber", "yumuşak misk", "kaşmir odunları"],
    aciklama:
      "Immortal Vanilla'nın en çiçeksi ve ışıltılı hali. Yasemin ve manolya vanilyayı daha hafif, daha parlak bir sensüellikle sarıyor; tuzlu hindistan cevizi kokuya güneşli, egzotik bir dokunuş ekliyor. Dipte çiçek açan vanilya amber, yumuşak misk ve kaşmir odunlarıyla sarılıyor.",
  },
  {
    ad: "Indulgent Vanilla",
    gorsel: indulgentVanilla,
    aile: "Meyveli amber · kremsi ve ışıltılı",
    notalar: ["badem kreması", "portakal çiçeği", "vanilya"],
    aciklama:
      "Açılışta badem kreması karşı konulmaz bir yumuşaklık veriyor, portakal çiçeği bu yumuşaklığı aydınlatıyor. Vanilya kompozisyonu kremsi ve parlak bir sıcaklıkla sarıyor. Zara bu kokuyu kremsi, ışıltılı ve bağımlılık yapıcı olarak tanımlıyor.",
  },
  {
    ad: "Daring Vanilla",
    gorsel: daringVanilla,
    aile: "Vanilya · amber · odunsu",
    notalar: ["yabani orkide", "vanilya", "siyah amber", "sıcak odunlar"],
    aciklama:
      "Açılışta yabani orkide, ardından yoğun ve sofistike bir vanilya geliyor. Dipte siyah amber ve sıcak odunlar kokuya derin, saran bir karakter ve kalıcı bir iz bırakma gücü veriyor. Serinin en cesur adayı.",
  },
  {
    ad: "Hypnotic Vanilla Bloom",
    gorsel: hypnoticVanillaBloom,
    aile: "Gurme amber vanilya · çiçeksi, ışıltılı",
    notalar: ["yasemin sambac", "kayısı çiçeği", "altın vanilya"],
    aciklama:
      "Hypnotic Vanilla'nın en çiçeksi ve en parlak versiyonu. Yasemin sambac ve kayısı çiçeğinden oluşan ışıltılı bir buket açılışı yapıyor ve altın vanilyayı daha hafif, daha geniş bir sensüellikle aydınlatıyor.",
  },
];

// Blogdaki nota adı veritabanındaki nota adıyla aynı değilse hangi notanın görselini kullanacağı
// (ör. "Bourbon vanilyası" -> Vanilya). Burada olmayan adlar doğrudan veritabanındaki adla eşleşmeyi dener;
// eşleşmeyen nota görselsiz (yıldızla) gösterilir.
export const NOTA_TAKMA_AD: Record<string, string> = {
  "kayısı çiçeği": "Kayısı",
  "Bourbon vanilyası": "Vanilya",
  "altın vanilya": "Vanilya",
  yosun: "Meşe yosunu",
  "dulce de leche": "Karamel",
  "tuzlu hindistan cevizi": "Hindistan cevizi",
  "yumuşak misk": "Misk",
  "kaşmir odunları": "Kaşmir ağacı",
  "badem kreması": "Badem",
  "yabani orkide": "Orkide",
  "siyah amber": "Amber",
  "sıcak odunlar": "Odunsu notalar",
  "yasemin sambac": "Yasemin",
};

// Ana sayfadaki başlık ve okuma sayfasının adresi (App.tsx rotası da buradan okur).
export const ONE_CIKAN_BLOG = {
  marka: "Zara",
  baslik: "vanilya serisi",
  yol: "/blog/zara-vanilya-serisi",
};
