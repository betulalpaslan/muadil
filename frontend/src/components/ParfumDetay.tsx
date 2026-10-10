import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../api/client";
import type { Marka, Muadil, NotaKatmani, ParfumDetayVeri } from "../types";

type Olcut = "benzerlik" | "fiyat" | "kalicilik";

const KATMAN_ETIKET: Record<NotaKatmani, string> = {
  Ust: "Üst notalar",
  Orta: "Orta notalar",
  Alt: "Alt notalar",
};

const tl = (n: number) => n.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });

// FR-03: sıralama ve eşitlik kuralları
function sirala(liste: Muadil[], olcut: Olcut): Muadil[] {
  return [...liste].sort((a, b) => {
    if (olcut === "fiyat") return a.fiyat - b.fiyat || b.benzerlikPuani - a.benzerlikPuani;
    if (olcut === "kalicilik") return b.kalicilikPuani - a.kalicilikPuani || b.benzerlikPuani - a.benzerlikPuani;
    return b.benzerlikPuani - a.benzerlikPuani || a.fiyat - b.fiyat;
  });
}

const BOS_FORM = { markaId: "0", kod: "", fiyat: "", urunLinki: "", kalicilikPuani: "5", benzerlikPuani: "5" };

export default function ParfumDetay({ adminMi }: { adminMi: boolean }) {
  const { id } = useParams();
  const auth = useAuth();
  const token = auth.user?.access_token;

  const [parfum, setParfum] = useState<ParfumDetayVeri | null>(null);
  const [olcut, setOlcut] = useState<Olcut>("benzerlik");
  const [hata, setHata] = useState("");
  const [muadilMarkalar, setMuadilMarkalar] = useState<Marka[]>([]);
  const [form, setForm] = useState(BOS_FORM);

  async function yukle() {
    setParfum(await apiIstek<ParfumDetayVeri>(`/api/parfumler/${id}`));
  }

  useEffect(() => {
    yukle().catch((e) => setHata(e.message));
  }, [id]);

  useEffect(() => {
    if (!adminMi) return;
    apiIstek<Marka[]>("/api/markalar?tur=Muadil")
      .then(setMuadilMarkalar)
      .catch((e) => setHata(e.message));
  }, [adminMi]);

  // Tek state nesnesindeki bir alanı input'a bağlar
  function alan(ad: keyof typeof BOS_FORM) {
    return {
      value: form[ad],
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [ad]: e.target.value })),
    };
  }

  async function muadilEkle(e: FormEvent) {
    e.preventDefault();
    setHata("");
    try {
      await apiIstek(`/api/parfumler/${id}/muadiller`, token, {
        method: "POST",
        body: JSON.stringify({
          markaId: Number(form.markaId),
          kod: form.kod,
          fiyat: Number(form.fiyat),
          urunLinki: form.urunLinki,
          kalicilikPuani: Number(form.kalicilikPuani),
          benzerlikPuani: Number(form.benzerlikPuani),
        }),
      });
      setForm({ ...BOS_FORM, markaId: form.markaId });
      await yukle();
    } catch (err) {
      setHata((err as Error).message);
    }
  }

  async function muadilSil(m: Muadil) {
    if (!confirm(`${m.marka} ${m.kod} silinsin mi?`)) return;
    try {
      await apiIstek(`/api/muadiller/${m.id}`, token, { method: "DELETE" });
      await yukle();
    } catch (err) {
      setHata((err as Error).message);
    }
  }

  if (!parfum) return <p>{hata ? `Parfüm yüklenemedi (${hata})` : "Yükleniyor..."}</p>;

  const katmanlar: NotaKatmani[] = ["Ust", "Orta", "Alt"];

  return (
    <section>
      <Link to="/">← Aramaya dön</Link>
      <h2>{parfum.ad}</h2>
      <p>{parfum.marka} · {tl(parfum.fiyat50ml)} (50 ml)</p>

      {katmanlar.map((k) => {
        const notalar = parfum.notalar.filter((n) => n.katman === k);
        return notalar.length > 0 && (
          <p key={k}>
            <strong>{KATMAN_ETIKET[k]}:</strong> {notalar.map((n) => n.notaAd).join(", ")}
          </p>
        );
      })}

      <h3>Muadiller ({parfum.muadiller.length})</h3>
      {parfum.muadiller.length === 0 ? (
        <p>Henüz muadil eklenmedi.</p>
      ) : (
        <>
          <label>
            Sırala:{" "}
            <select value={olcut} onChange={(e) => setOlcut(e.target.value as Olcut)}>
              <option value="benzerlik">En benzer</option>
              <option value="fiyat">En ucuz</option>
              <option value="kalicilik">En kalıcı</option>
            </select>
          </label>
          <table>
            <thead>
              <tr>
                <th>Marka</th><th>Kod</th><th>Fiyat</th><th>Kalıcılık</th><th>Benzerlik</th><th></th>
              </tr>
            </thead>
            <tbody>
              {sirala(parfum.muadiller, olcut).map((m) => (
                <tr key={m.id}>
                  <td>{m.marka}</td>
                  <td>{m.kod}</td>
                  <td>{tl(m.fiyat)}</td>
                  <td>{m.kalicilikPuani}/10</td>
                  <td>{m.benzerlikPuani}/10</td>
                  <td>
                    <a href={m.urunLinki} target="_blank" rel="noopener noreferrer">Ürüne git</a>
                    {adminMi && <button onClick={() => muadilSil(m)}>Sil</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {adminMi && (
        <form onSubmit={muadilEkle}>
          <h3>Muadil ekle</h3>
          <select {...alan("markaId")}>
            <option value="0">Muadil markası seç</option>
            {muadilMarkalar.map((m) => (
              <option key={m.id} value={m.id}>{m.ad}</option>
            ))}
          </select>
          <input {...alan("kod")} placeholder="Kod (ör. 122)" />
          <input {...alan("fiyat")} type="number" step="0.01" placeholder="Fiyat" />
          <input {...alan("urunLinki")} type="url" placeholder="https://..." />
          <label> Kalıcılık <input {...alan("kalicilikPuani")} type="number" min={1} max={10} /></label>
          <label> Benzerlik <input {...alan("benzerlikPuani")} type="number" min={1} max={10} /></label>
          <button type="submit">Ekle</button>
        </form>
      )}

      {hata && <p style={{ color: "red" }}>{hata}</p>}
    </section>
  );
}