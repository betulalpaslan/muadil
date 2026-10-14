// İki ince çizgi arasında sonsuz kayan yazı. Süs olduğu için ekran okuyucudan gizli.
const PARCA = "kodunu bul  ✦  bargello  ✦  mad  ✦  muscent  ✦  aynı koku, uygun fiyat  ✦  ";

export default function KayanSerit() {
  return (
    <div aria-hidden="true" className="overflow-hidden border-y-[1.5px] border-yazi">
      <div className="serit-kay kucuk flex w-max py-[13px] text-[11px] whitespace-nowrap">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i}>{PARCA}</span>
        ))}
      </div>
    </div>
  );
}
