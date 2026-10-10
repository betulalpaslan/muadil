// 600 -> "₺600", 599.99 -> "₺599,99"
export const tl = (n: number) =>
  n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0, maximumFractionDigits: 2 });
