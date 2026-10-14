// Markanın şişe simgesi: yuvarlak gövde, parlama, pompa topu, üç yıldız. Renkler temadan gelir
// (CSS değişkenleri SVG özniteliklerinde çalışmadığı için fill/stroke style ile verilir).
// Kendi çizimimiz; lisans gerektirmez. viewBox 240x260, püskürtme deliği (122, 53).

type Props = {
  genislik?: number;
  govde?: string; // şişe rengi; varsayılan temanın yazı rengi
  parlak?: string; // parlama ve delik; varsayılan temanın zemin rengi
  sikiliyor?: boolean; // pompa topu basılı
  yildizlarSoluk?: boolean; // püskürtme anında yıldızlar bir an söner
  className?: string;
};

function yildiz(x: number, y: number, r: number) {
  return `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
}
const YILDIZLAR = yildiz(46, 24, 15) + yildiz(72, 50, 10) + yildiz(98, 30, 6);

// Püskürtme deliğinin svg içindeki oranı; parıltılar buradan çıkar
export const DELIK = { x: 122 / 240, y: 53 / 260 };

export default function ParfumSisesi({
  genislik = 150,
  govde = "var(--be)",
  parlak = "var(--si)",
  sikiliyor = false,
  yildizlarSoluk = false,
  className,
}: Props) {
  const KOYU = govde;
  const KREM = parlak;
  const yukseklik = Math.round((genislik * 260) / 240);
  return (
    <svg
      width={genislik}
      height={yukseklik}
      viewBox="0 0 240 260"
      aria-hidden="true"
      className={className}
      style={{ display: "block", overflow: "visible" }}
    >
      <path
        d={YILDIZLAR}
        style={{
          fill: KOYU,
          transformOrigin: "72px 40px",
          opacity: yildizlarSoluk ? 0.35 : 1,
          transform: yildizlarSoluk ? "scale(1.25)" : "none",
          transition: "opacity .4s ease, transform .4s ease",
        }}
      />
      <g
        style={{
          transformOrigin: "200px 62px",
          transform: sikiliyor ? "scale(0.78, 0.84) rotate(-6deg)" : "none",
          transition: "transform .14s ease",
        }}
      >
        <path d="M146 50C172 40 190 44 200 62" style={{ fill: "none", stroke: KOYU }} strokeWidth={6} strokeLinecap="round" />
        <ellipse cx={210} cy={84} rx={17} ry={23} transform="rotate(-25 210 84)" style={{ fill: KOYU }} />
      </g>
      <rect x={110} y={38} width={40} height={32} rx={8} style={{ fill: KOYU }} />
      <circle cx={122} cy={53} r={5} style={{ fill: KREM }} />
      <rect x={94} y={72} width={70} height={42} rx={8} style={{ fill: KOYU }} />
      <ellipse cx={128} cy={180} rx={102} ry={76} style={{ fill: KOYU }} />
      <path d="M88 120Q34 182 88 244Q70 182 88 120Z" style={{ fill: KREM }} />
    </svg>
  );
}
