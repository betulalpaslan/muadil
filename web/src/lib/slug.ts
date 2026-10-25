const HARITA: Record<string, string> = { ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c" };

// "Yves Saint Laurent Libre" -> "yves-saint-laurent-libre"
export function slugla(metin: string): string {
  return metin
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (h) => HARITA[h])
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " ve ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Aynı slug'dan birden çok varsa ikincisinden itibaren -2, -3 ekler.
export function benzersizSlug(taban: string, kullanilan: Set<string>): string {
  let slug = taban || "x";
  for (let i = 2; kullanilan.has(slug); i++) slug = `${taban}-${i}`;
  kullanilan.add(slug);
  return slug;
}
