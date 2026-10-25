// Parfüm fotoğraflarının boş kenarlarını kırpar, ürünü kare çerçevenin ortasına alır.
// Kullanım: node --env-file=.env scripts/gorsel-ortala.mjs [--uygula]
// Varsayılan kuru çalıştırmadır: sonuçları uploads-onizleme/ klasörüne yazar. --uygula ile public/uploads üzerine yazar
// (özgün dosyalar önce uploads-yedek/ klasörüne kopyalanır).
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname } from "node:path";
import postgres from "postgres";
import sharp from "sharp";

const uygula = process.argv.includes("--uygula");
const hedef = uygula ? "public/uploads" : "uploads-onizleme";
mkdirSync(hedef, { recursive: true });
if (uygula) mkdirSync("uploads-yedek", { recursive: true });

const sql = postgres(process.env.DATABASE_URL);
const kayitlar = await sql`select slug, gorsel_url as url from parfum where gorsel_url is not null`;
await sql.end();

const KARE = 800;
const BOSLUK = 0.07; // ürünün çevresinde bırakılan pay
const FARK = 28; // arka plandan bu kadar ayrılan piksel "üründür"

for (const { slug, url } of kayitlar) {
  const kaynak = `public${url}`;
  const ad = basename(url);
  const bicim = extname(ad).slice(1).toLowerCase();

  // Windows'ta sharp dosyayı açık tutup üzerine yazmayı engellediği için dosya tampondan okunur
  const giris = readFileSync(kaynak);
  const meta = await sharp(giris).metadata();
  const olcek = Math.min(1, 600 / Math.max(meta.width, meta.height));
  const { data, info } = await sharp(giris)
    .flatten({ background: "#ffffff" })
    .resize(Math.round(meta.width * olcek), Math.round(meta.height * olcek))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Arka plan rengi: kenar piksellerinin ortalaması
  const { width: w, height: h } = info;
  const px = (x, y) => (y * w + x) * 3;
  let r = 0, g = 0, b = 0, n = 0;
  for (let x = 0; x < w; x++) for (const y of [0, h - 1]) { const i = px(x, y); r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) { const i = px(x, y); r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
  const bg = [r / n, g / n, b / n];

  const uzak = (x, y) => {
    const i = px(x, y);
    return Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) > FARK;
  };
  const satir = new Array(h).fill(0);
  const sutun = new Array(w).fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (uzak(x, y)) { satir[y]++; sutun[x]++; }
  const ilk = (a) => a.findIndex((v) => v >= 2);
  const son = (a) => a.length - 1 - [...a].reverse().findIndex((v) => v >= 2);
  let [x0, x1, y0, y1] = [ilk(sutun), son(sutun), ilk(satir), son(satir)];
  if (x0 < 0 || y0 < 0 || x1 <= x0 || y1 <= y0) { x0 = 0; y0 = 0; x1 = w - 1; y1 = h - 1; }

  // Özgün çözünürlüğe çevir, kare yap, pay bırak
  const k = 1 / olcek;
  const bw = (x1 - x0 + 1) * k, bh = (y1 - y0 + 1) * k;
  const kenar = Math.max(bw, bh) * (1 + 2 * BOSLUK);
  const cx = ((x0 + x1 + 1) / 2) * k, cy = ((y0 + y1 + 1) / 2) * k;
  const sol = Math.round(cx - kenar / 2), ust = Math.round(cy - kenar / 2);
  const kenarR = Math.round(kenar);

  const arka = { r: Math.round(bg[0]), g: Math.round(bg[1]), b: Math.round(bg[2]) };
  // Önce kareyi arka plan renginde oluştur, kırpılan parçayı ortasına yerleştir
  const kesitSol = Math.max(0, sol), kesitUst = Math.max(0, ust);
  const kesitSag = Math.min(meta.width, sol + kenarR), kesitAlt = Math.min(meta.height, ust + kenarR);
  const parca = await sharp(giris)
    .flatten({ background: "#ffffff" })
    .extract({ left: kesitSol, top: kesitUst, width: kesitSag - kesitSol, height: kesitAlt - kesitUst })
    .toBuffer();
  // sharp önce yeniden boyutlandırıp sonra birleştirdiği için kare ayrı adımda tamponlanır
  const kare = await sharp({ create: { width: kenarR, height: kenarR, channels: 3, background: arka } })
    .composite([{ input: parca, left: kesitSol - sol, top: kesitUst - ust }])
    .png()
    .toBuffer();
  let cikti = sharp(kare).resize(KARE, KARE);
  cikti = bicim === "png" ? cikti.png() : bicim === "webp" ? cikti.webp({ quality: 90 }) : cikti.jpeg({ quality: 90 });

  if (uygula) {
    const yedek = `uploads-yedek/${ad}`;
    if (!existsSync(yedek)) copyFileSync(kaynak, yedek);
  }
  writeFileSync(`${hedef}/${ad}`, await cikti.toBuffer()); // girdiyle aynı dosyaya yazılabildiği için tampon üzerinden
  console.log(`${slug.padEnd(48)} ${meta.width}x${meta.height} -> ürün ${Math.round(bw)}x${Math.round(bh)} -> ${KARE}x${KARE}`);
}
