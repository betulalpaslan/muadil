import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../../api/client";
import type { ParfumListe } from "../../types";
import { BUTON, BUTON_SADE, HataMesaji } from "../ui";
import ParfumFormu from "./ParfumFormu";

type FormDurumu = { acik: false } | { acik: true; id?: number };

export default function ParfumYonetimi() {
  const token = useAuth().user?.access_token;
  const [parfumler, setParfumler] = useState<ParfumListe[]>([]);
  const [form, setForm] = useState<FormDurumu>({ acik: false });
  const [hata, setHata] = useState("");

  async function yukle() {
    setParfumler(await apiIstek<ParfumListe[]>("/api/parfumler"));
  }

  useEffect(() => {
    yukle().catch((e) => setHata(e.message));
  }, []);

  function duzenle(id: number) {
    setForm({ acik: true, id });
    window.scrollTo({ top: 0 });
  }

  function formBitti() {
    setForm({ acik: false });
    yukle().catch((e) => setHata(e.message));
  }

  async function sil(p: ParfumListe) {
    if (!confirm(`${p.ad} silinsin mi? Muadilleri de listeden kalkar.`)) return;
    setHata("");
    try {
      await apiIstek(`/api/parfumler/${p.id}`, token, { method: "DELETE" });
      await yukle();
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  return (
    <section>
      {form.acik ? (
        <ParfumFormu key={form.id ?? "yeni"} parfumId={form.id} onBitti={formBitti} />
      ) : (
        <button onClick={() => setForm({ acik: true })} className={BUTON}>Yeni parfüm</button>
      )}

      <HataMesaji mesaj={hata} />

      <ul className="mt-6 divide-y divide-cizgi">
        {parfumler.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <span>
              <Link to={`/parfum/${p.id}`} className="font-medium hover:underline">{p.ad}</Link>
              <span className="ml-2 text-sm text-buhar">{p.marka}</span>
            </span>
            <span className="flex gap-4">
              <button onClick={() => duzenle(p.id)} className={BUTON_SADE}>Düzenle</button>
              <button onClick={() => sil(p)} className={BUTON_SADE}>Sil</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}