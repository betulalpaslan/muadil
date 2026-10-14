import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../../api/client";
import { gorselAdresi } from "../../gorsel";
import { VARSAYILAN_RENK } from "../../tasarim/renk";
import type { Cinsiyet, Marka, Nota, NotaKatmani, ParfumDetayVeri } from "../../types";
import { ALAN, BUTON, BUTON_SADE, HataMesaji } from "../ui";

const KATMANLAR = [
  { deger: "Ust", etiket: "Üst notalar", renk: "bg-ust" },
  { deger: "Orta", etiket: "Orta notalar", renk: "bg-orta" },
  { deger: "Alt", etiket: "Alt notalar", renk: "bg-alt text-cam" },
] as const;

const CINSIYETLER: { deger: Cinsiyet; etiket: string }[] = [
  { deger: "Unisex", etiket: "Unisex" },
  { deger: "Kadin", etiket: "Kadın" },
  { deger: "Erkek", etiket: "Erkek" },
];

type SeciliNota = { notaId: number; katman: NotaKatmani };

const HEX_DESENI = /^#[0-9A-Fa-f]{6}$/;

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
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet>("Unisex");
  const [renk, setRenk] = useState("");
  const [secili, setSecili] = useState<SeciliNota[]>([]);
  const [hata, setHata] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [yeniId, setYeniId] = useState<number | null>(null);
  const [gorselUrl, setGorselUrl] = useState<string | null>(null);
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false);

  const duzenlemeId = parfumId ?? yeniId;

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
          setCinsiyet(p.cinsiyet);
          setRenk(p.renk ?? "");
          setSecili(p.notalar.map((x) => ({ notaId: x.notaId, katman: x.katman })));
          setGorselUrl(p.gorselUrl);
        }
      })
      .catch((e) => setHata(e.message));
  }, [parfumId]);

  async function gorselYukle(e: ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    if (!dosya || !duzenlemeId) return;
    setHata("");
    setGorselYukleniyor(true);
    try {
      const veri = new FormData();
      veri.append("dosya", dosya);
      const sonuc = await apiIstek<{ gorselUrl: string; renk: string | null }>(
        `/api/parfumler/${duzenlemeId}/gorsel`,
        token,
        { method: "POST", body: veri }
      );
      setGorselUrl(sonuc.gorselUrl);
      if (sonuc.renk) setRenk(sonuc.renk);
    } catch (err) {
      setHata((err as Error).message);
    } finally {
      setGorselYukleniyor(false);
      e.target.value = "";
    }
  }

  const notaAdi = (id: number) => notalar.find((n) => n.id === id)?.ad ?? "?";
  const secilebilir = notalar.filter((n) => !secili.some((s) => s.notaId === n.id));

  async function kaydet(e: FormEvent) {
    e.preventDefault();
    setHata("");
    setGonderiliyor(true);
    try {
      if (parfumId) {
        await apiIstek(`/api/parfumler/${parfumId}`, token, {
          method: "PUT",
          body: JSON.stringify({ ad, markaId, cinsiyet, notalar: secili, renk: HEX_DESENI.test(renk) ? renk : null }),
        });
        onBitti();
      } else {
        const sonuc = await apiIstek<ParfumDetayVeri>("/api/parfumler", token, {
          method: "POST",
          body: JSON.stringify({ ad, markaId, cinsiyet, notalar: secili, renk: HEX_DESENI.test(renk) ? renk : null }),
        });
        setYeniId(sonuc.id);
      }
    } catch (err) {
      setHata((err as Error).message);
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <form onSubmit={kaydet} className="space-y-5 rounded-lg border border-cizgi bg-white p-5">
      <h2 className="font-baslik text-2xl">{parfumId ? "Parfümü düzenle" : "Yeni parfüm"}</h2>

      <fieldset disabled={!!yeniId} className="grid gap-3 sm:grid-cols-2">
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
        <label className="text-sm">
          Cinsiyet
          <select value={cinsiyet} onChange={(e) => setCinsiyet(e.target.value as Cinsiyet)} className={`${ALAN} mt-1`}>
            {CINSIYETLER.map((c) => (
              <option key={c.deger} value={c.deger}>
                {c.etiket}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Renk (isteğe bağlı)
          <span className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={HEX_DESENI.test(renk) ? renk : VARSAYILAN_RENK}
              onChange={(e) => setRenk(e.target.value)}
              aria-label="Parfüm rengi"
              className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-cizgi bg-white p-1"
            />
            <input
              value={renk}
              onChange={(e) => setRenk(e.target.value)}
              placeholder={VARSAYILAN_RENK}
              maxLength={7}
              className={ALAN}
            />
          </span>
          {renk && !HEX_DESENI.test(renk) && <span className="mt-1 block text-xs text-red-700">#RRGGBB biçiminde olmalı.</span>}
        </label>
      </fieldset>

      <fieldset disabled={!!yeniId} className="space-y-3">
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

      <label className="block text-sm">
        Görsel
        {duzenlemeId ? (
          <span className="mt-1 flex items-center gap-3">
            {gorselUrl && (
              <img src={gorselAdresi(gorselUrl) ?? undefined} alt="" className="h-14 w-14 rounded-md border border-cizgi object-cover" />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={gorselYukle}
              disabled={gorselYukleniyor}
              className="block text-sm"
            />
          </span>
        ) : (
          <span className="mt-1 block text-xs text-buhar">Önce parfümü kaydet, sonra görsel ekleyebilirsin.</span>
        )}
      </label>

      <HataMesaji mesaj={hata} />

      <div className="flex items-center gap-4">
        {yeniId ? (
          <>
            <span className="text-sm text-green-700">Parfüm kaydedildi.</span>
            <button type="button" onClick={onBitti} className={BUTON}>
              Bitti
            </button>
          </>
        ) : (
          <>
            <button type="submit" disabled={gonderiliyor} className={BUTON}>
              {gonderiliyor ? "Kaydediliyor..." : parfumId ? "Değişiklikleri kaydet" : "Parfümü ekle"}
            </button>
            <button type="button" onClick={onBitti} className={BUTON_SADE}>
              Vazgeç
            </button>
          </>
        )}
      </div>
    </form>
  );
}
