import { adBuyuk } from "@/lib/site";
import { enIyiSirasi } from "@/components/karsilastirma";
import { yuzde } from "@/components/parcalar";
import type { KarsilastirmaVeri } from "@/lib/veri";

const MARKALAR = ["Bargello", "Muscent", "Mad", "Notalar", "Kalıcılık", "Benzerlik, yüzdeyle"];

// Sayfa altındaki iki şerit: üstte öne çıkan eşleşmeler (sağdan sola), altta markalar (soldan sağa).
// Kesintisiz döngü için içerik iki kez yazılır; şerit %50 kayar.
export function AkisSeridi({ vitrin }: { vitrin: KarsilastirmaVeri[] }) {
  const eslesmeler = vitrin.flatMap((v) => enIyiSirasi(v.muadiller).slice(0, 2).map((m) => ({ id: m.id, orijinal: adBuyuk(v.ad), muadil: `${adBuyuk(m.markaAd)} ${adBuyuk(m.kod)}`, yuzde: yuzde(m.benzerlik) })));

  return (
    <div className="relative" style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--paper)" }} aria-label="Eşleşme akışı ve markalar">
      {eslesmeler.length > 0 && (
        <>
          <div className="absolute top-0 left-0 z-10 flex h-[38px] items-center py-0 pr-12 pl-6" style={{ background: "linear-gradient(90deg, var(--paper) 65%, transparent)" }}>
            <span className="canli">CANLI</span>
          </div>
          <div className="akis-serit">
            <div className="serit" aria-hidden="true">
              {[0, 1].flatMap((tur) =>
                eslesmeler.map((e) => (
                  <span key={`${tur}-${e.id}`} className="tik">
                    {e.orijinal} <em className="font-semibold not-italic text-soluk">→</em> {e.muadil} <b className="font-bold text-vurgu tabular-nums">%{e.yuzde}</b>
                  </span>
                )),
              )}
            </div>
          </div>
        </>
      )}
      <div className="akis-serit">
        <div className="serit ters" aria-hidden="true">
          {[0, 1, 2, 3].flatMap((tur) =>
            MARKALAR.map((m) => (
              <span key={`${tur}-${m}`} className="inline-flex items-center">
                <span className="px-[22px] text-[19px] font-medium">{m}</span>
                <i className="yildiz text-[var(--gold)]">✦</i>
              </span>
            )),
          )}
        </div>
      </div>
    </div>
  );
}
