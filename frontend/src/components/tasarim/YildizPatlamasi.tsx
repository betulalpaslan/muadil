// Yıldız patlaması süsü. Salt görsel, aria-hidden.
const NOKTALAR =
  "50.0,0.0 56.7,24.9 75.0,6.7 68.4,31.6 93.3,25.0 75.1,43.3 100.0,50.0 75.1,56.7 93.3,75.0 68.4,68.4 75.0,93.3 56.7,75.1 50.0,100.0 43.3,75.1 25.0,93.3 31.6,68.4 6.7,75.0 24.9,56.7 0.0,50.0 24.9,43.3 6.7,25.0 31.6,31.6 25.0,6.7 43.3,24.9";

export default function YildizPatlamasi({ boyut = 70, className = "" }: { boyut?: number; className?: string }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 100 100" aria-hidden="true" className={className} style={{ display: "block" }}>
      <polygon points={NOKTALAR} style={{ fill: "var(--be)" }} />
    </svg>
  );
}
