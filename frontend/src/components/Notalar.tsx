import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../api/client";
import type { Nota } from "../types";

export default function Notalar({ adminMi }: { adminMi: boolean }) {
  const auth = useAuth();
  const [notalar, setNotalar] = useState<Nota[]>([]);
  const [ad, setAd] = useState("");
  const [hata, setHata] = useState("");

  async function yukle() {
    setNotalar(await apiIstek<Nota[]>("/api/notalar"));
  }

  useEffect(() => {
    yukle().catch((e) => setHata(e.message));
  }, []);

  async function ekle(e: FormEvent) {
    e.preventDefault();
    setHata("");
    try {
      await apiIstek<Nota>("/api/notalar", auth.user?.access_token, {
        method: "POST",
        body: JSON.stringify({ ad }),
      });
      setAd("");
      await yukle();
    } catch (err) {
      setHata((err as Error).message);
    }
  }

  return (
    <section>
      <h2>Notalar ({notalar.length})</h2>
      <p>{notalar.map((n) => n.ad).join(", ")}</p>
      {adminMi && (
        <form onSubmit={ekle}>
          <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Nota adı" />
          <button type="submit">Ekle</button>
        </form>
      )}
      {hata && <p style={{ color: "red" }}>{hata}</p>}
    </section>
  );
}