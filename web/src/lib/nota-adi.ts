// " pembe   BİBER " -> "Pembe biber". Sunucu (içe aktarma, yönetim eylemleri) ve tarayıcı (nota seçici) aynı kuralı kullanır.
export function notaAdiDuzenle(ad: string): string {
  const temiz = ad.split(/\s+/).filter(Boolean).join(" ");
  if (!temiz) return temiz;
  return temiz.charAt(0).toLocaleUpperCase("tr-TR") + temiz.slice(1).toLocaleLowerCase("tr-TR");
}
