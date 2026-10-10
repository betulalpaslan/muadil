import { Link, useSearchParams } from "react-router-dom";
import SozlukYonetimi from "./SozlukYonetimi";
import ParfumYonetimi from "./ParfumYonetimi";

const SEKMELER = [
  { id: "parfumler", etiket: "Parfümler" },
  { id: "markalar", etiket: "Markalar" },
  { id: "notalar", etiket: "Notalar" },
] as const;

export default function AdminSayfasi() {
  const [params] = useSearchParams();
  const sekme = SEKMELER.find((s) => s.id === params.get("sekme"))?.id ?? "parfumler";

  return (
    <div>
      <h1 className="font-baslik text-4xl">Yönetim</h1>

      <nav aria-label="Yönetim bölümleri" className="mt-6 flex gap-6 border-b border-cizgi">
        {SEKMELER.map((s) => (
          <Link
            key={s.id}
            to={{ search: `?sekme=${s.id}` }}
            aria-current={sekme === s.id ? "page" : undefined}
            className={`-mb-px border-b-2 pb-2 text-sm ${
              sekme === s.id ? "border-murekkep font-medium" : "border-transparent text-buhar hover:text-murekkep"
            }`}
          >
            {s.etiket}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {sekme === "parfumler" && <ParfumYonetimi />}
        {sekme === "markalar" && <SozlukYonetimi uc="/api/markalar" tekil="marka" turlu />}
        {sekme === "notalar" && <SozlukYonetimi uc="/api/notalar" tekil="nota" />}
      </div>
    </div>
  );
}