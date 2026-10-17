// Nota adlarını karşılaştırmak için anahtar: büyük-küçük harf, Türkçe karakter ve '-' / '_' farkı yok sayılır.
// Sunucudaki toplu görsel yüklemenin dosya adı eşleştirmesiyle aynı kural ("kayisi-cicegi" = "Kayısı çiçeği").
export function notaAnahtar(ad: string): string {
  return ad
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u");
}
