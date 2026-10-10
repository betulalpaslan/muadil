import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../api/client";
import type { Marka, Nota, NotaKatmani, ParfumListe } from "../types";
import { Link } from "react-router-dom";

const KATMANLAR: { deger: NotaKatmani; etiket: string }[] = [
  { deger: "Ust", etiket: "Üst" },
  { deger: "Orta", etiket: "Orta" },
  { deger: "Alt", etiket: "Alt" },
];

type SeciliNota = { notaId: number; katman: NotaKatmani };

export default function Parfumler({ adminMi }: { adminMi: boolean }) {
  const auth = useAuth();
  const token = auth.user?.access_token;

  const [parfumler, setParfumler] = useState<ParfumListe[]>([]);
  const [ara, setAra] = useState("");
  const [hata, setHata] = useState("");

  // Admin formu
  const [markalar, setMarkalar] = useState<Marka[]>([]);
  const [notalar, setNotalar] = useState<Nota[]>([]);
  const [ad, setAd] = useState("");
  const [markaId, setMarkaId] = useState(0);
  const [fiyat, setFiyat] = useState("");
  const [secili, setSecili] = useState<SeciliNota[]>([]);

  async function yukle(arama: string) {
    const sorgu = arama ? `?ara=${encodeURIComponent(arama)}` : "";
    setParfumler(await apiIstek<ParfumListe[]>(`/api/parfumler${sorgu}`));
  }

  // Arama: yazmayı bıraktıktan 300 ms sonra ara (FR-01.4: en az 2 karakter)
  useEffect(() => {
    if (ara.length === 1) return;
    const zamanlayici = setTimeout(() => {
      yukle(ara).catch((e) => setHata(e.message));
    }, 300);
    return () => clearTimeout(zamanlayici);
  }, [ara]);

  // Form için orijinal markaları ve notaları paralel yükle
  useEffect(() => {
    if (!adminMi) return;
    Promise.all([
      apiIstek<Marka[]>("/api/markalar?tur=Orijinal"),
      apiIstek<Nota[]>("/api/notalar"),
    ])
      .then(([m, n]) => {
        setMarkalar(m);
        setNotalar(n);
      })
      .catch((e) => setHata(e.message));
  }, [adminMi]);

  const notaAdi = (id: number) => notalar.find((n) => n.id === id)?.ad ?? "?";
  const secilebilirNotalar = notalar.filter((n) => !secili.some((s) => s.notaId === n.id));

  function notaEkle(notaId: number, katman: NotaKatmani) {
    if (!notaId) return;
    setSecili((onceki) => [...onceki, { notaId, katman }]);
  }

  function notaCikar(notaId: number) {
    setSecili((onceki) => onceki.filter((s) => s.notaId !== notaId));
  }

  async function kaydet(e: FormEvent) {
    e.preventDefault();
    setHata("");
    try {
      await apiIstek("/api/parfumler", token, {
        method: "POST",
        body: JSON.stringify({ ad, markaId, fiyat50ml: Number(fiyat), notalar: secili }),
      });
      setAd("");
      setFiyat("");
      setSecili([]);
      await yukle(ara);
    } catch (err) {
      setHata((err as Error).message);
    }
  }

  async function sil(p: ParfumListe) {
    if (!confirm(`${p.ad} silinsin mi?`)) return;
    try {
      await apiIstek(`/api/parfumler/${p.id}`, token, { method: "DELETE" });
      await yukle(ara);
    } catch (err) {
      setHata((err as Error).message);
    }
  }

  return (
    <section>
      <h2>Parfümler</h2>

      <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Parfüm veya marka ara..." />

      <table>
        <tbody>
          {parfumler.map((p) => (
            <tr key={p.id}>
              <td><Link to={`/parfum/${p.id}`}>{p.ad}</Link></td>
              <td>{p.marka}</td>
              <td>{p.fiyat50ml.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td>
              {adminMi && (
                <td>
                  <button onClick={() => sil(p)}>Sil</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {parfumler.length === 0 && <p>Parfüm bulunamadı.</p>}

      {adminMi && (
        <form onSubmit={kaydet}>
          <h3>Yeni parfüm</h3>
          <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Parfüm adı" />
          <select value={markaId} onChange={(e) => setMarkaId(Number(e.target.value))}>
            <option value={0}>Marka seç</option>
            {markalar.map((m) => (
              <option key={m.id} value={m.id}>{m.ad}</option>
            ))}
          </select>
          <input type="number" step="0.01" value={fiyat} onChange={(e) => setFiyat(e.target.value)} placeholder="50 ml fiyat" />

          {KATMANLAR.map((k) => (
            <div key={k.deger}>
              <strong>{k.etiket}: </strong>
              {secili
                .filter((s) => s.katman === k.deger)
                .map((s) => (
                  <button type="button" key={s.notaId} onClick={() => notaCikar(s.notaId)}>
                    {notaAdi(s.notaId)} ✕
                  </button>
                ))}
              <select value="" onChange={(e) => notaEkle(Number(e.target.value), k.deger)}>
                <option value="">+ nota ekle</option>
                {secilebilirNotalar.map((n) => (
                  <option key={n.id} value={n.id}>{n.ad}</option>
                ))}
              </select>
            </div>
          ))}

          <button type="submit">Kaydet</button>
        </form>
      )}

      {hata && <p style={{ color: "red" }}>{hata}</p>}
    </section>
  );
}