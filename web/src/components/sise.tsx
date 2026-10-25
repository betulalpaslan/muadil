import Image from "next/image";

// Parfüm şişesi çizimi: görseli olmayan kayıtlar için. Renk parfümün renk alanından gelir.
export function Sise({ renk, buyuk = false, ad, olcek = 1, doldur = false }: { renk?: string | null; buyuk?: boolean; ad?: string; olcek?: number; doldur?: boolean }) {
  if (buyuk) {
    return (
      <svg role={ad ? "img" : undefined} aria-label={ad ? `${ad} şişesi` : undefined} aria-hidden={ad ? undefined : true} width={doldur ? "100%" : 100} height={doldur ? "100%" : 150} viewBox="0 0 140 200">
        <rect x="52" y="8" width="36" height="34" fill="var(--ink)" />
        <rect x="62" y="42" width="16" height="16" fill="var(--ink)" />
        <rect x="18" y="58" width="104" height="134" rx="6" fill={renk ?? "#5a0f1c"} />
        <rect x="38" y="100" width="64" height="44" fill="#f4eae6" />
        <rect x="26" y="66" width="8" height="118" fill="#ffffff" opacity="0.22" />
        <rect x="38" y="66" width="3" height="118" fill="#ffffff" opacity="0.12" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" width={30 * olcek} height={48 * olcek} viewBox="0 0 36 58">
      <rect x="12" y="0" width="12" height="10" fill="var(--ink)" />
      <rect x="15" y="10" width="6" height="5" fill="var(--ink)" />
      <rect x="2" y="15" width="32" height="43" rx="3" fill={renk ?? "#e9dcc2"} />
      <rect x="8" y="28" width="20" height="13" fill="#ffffff" />
    </svg>
  );
}

const CEVRE = 2 * Math.PI * 27;

// Yüzde halkası: tasarımdaki dairesel benzerlik göstergesi.
export function Halka({
  yuzde,
  boyut = 64,
  iz = "var(--track)",
  dolgu = "var(--ink)",
  yaziBoyutu = 16,
}: {
  yuzde: number;
  boyut?: number;
  iz?: string;
  dolgu?: string;
  yaziBoyutu?: number;
}) {
  return (
    <div className="relative shrink-0" style={{ width: boyut, height: boyut }} role="img" aria-label={`Benzerlik yüzde ${yuzde}`}>
      <svg aria-hidden="true" width={boyut} height={boyut} viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="32" cy="32" r="27" fill="none" stroke={iz} strokeWidth="5" />
        <circle cx="32" cy="32" r="27" fill="none" stroke={dolgu} strokeWidth="5" strokeDasharray={`${((CEVRE * yuzde) / 100).toFixed(1)} ${CEVRE.toFixed(1)}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-extrabold tracking-[-0.03em]" style={{ fontSize: yaziBoyutu }}>
        %{yuzde}
      </span>
    </div>
  );
}

// Marka logosu: kare, köşeleri tasarımın yarıçapında. Logosu olmayan markada şişe çizimi görünür.
export function MarkaLogosu({ url, ad, boyut = 64 }: { url: string | null; ad: string; boyut?: number }) {
  return (
    <div className="isilti flex shrink-0 items-center justify-center overflow-hidden" style={{ width: boyut, height: boyut, borderRadius: "var(--r-md)", background: "var(--surf)" }}>
      {url ? <Image src={url} alt={`${ad} logosu`} width={boyut * 2} height={boyut * 2} sizes={`${boyut}px`} className="h-full w-full object-cover" /> : <Sise olcek={boyut / 96} />}
    </div>
  );
}
