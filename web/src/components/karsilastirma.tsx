import Image from "next/image";
import Link from "next/link";
import { adBuyuk, tl } from "@/lib/site";
import type { KarsilastirmaVeri, MuadilOzet } from "@/lib/veri";
import { yuzde } from "@/components/parcalar";
import { Halka, MarkaLogosu, Sise } from "@/components/sise";

// En benzeyen başta; eşitlikte ucuz olan önce.
export function enIyiSirasi(liste: MuadilOzet[]) {
  return [...liste].sort((a, b) => b.benzerlik - a.benzerlik || a.fiyat - b.fiyat);
}

// Parfüm sayfasındaki muadil listesi satırı (ana sayfa bunun yerine EnIyiKart / MuadilKucuk kullanır).
export function MuadilSatir({ m, en }: { m: MuadilOzet; en: boolean }) {
  return (
    <li
      className={`satir cam-kart ${en ? "en-iyi" : "kay"}`}
      style={{ borderRadius: "var(--r-lg)", background: en ? "var(--inv)" : "var(--cam)" }}
    >
      {en && (
        <span
          className="absolute -top-[13px] left-3.5 z-10 inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold tracking-[0.12em]"
          style={{ background: "var(--gold-surf)", color: "var(--btnfg)", borderRadius: "var(--r-pill)", boxShadow: "0 4px 14px var(--shadow)" }}
        >
          <i className="yildiz" aria-hidden="true">
            ✦
          </i>
          EN İYİ EŞLEŞME
        </span>
      )}
      <Link href={`/muadil/${m.slug}`} className={`relative flex items-center gap-3 pr-4 pl-3 sm:gap-[18px] ${en ? "min-h-28" : "min-h-24"}`} style={{ borderRadius: "var(--r-lg)" }}>
        <span className="kutu-img shrink-0">
          <MarkaLogosu url={m.markaLogo} ad={m.markaAd} boyut={en ? 72 : 64} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className={`truncate font-medium tracking-[0.2em] ${en ? "text-[15px] font-bold" : "text-[13px]"}`}>{adBuyuk(m.markaAd)}</span>
          <span className={`truncate leading-[1.1] ${en ? "text-[22px]" : "text-[19px]"}`} style={{ color: en ? "var(--invfg)" : "var(--muted)" }}>
            {m.kod}
          </span>
          {en && (
            <span className="inline-flex items-center gap-1.5 text-xs leading-[1.3] font-medium" style={{ color: "var(--invmuted)" }}>
              <span className="size-1.5 rounded-full" style={{ background: "var(--invaccent)" }} />
              En yüksek benzerlik · Önerilen
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-[3px]">
          <span className={`font-medium whitespace-nowrap ${en ? "text-[28px]" : "text-2xl"}`}>{tl(m.fiyat)}</span>
          <span className="text-xs whitespace-nowrap" style={{ color: en ? "var(--invmuted)" : "var(--muted)" }}>
            Kalıcılık {m.kalicilik}/10
          </span>
        </div>
        <div className={en ? "scale-[1.15]" : ""}>
          <Halka yuzde={yuzde(m.benzerlik)} iz={en ? "var(--invtrack)" : "var(--track)"} dolgu={en ? "var(--invaccent)" : "var(--gold-hi)"} />
        </div>
      </Link>
    </li>
  );
}

// Ana sayfadaki büyük "en iyi eşleşme" kartı.
function EnIyiKart({ m }: { m: MuadilOzet }) {
  return (
    <Link href={`/muadil/${m.slug}`} className="cam-kart relative flex items-center gap-4 p-5" style={{ borderRadius: "var(--r-lg)" }}>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
        <span className="etiket-hap">En İyi Eşleşme</span>
        <span className="truncate text-[26px] leading-none font-medium tracking-[0.01em]">
          {adBuyuk(m.markaAd)} {adBuyuk(m.kod)}
        </span>
        <span className="text-xl font-medium" style={{ color: "var(--muted)" }}>
          {tl(m.fiyat)}
        </span>
      </div>
      <Halka yuzde={yuzde(m.benzerlik)} boyut={84} iz="var(--track)" dolgu="var(--gold-hi)" yaziBoyutu={19} />
    </Link>
  );
}

// Ana sayfadaki küçük muadil kartları: marka, kod, fiyat ve benzerlik halkası.
function MuadilKucuk({ m }: { m: MuadilOzet }) {
  return (
    <Link href={`/muadil/${m.slug}`} className="cam-kart flex min-h-[132px] w-full min-w-0 flex-col gap-3 p-4" style={{ borderRadius: "var(--r-lg)" }}>
      <div className="flex items-center gap-2">
        <MarkaLogosu url={m.markaLogo} ad={m.markaAd} boyut={30} />
        <span className="truncate text-[13px] font-bold tracking-[0.08em]">{adBuyuk(m.markaAd)}</span>
      </div>
      <span className="truncate text-[15px] font-medium">{m.kod}</span>
      <div className="mt-auto flex items-end justify-between gap-2 border-t pt-2" style={{ borderColor: "var(--line)" }}>
        <span className="text-[13px] font-medium whitespace-nowrap" style={{ color: "var(--muted)" }}>
          {tl(m.fiyat)}
        </span>
        <Halka yuzde={yuzde(m.benzerlik)} boyut={34} yaziBoyutu={9} dolgu="var(--gold-hi)" />
      </div>
    </Link>
  );
}

// Orijinal ile muadillerini yan yana gösteren ana bileşen: "Muadil bulucu".
export function Karsilastirma({
  veri,
  sinir,
}: {
  veri: KarsilastirmaVeri;
  /** Verilirse yalnızca ilk `sinir` muadil görünür, hepsi için parfüm sayfasına giden "Hepsini gör" bağlantısı çıkar. */
  sinir?: number;
}) {
  const sirali = enIyiSirasi(veri.muadiller);
  const ad = `${veri.markaAd} ${veri.ad}`;
  const gorunen = sirali.slice(0, sinir);

  return (
    <div className="flex flex-col gap-5">
      <h2 className="sr">
        {ad} için {sirali.length} muadil
      </h2>
      <div className="grid items-center gap-6 min-[900px]:grid-cols-[minmax(0,400px)_200px_minmax(0,1fr)] min-[900px]:gap-0">
        <Link href={`/parfum/${veri.slug}`} className="rise relative z-10 block">
          <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-7" style={{ borderRadius: 28, background: "var(--cam)", border: "1px solid var(--cam-sinir)", boxShadow: "0 24px 60px var(--shadow)" }}>
            <div className={`cerceve flex h-[270px] w-full items-center justify-center ${veri.gorselUrl ? "overflow-hidden" : "p-6"}`}>
              {veri.gorselUrl ? (
                <Image src={veri.gorselUrl} alt={ad} width={900} height={900} sizes="400px" quality={90} className="h-full w-full object-cover object-center" />
              ) : (
                <Sise buyuk doldur renk={veri.renk} ad={ad} />
              )}
            </div>
            <span className="etiket-hap">Orijinal</span>
            <span className="text-[44px] leading-[1.05] font-medium tracking-[-0.01em]">{veri.ad}</span>
            <span className="text-[22px] font-light">{veri.markaAd}</span>
            {veri.notalar.length > 0 && <span className="text-sm" style={{ color: "var(--muted)" }}>{veri.notalar.join(" · ")}</span>}
          </div>
        </Link>

        <Baglanti />

        {sirali.length === 0 ? (
          <p className="min-w-0" style={{ color: "var(--muted)" }}>
            Bu parfüm için henüz muadil eklenmedi.
          </p>
        ) : (
          <div className="kay relative z-10 flex min-w-0 flex-col gap-5">
            <EnIyiKart m={gorunen[0]} />
            {gorunen.length > 1 && (
              <ol className="m-0 grid list-none grid-cols-1 gap-5 p-0 min-[560px]:grid-cols-[repeat(3,minmax(0,1fr))]">
                {gorunen.slice(1).map((m) => (
                  <li key={m.id} className="flex min-w-0">
                    <MuadilKucuk m={m} />
                  </li>
                ))}
              </ol>
            )}
            {sinir !== undefined && sirali.length > 1 && (
              <div className="flex justify-center">
                <Link href={`/parfum/${veri.slug}`} className="cizgi-btn">
                  HEPSİNİ GÖR ({sirali.length})
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Orijinal ile muadiller arasındaki "VS" dairesi; dar ekranda gizlenir.
function Baglanti() {
  return (
    <div className="relative hidden h-[360px] min-[900px]:block" aria-hidden="true">
      {/* arka-dalga.webp: sayfa arka planı; dalganın kırılma noktası (%47.24, %60.87) VS merkezine oturur */}
      <Image
        src="/arka-dalga.webp"
        alt=""
        width={2752}
        height={1536}
        unoptimized
        priority
        className="arka-dalga pointer-events-none absolute max-w-none"
        style={{
          ["--g" as string]: "max(2400px, 115vw)",
          width: "var(--g)",
          height: "auto",
          left: "calc(50% - var(--g) * 0.4724)",
          top: "calc(50% - var(--g) * 0.3397)",
          zIndex: -1,
        }}
      />
      <div className="vs flex items-center justify-center">
        <span className="text-[36px] leading-none font-medium text-white">VS</span>
      </div>
    </div>
  );
}

// Öne çıkan çiftler: orijinal ve en çok benzeyen muadili, ortada benzerlik halkasıyla.
export function EslesmeKartlari({ liste }: { liste: KarsilastirmaVeri[] }) {
  const kartlar = liste
    .map((v) => ({ v, en: enIyiSirasi(v.muadiller)[0] }))
    .filter((k): k is { v: KarsilastirmaVeri; en: MuadilOzet } => Boolean(k.en));

  return (
    <div className="flex flex-wrap gap-5">
      {kartlar.map(({ v, en }) => (
        <Link
          key={v.slug}
          href={`/parfum/${v.slug}`}
          aria-label={`${v.markaAd} ${v.ad} ile ${en.markaAd} ${en.kod} karşılaştır, yüzde ${yuzde(en.benzerlik)} benzer`}
          className="cam-kart rise relative flex min-w-0 flex-[1_1_340px] gap-16 p-4"
          style={{ borderRadius: "var(--r-lg)" }}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="cerceve mx-1.5 mt-1.5 flex h-[140px] items-center justify-center overflow-hidden">
              {v.gorselUrl ? (
                <Image src={v.gorselUrl} alt={`${v.markaAd} ${v.ad}`} width={320} height={320} sizes="180px" quality={90} className="h-full w-full object-cover object-center" />
              ) : (
                <Sise renk={v.renk} olcek={1.6} />
              )}
            </div>
            <div className="flex flex-col gap-0.5 px-1">
              <span className="text-[10px] font-bold tracking-[0.12em]" style={{ color: "var(--muted)" }}>{adBuyuk(v.markaAd)}</span>
              <span className="text-[17px] leading-[1.1] font-medium">{v.ad}</span>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="cerceve mx-1.5 mt-1.5 flex h-[140px] items-center justify-center overflow-hidden">
              {en.markaLogo ? (
                <Image src={en.markaLogo} alt={`${en.markaAd} logosu`} width={320} height={320} sizes="180px" className="h-full w-full object-contain object-center p-2" />
              ) : (
                <Sise olcek={1.6} />
              )}
            </div>
            <div className="flex flex-col gap-0.5 px-1">
              <span className="text-[10px] font-bold tracking-[0.12em]" style={{ color: "var(--muted)" }}>{adBuyuk(en.markaAd)}</span>
              <span className="text-[17px] leading-[1.1] font-medium">{en.kod}</span>
            </div>
            <span className="mt-auto px-1 text-[17px] font-medium text-vurgu">{tl(en.fiyat)}</span>
          </div>

          <div className="absolute top-[66px] left-1/2 -ml-[24px] h-[48px] w-[48px] rounded-full" style={{ background: "var(--paper)", boxShadow: "0 0 0 4px rgb(255 255 255 / 0.5)" }}>
            <Halka yuzde={yuzde(en.benzerlik)} boyut={48} dolgu="var(--gold-hi)" yaziBoyutu={12} />
          </div>
        </Link>
      ))}
    </div>
  );
}
