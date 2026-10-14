import { useTema } from "../../tasarim/tema";

// Header'ın üst satırındaki hap düğme: gecedeyken "gündüz" (güneş), gündüzdeyken "gece" (ay) yazar.
export default function TemaDugmesi() {
  const { tema, degistir } = useTema();
  const gece = tema === "gece";
  return (
    <button
      type="button"
      onClick={degistir}
      aria-label={gece ? "Gündüz temasına geç" : "Gece temasına geç"}
      aria-pressed={!gece}
      className="cizgili kucuk inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-yazi bg-transparent px-3.5 text-[9px] text-yazi"
    >
      {gece ? (
        <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="4" style={{ fill: "currentColor" }} />
          <path
            d="M10 1v3M10 16v3M1 10h3M16 10h3M3.6 3.6l2.1 2.1M14.3 14.3l2.1 2.1M3.6 16.4l2.1-2.1M14.3 5.7l2.1-2.1"
            style={{ stroke: "currentColor" }}
            strokeWidth={1.8}
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M15.5 13.2A7 7 0 0 1 6.8 4.5a7 7 0 1 0 8.7 8.7z" style={{ fill: "currentColor" }} />
        </svg>
      )}
      {gece ? "gündüz" : "gece"}
    </button>
  );
}
