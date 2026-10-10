import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../../api/client";
import type { Marka, Nota, NotaKatmani, ParfumDetayVeri } from "../../types";
import { ALAN, BUTON, BUTON_SADE, HataMesaji } from "../ui";

const KATMANLAR = [
  { deger: "Ust", etiket: "Üst notalar", renk: "bg-ust" },
  { deger: "Orta", etiket: "Orta notalar", renk: "bg-orta" },
  { deger: "Alt", etiket: "Alt notalar", renk: "bg-alt text-cam" },
] as const;

type SeciliNota = { notaId: number; katman: NotaKatmani };

type Props = {
  parfumId?: number; // varsa düzenleme, yoksa ekleme
  onBitti: () => void; // kaydedilince ya da vazgeçilince
};

export default function ParfumFormu({ parfumId, onBitti }: Props) {
  const token = useAuth().user?.access_token;
  const [markalar, setMarkalar] = useState<Marka[]>([]);
  const [notalar, setNotalar] = useState<Nota[]>([]);
  const [ad, setAd] = useState("");
  const [markaId, setMarkaId] = useState(0);
  const [secili, setSecili] = useState<SeciliNota[]>([]);
  const [hata, setHata] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  useEffect(() => {
    Promise.all([
      apiIstek<Marka[]>("/api/markalar?tur=Orijinal"),
      apiIstek<Nota[]>("/api/notalar"),
      parfumId ? apiIstek<ParfumDetayVeri>(`/api/parfumler/${parfumId}`) : Promise.resolve(null),
    ])
      .then(([m, n, p]) => {
        setMarkalar(m);
        setNotalar(n);
        if (p) {
          setAd(p.ad);
          setMarkaId(p.markaId);
          setSecili(p.notalar.map((x) => ({ notaId: x.notaId, katman: x.katman })));
        }
      })
      .catch((e) => setHata(e.message));
  }, [parfumId]);

  const notaAdi = (id: number) => notalar.find((n) => n.id === id)?.ad ?? "?";
  const secilebilir = notalar.filter((n) => !secili.some((s) => s.notaId === n.id));

  async function kaydet(e: FormEvent) {
    e.preventDefault();
    setHata("");
    setGonderiliyor(true);
    try {
      await apiIstek(parfumId ? `/api/parfumler/${parfumId}` : "/api/parfumler", token, {
        method: parfumId ? "PUT" : "POST",
        body: JSON.stringify({ ad, markaId, notalar: secili }),
      });
      onBitti();
    } catch (err) {
      setHata((err as Error).message);
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <form onSubmit={kaydet} className="space-y-5 rounded-lg border border-cizgi bg-white p-5">
      <h2 className="font-baslik text-2xl">{parfumId ? "Parfümü düzenle" : "Yeni parfüm"}</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Parfüm adı
          <input value={ad} onChange={(e) => setAd(e.target.value)} required className={`${ALAN} mt-1`} />
        </label>
        <label className="text-sm">
          Marka
          <select value={markaId} onChange={(e) => setMarkaId(Number(e.target.value))} className={`${ALAN} mt-1`}>
            <option value={0}>Seç</option>
            {markalar.map((m) => (
              <option key={m.id} value={m.id}>
                {m.ad}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm">Notalar</legend>
        {KATMANLAR.map((k) => (
          <div key={k.deger} className="flex flex-wrap items-center gap-2">
            <span className="w-28 text-sm text-buhar">{k.etiket}</span>
            {secili
              .filter((s) => s.katman === k.deger)
              .map((s) => (
                <button
                  type="button"
                  key={s.notaId}
                  onClick={() => setSecili((o) => o.filter((x) => x.notaId !== s.notaId))}
                  aria-label={`${notaAdi(s.notaId)} notasını çıkar`}
                  className={`${k.renk} rounded-full px-3 py-1 text-sm`}
                >
                  {notaAdi(s.notaId)} ×
                </button>
              ))}
            <select
              value=""
              onChange={(e) => {
                const notaId = Number(e.target.value);
                if (notaId) setSecili((o) => [...o, { notaId, katman: k.deger }]);
              }}
              aria-label={`${k.etiket} için nota ekle`}
              className="rounded-full border border-dashed border-buhar bg-transparent px-3 py-1 text-sm"
            >
              <option value="">+ ekle</option>
              {secilebilir.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.ad}
                </option>
              ))}
            </select>
          </div>
        ))}
      </fieldset>

      <HataMesaji mesaj={hata} />

      <div className="flex items-center gap-4">
        <button type="submit" disabled={gonderiliyor} className={BUTON}>
          {gonderiliyor ? "Kaydediliyor..." : parfumId ? "Değişiklikleri kaydet" : "Parfümü ekle"}
        </button>
        <button type="button" onClick={onBitti} className={BUTON_SADE}>
          Vazgeç
        </button>
      </div>
    </form>
  );
}
