// Kullanıcı değerlendirme ortalaması: 4,2 gibi tek ondalıklı Türkçe gösterim.
export function ortalamaYaz(ortalama: number) {
  return ortalama.toLocaleString("tr-TR", { minimumFractionDigits: 1 });
}
