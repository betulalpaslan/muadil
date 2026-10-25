export const SITE_ADI = "Muadil";
export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const sayiBicim = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
// Tasarımdaki gibi sayı önce, ardından TL (bölünmeyen boşlukla): 1.250 TL
export const tl = (n: number) => `${sayiBicim.format(n)} TL`;

const tarihBicim = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" });
export const tarih = (iso: string) => tarihBicim.format(new Date(iso));

// Marka ve parfüm adları özel isimdir: büyük harfe çevrilirken "i" -> "İ" olmasın ("DIOR", "LIBRE").
// Adda Türkçeye özgü "ı" ya da "İ" varsa Türkçe kurallar uygulanır.
export const adDili = (ad: string) => (/[ıİ]/.test(ad) ? "tr" : "en");
export const adBuyuk = (ad: string) => ad.toLocaleUpperCase(adDili(ad) === "tr" ? "tr-TR" : "en-US");

export const CINSIYET_ADI = { kadin: "Kadın", erkek: "Erkek", unisex: "Unisex" } as const;
