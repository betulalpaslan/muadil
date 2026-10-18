// İki ince çizgi arasında sonsuz kayan yazı. Süs olduğu için ekran okuyucudan gizli.
const PARCA = "kodunu bul  ✦  bargello  ✦  mad  ✦  muscent  ✦  aynı koku, uygun fiyat  ✦  ";

export default function KayanSerit() {
  return (
    <div aria-hidden="true" className="overflow-hidden border-y-[1.5px] border-[var(--serit-bd)] text-[var(--serit-fg)] [background:var(--serit-bg)]">
      <div className="serit-kay kucuk flex w-max py-[clamp(13px,1.6vw,20px)] text-[clamp(12px,1.3vw,17px)] tracking-[0.2em] whitespace-nowrap">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i}>{PARCA}</span>
        ))}
      </div>
    </div>
  );
}
