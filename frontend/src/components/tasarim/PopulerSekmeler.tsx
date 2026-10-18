import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { pastel } from "../../tasarim/renk";
import Cerceve from "./Cerceve";
import ParfumSisesi from "./ParfumSisesi";

// Ana sayfadaki "Bu hafta en popüler" sekmeli klasörü.
// Sekmeler yan yana; seçili sekme ve altındaki panel yazı renginde (gecede krem, gündüzde koyu).
// Klavye: ← → sekmeler arasında gezer, Home/End ilk/son sekme (WAI-ARIA tabs).

export type PopulerParfum = {
  id: number;
  ad: string;
  marka: string;
  renk: string | null;
  gorselUrl: string | null; // gorselAdresi() ile çözülmüş tam adres
  enUygun: string; // tl() ile biçimlenmiş
  muadiller: { marka: string; kod: string; fiyat: string }[];
};

export default function PopulerSekmeler({ parfumler }: { parfumler: PopulerParfum[] }) {
  const [secili, setSecili] = useState(0);
  const sekmeler = useRef<(HTMLButtonElement | null)[]>([]);
  if (parfumler.length === 0) return null;
  const p = parfumler[Math.min(secili, parfumler.length - 1)];
  const no = (i: number) => String(i + 2).padStart(2, "0");

  function tus(e: KeyboardEvent<HTMLDivElement>) {
    const son = parfumler.length - 1;
    let yeni = secili;
    if (e.key === "ArrowRight") yeni = secili === son ? 0 : secili + 1;
    else if (e.key === "ArrowLeft") yeni = secili === 0 ? son : secili - 1;
    else if (e.key === "Home") yeni = 0;
    else if (e.key === "End") yeni = son;
    else return;
    e.preventDefault();
    setSecili(yeni);
    sekmeler.current[yeni]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Popüler parfümler" onKeyDown={tus} className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
        {parfumler.map((x, i) => {
          const aktif = i === secili;
          return (
            <button
              key={x.id}
              ref={(el) => {
                sekmeler.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`sekme-${x.id}`}
              aria-selected={aktif}
              aria-controls="populer-panel"
              tabIndex={aktif ? 0 : -1}
              onClick={() => setSecili(i)}
              className={`kucuk flex min-h-12 flex-[1_0_160px] cursor-pointer items-center gap-2.5 rounded-t-[14px] border-[1.5px] border-b-0 border-yazi px-4 text-[9px] font-bold tracking-[.18em] whitespace-nowrap transition-colors ${
                aktif ? "bg-yazi text-zemin" : "bg-transparent text-yazi hover:bg-yuzey"
              }`}
            >
              <span className="opacity-60">{no(i)}</span>
              <span className="overflow-hidden text-ellipsis">{x.ad}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="populer-panel"
        aria-labelledby={`sekme-${p.id}`}
        className="flex flex-wrap items-center gap-[clamp(28px,5vw,60px)] rounded-b-[14px] bg-yazi p-[clamp(26px,4vw,50px)] text-zemin"
      >
        <div className="mx-auto min-w-[220px] flex-[0_1_290px]">
          <Cerceve ters sol={p.ad} sag={`no. ${no(secili)}`}>
            <div className="flex aspect-[4/5] items-center justify-center" style={{ background: pastel(p.renk, 0.8), filter: "saturate(.6)" }}>
              {p.gorselUrl ? (
                <img src={p.gorselUrl} alt={p.ad} className="h-full w-full object-cover" />
              ) : (
                <ParfumSisesi genislik={130} govde="#0B0B0B" parlak="#F2EEE8" />
              )}
            </div>
          </Cerceve>
        </div>
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-[18px]">
          <div className="flex items-center justify-between">
            <span className="kucuk opacity-70">{p.marka} · orijinal</span>
            <span className="text-[13px] font-bold tracking-[.08em]">{no(secili)}</span>
          </div>
          <h3 className="genis m-0 text-[clamp(30px,3.8vw,52px)] leading-[1.15] font-extrabold">{p.ad}</h3>
          <span className="genis text-[15px]">
            <span className="text-vurgu-ters">{p.muadiller.length} muadil</span> · en uygun {p.enUygun}
          </span>
          <div className="flex flex-wrap gap-3">
            {p.muadiller.map((m) => (
              <span key={m.marka + m.kod} className="inline-flex min-h-[76px] flex-col justify-center gap-1 rounded-full border-2 border-zemin px-8">
                <span className="kucuk text-[11px] opacity-70">{m.marka}</span>
                <span className="text-[22px] leading-none font-bold tracking-[.08em]">
                  {m.kod} <span className="text-[15px] font-medium opacity-80">{m.fiyat}</span>
                </span>
              </span>
            ))}
          </div>
          <Link
            to={`/parfum/${p.id}`}
            className="kucuk inline-flex min-h-16 items-center gap-4 self-start rounded-full bg-zemin py-2 pr-2.5 pl-9 text-[14px] font-extrabold tracking-[.2em] text-yazi no-underline transition-transform hover:scale-[1.03]"
          >
            detaya git
            <span aria-hidden="true" className="inline-flex size-11 items-center justify-center rounded-full bg-yazi text-zemin">
              <svg width="18" height="18" viewBox="0 0 20 20">
                <path d="M5 15L15 5M7 5h8v8" fill="none" stroke="currentColor" strokeWidth="2.6" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
