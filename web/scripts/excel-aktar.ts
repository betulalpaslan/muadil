// Kullanım: npx tsx scripts/excel-aktar.ts dosya.xlsx [--kaydet]
// --kaydet yoksa kuru çalıştırmadır (hiçbir şey yazılmaz). Kayıttan sonra site önbelleği tazelenir.
import { excelOku, uygula } from "../src/lib/ice-aktar";

async function main() {
  const dosya = process.argv[2];
  const kaydet = process.argv.includes("--kaydet");
  if (!dosya) throw new Error("Kullanım: excel-aktar.ts dosya.xlsx [--kaydet]");

  const { parfumler, muadiller, hatalar: okumaHatalari } = await excelOku(dosya);
  const { ozet, hatalar: uygulamaHatalari } = await uygula(parfumler, muadiller, kaydet);
  const hatalar = [...okumaHatalari, ...uygulamaHatalari];

  if (hatalar.length) {
    console.error(`${hatalar.length} hata, hiçbir şey kaydedilmedi:`);
    for (const h of hatalar) console.error(`  ${h.sayfa} satır ${h.satir}: ${h.mesaj}`);
    process.exit(1);
  }
  console.log(kaydet ? "KAYDEDİLDİ" : "KURU ÇALIŞTIRMA (kaydedilmedi)", ozet);

  const url = process.env.YENILE_URL;
  if (kaydet && url && process.env.YENILE_ANAHTARI) {
    const r = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${process.env.YENILE_ANAHTARI}` } });
    console.log("Önbellek tazeleme:", r.status);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
