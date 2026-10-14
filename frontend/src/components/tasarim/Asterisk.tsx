// Köşelerde kullanılan süs işareti (✳). Salt görsel, aria-hidden.
export default function Asterisk({ boyut = 76, className = "" }: { boyut?: number; className?: string }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 100 100" aria-hidden="true" className={className} style={{ display: "block" }}>
      <g strokeWidth={13} strokeLinecap="butt" style={{ stroke: "var(--be)" }}>
        <path d="M50 4v92" />
        <path d="M4 50h92" />
        <path d="M17 17l66 66" />
        <path d="M83 17L17 83" />
      </g>
    </svg>
  );
}
