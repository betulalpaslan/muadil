// Parfümün kendi rengi (Parfum.Renk, "#RRGGBB") sayfada doğrudan kullanılmaz;
// tonu korunur, açıklığı sabitlenir, böylece her parfüm aynı pastel ailesine oturur.

export const VARSAYILAN_RENK = "#C9E3F5";

function hexGecerli(hex: string | null | undefined): hex is string {
  return !!hex && /^#[0-9a-fA-F]{6}$/.test(hex);
}

// açıklık: 0.86 sayfa zemini/klasör, 0.78 daha koyu çizgi tonu
export function pastel(hex: string | null | undefined, aciklik = 0.87): string {
  if (!hexGecerli(hex)) return VARSAYILAN_RENK;
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  let h = 0;
  let s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  // Siyaha yakın renkler bile hafif renkli kalsın, neon olmasın
  s = Math.min(Math.max(s, 0.38), 0.78);
  const L = aciklik;
  const q = L < 0.5 ? L * (1 + s) : L + s - L * s;
  const p = 2 * L - q;
  const kanal = (x: number) => {
    x = (x + 1) % 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  const hx = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${hx(kanal(h + 1 / 3))}${hx(kanal(h))}${hx(kanal(h - 1 / 3))}`;
}

// Renk noktası (sekmedeki küçük kare) parfümün gerçek rengini gösterir
export function gercekRenk(hex: string | null | undefined): string {
  return hexGecerli(hex) ? hex : "#2A1E26";
}
