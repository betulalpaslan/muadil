import type { ReactNode } from "react";

// Fotoğraf çerçevesi: düz, eğik değil, kenarlar düz (tırtık yok). Altta küçük etiket satırı.
// ters: koyu bant üstünde (ör. gündüzde popüler paneli) çerçeve zeminle aynı renkte olsun diye.
export default function Cerceve({
  children,
  sol,
  sag,
  ters = false,
  className = "",
}: {
  children: ReactNode;
  sol: ReactNode;
  sag: ReactNode;
  ters?: boolean;
  className?: string;
}) {
  return (
    <figure className={`cerceve m-0 ${ters ? "bg-zemin text-yazi" : "bg-yazi text-zemin"} ${className}`}>
      {children}
      <figcaption className="kucuk mt-2.5 flex justify-between gap-2.5 text-[8px]">
        <span>{sol}</span>
        <span>{sag}</span>
      </figcaption>
    </figure>
  );
}
