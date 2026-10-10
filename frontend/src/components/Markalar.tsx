import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../api/client";
import type { Marka, MarkaTuru } from "../types";

export default function Markalar({ adminMi }: { adminMi: boolean }) {
  const auth = useAuth();
  const [markalar, setMarkalar] = useState<Marka[]>([]);
  const [ad, setAd] = useState("");
  const [tur, setTur] = useState<MarkaTuru>("Orijinal");
  const [hata, setHata] = useState("");

  async function yukle() {
    setMarkalar(await apiIstek<Marka[]>("/api/markalar"));
  }

  useEffect(() => {
    yukle().catch((e) => setHata(e.message));
  }, []);

  async function ekle(e: FormEvent) {
    e.preventDefault();
    setHata("");
    try {
      await apiIstek<Marka>("/api/markalar", auth.user?.access_token, {
        method: "POST",
        body: JSON.stringify({ ad, tur }),
      });
      setAd("");
      await yukle();
    } catch (err) {
      setHata((err as Error).message);
    }
  }

  return (
    <section>
      <h2>Markalar</h2>
      <ul>
        {markalar.map((m) => (
          <li key={m.id}>
            {m.ad} ({m.tur})
          </li>
        ))}
      </ul>

      {adminMi && (
        <form onSubmit={ekle}>
          <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Marka adı" />
          <select value={tur} onChange={(e) => setTur(e.target.value as MarkaTuru)}>
            <option value="Orijinal">Orijinal</option>
            <option value="Muadil">Muadil</option>
          </select>
          <button type="submit">Ekle</button>
        </form>
      )}

      {hata && <p style={{ color: "red" }}>{hata}</p>}
    </section>
  );
}