import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../api/client";
import { ortalamaYaz } from "../puan";
import type { Degerlendirme, DegerlendirmeOzeti, Muadil } from "../types";
import { HataMesaji } from "./ui";

const YORUM_SINIRI = 1000;

export function Yildiz({ dolu, boyut = 18 }: { dolu: boolean; boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 2.2l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 15l-5.1 2.9L6 12.2l-4.3-4 5.8-.7z"
        fill={dolu ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Puanlar({ puan }: { puan: number }) {
  return (
    <span className="inline-flex gap-0.5 text-vurgu" role="img" aria-label={`5 üzerinden ${puan}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Yildiz key={n} dolu={n <= puan} boyut={14} />
      ))}
    </span>
  );
}

// 1-5 yıldız seçici. 0 = puan yok. İsteğe bağlı olanda "temizle" puanı geri alır.
function YildizSecici({
  etiket,
  grupAdi,
  deger,
  onDegis,
  zorunlu = false,
}: {
  etiket: string;
  grupAdi: string;
  deger: number;
  onDegis: (n: number) => void;
  zorunlu?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3">
      <span className="kucuk w-24 shrink-0 text-soluk">{etiket}</span>
      <div role="radiogroup" aria-label={grupAdi} className="flex items-center gap-1 text-vurgu">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={deger === n}
            aria-label={`${n} yıldız`}
            onClick={() => onDegis(n)}
            className="flex h-11 w-11 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-vurgu"
          >
            <Yildiz dolu={n <= deger} boyut={28} />
          </button>
        ))}
      </div>
      <span className="kucuk ml-2 text-soluk">{deger > 0 ? `${deger} / 5` : zorunlu ? "puan seç" : "isteğe bağlı"}</span>
      {!zorunlu && deger > 0 && (
        <button
          type="button"
          onClick={() => onDegis(0)}
          className="kucuk ml-2 min-h-11 cursor-pointer border-0 bg-transparent text-soluk underline"
        >
          temizle
        </button>
      )}
    </div>
  );
}

function tarihYaz(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

interface BolumProps {
  muadiller: Muadil[];
  seciliId: number;
  onSec: (id: number) => void;
  // Puan ya da yorum değişince üst sayfa muadil kartlarındaki ortalamayı tazeler
  onDegisti: () => void;
  adminMi: boolean;
}

// Parfüm detayındaki kullanıcı puanı ve yorumları: orijinal parfümün muadillerine verilir.
// Okumak herkese açık; yazmak için giriş gerekir.
// Editörün muadil puanlarından (benzerlik/kalıcılık, 1-10) ayrıdır: bunlar kullanıcıların verdiği 1-5 puandır.
export default function DegerlendirmeBolumu({ muadiller, seciliId, onSec, onDegisti, adminMi }: BolumProps) {
  const secili = muadiller.find((m) => m.id === seciliId) ?? muadiller[0];

  return (
    <section id="degerlendirmeler" aria-label="Değerlendirmeler" className="border-t-[1.5px] border-yazi px-(--kenar) pt-14 pb-16">
      <h2 className="genis m-0 mb-6 text-[clamp(24px,2.8vw,36px)] leading-[1.3] [word-spacing:.2em]">
        <span className="text-vurgu">muadil</span> değerlendirmeleri
      </h2>

      <div role="group" aria-label="Değerlendirilecek muadil" className="mb-8 flex flex-wrap gap-2">
        {muadiller.map((m) => {
          const secildi = m.id === secili.id;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={secildi}
              onClick={() => onSec(m.id)}
              className={`kucuk min-h-11 cursor-pointer rounded-full border-[1.5px] border-yazi px-5 ${
                secildi ? "bg-yazi text-zemin" : "cizgili bg-transparent text-yazi"
              }`}
            >
              {m.marka} {m.kod}
            </button>
          );
        })}
      </div>

      <MuadilDegerlendirmeleri key={secili.id} muadil={secili} adminMi={adminMi} onDegisti={onDegisti} />
    </section>
  );
}

// Seçili muadilin formu ve listesi. Muadil değişince `key` ile baştan kurulur; önceki muadilin
// yazılmış yorumu ya da geç gelen yanıtı yenisine karışmaz.
function MuadilDegerlendirmeleri({
  muadil,
  adminMi,
  onDegisti,
}: {
  muadil: Muadil;
  adminMi: boolean;
  onDegisti: () => void;
}) {
  const auth = useAuth();
  const location = useLocation();
  const token = auth.user?.access_token;
  const ad = `${muadil.marka} ${muadil.kod}`;

  const [ozet, setOzet] = useState<DegerlendirmeOzeti | null>(null);
  const [puan, setPuan] = useState(0);
  const [benzerlik, setBenzerlik] = useState(0);
  const [kalicilik, setKalicilik] = useState(0);
  const [yorum, setYorum] = useState("");
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState("");

  async function yukle() {
    const veri = await apiIstek<DegerlendirmeOzeti>(`/api/muadiller/${muadil.id}/degerlendirmeler`, token);
    setOzet(veri);
    setPuan(veri.benim?.puan ?? 0);
    setBenzerlik(veri.benim?.benzerlikPuani ?? 0);
    setKalicilik(veri.benim?.kalicilikPuani ?? 0);
    setYorum(veri.benim?.yorum ?? "");
  }

  // Token sessiz yenilemede değişir; yazılmakta olan yorum silinmesin diye kullanıcı kimliğine bağlanır.
  const kullaniciId = auth.user?.profile.sub;

  useEffect(() => {
    if (auth.isLoading) return;
    yukle().catch((e) => setHata(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kullaniciId, auth.isLoading]);

  async function kaydet(e: FormEvent) {
    e.preventDefault();
    if (puan < 1) {
      setHata("Önce 1 ile 5 arasında bir puan seç.");
      return;
    }
    setHata("");
    setMesgul(true);
    try {
      await apiIstek(`/api/muadiller/${muadil.id}/degerlendirme`, token, {
        method: "PUT",
        body: JSON.stringify({
          puan,
          benzerlikPuani: benzerlik || null,
          kalicilikPuani: kalicilik || null,
          yorum: yorum.trim() || null,
        }),
      });
      await yukle();
      onDegisti();
    } catch (err) {
      setHata((err as Error).message);
    } finally {
      setMesgul(false);
    }
  }

  async function kendiniSil() {
    if (!confirm("Değerlendirmen silinsin mi?")) return;
    setHata("");
    setMesgul(true);
    try {
      await apiIstek(`/api/muadiller/${muadil.id}/degerlendirme`, token, { method: "DELETE" });
      await yukle();
      onDegisti();
    } catch (err) {
      setHata((err as Error).message);
    } finally {
      setMesgul(false);
    }
  }

  async function yoneticiSil(d: Degerlendirme) {
    if (!confirm(`${d.kullaniciAdi} kullanıcısının değerlendirmesi silinsin mi?`)) return;
    setHata("");
    try {
      await apiIstek(`/api/degerlendirmeler/${d.id}`, token, { method: "DELETE" });
      await yukle();
      onDegisti();
    } catch (err) {
      setHata((err as Error).message);
    }
  }

  const benimVar = ozet?.benim != null;
  const degisti = ozet?.benim
    ? puan !== ozet.benim.puan ||
      benzerlik !== (ozet.benim.benzerlikPuani ?? 0) ||
      kalicilik !== (ozet.benim.kalicilikPuani ?? 0) ||
      yorum.trim() !== (ozet.benim.yorum ?? "")
    : true;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h3 className="genis m-0 text-[clamp(18px,2vw,24px)] leading-[1.3]">{ad}</h3>
        {ozet && ozet.sayi > 0 && ozet.ortalama !== null ? (
          <div className="flex flex-col gap-2 sm:items-end">
            <span className="flex items-center gap-3">
              <Puanlar puan={Math.round(ozet.ortalama)} />
              <span className="text-sm font-bold">{ortalamaYaz(ozet.ortalama)} / 5</span>
              <span className="kucuk text-soluk">{ozet.sayi} değerlendirme</span>
            </span>
            {(ozet.benzerlikOrtalamasi !== null || ozet.kalicilikOrtalamasi !== null) && (
              <span className="kucuk flex flex-wrap gap-x-4 text-soluk">
                {ozet.benzerlikOrtalamasi !== null && <span>benzerlik {ortalamaYaz(ozet.benzerlikOrtalamasi)} / 5</span>}
                {ozet.kalicilikOrtalamasi !== null && <span>kalıcılık {ortalamaYaz(ozet.kalicilikOrtalamasi)} / 5</span>}
              </span>
            )}
          </div>
        ) : (
          <span className="kucuk text-soluk">henüz değerlendirme yok</span>
        )}
      </div>

      {auth.isAuthenticated ? (
        <form onSubmit={kaydet} className="mb-10 flex max-w-[640px] flex-col gap-4">
          <YildizSecici etiket="genel" grupAdi={`${ad} için genel puanın`} deger={puan} onDegis={setPuan} zorunlu />
          <YildizSecici etiket="benzerlik" grupAdi={`${ad} için benzerlik puanın`} deger={benzerlik} onDegis={setBenzerlik} />
          <YildizSecici etiket="kalıcılık" grupAdi={`${ad} için kalıcılık puanın`} deger={kalicilik} onDegis={setKalicilik} />

          <label className="kucuk flex flex-col gap-2 text-soluk">
            Yorumun (isteğe bağlı)
            <textarea
              value={yorum}
              onChange={(e) => setYorum(e.target.value)}
              maxLength={YORUM_SINIRI}
              rows={4}
              placeholder="Orijinaline ne kadar yakın, hangi mevsimde sürdüğün..."
              className="w-full resize-y rounded-[22px] border-[1.5px] border-yazi bg-transparent px-5 py-4 text-sm font-normal tracking-normal text-yazi normal-case placeholder:text-soluk focus:outline-none"
            />
            <span className="self-end text-[10px]">
              {yorum.length} / {YORUM_SINIRI}
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={mesgul || !degisti}
              className="kucuk inline-flex min-h-12 cursor-pointer items-center rounded-full border-[1.5px] border-yazi bg-yazi px-7 text-zemin disabled:cursor-default disabled:opacity-50"
            >
              {benimVar ? "güncelle" : "gönder"}
            </button>
            {benimVar && (
              <button
                type="button"
                onClick={kendiniSil}
                disabled={mesgul}
                className="kucuk min-h-11 cursor-pointer border-0 bg-transparent text-soluk underline disabled:opacity-50"
              >
                değerlendirmemi sil
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="mb-10 flex flex-wrap items-center gap-4">
          <p className="m-0 text-sm">Bu muadile puan vermek ve yorum yazmak için giriş yapmalısın.</p>
          <button
            type="button"
            onClick={() => auth.signinRedirect({ state: { donus: location.pathname + location.search } })}
            className="cizgili kucuk inline-flex min-h-12 cursor-pointer items-center rounded-full border-[1.5px] border-yazi bg-transparent px-7 text-yazi"
          >
            giriş yap
          </button>
        </div>
      )}

      {ozet && ozet.degerlendirmeler.length > 0 && (
        <ul className="m-0 flex list-none flex-col p-0">
          {ozet.degerlendirmeler.map((d) => (
            <li key={d.id} className="flex flex-col gap-2 border-t-[1.5px] border-yazi py-5 last:border-b-[1.5px]">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-sm font-extrabold tracking-[0.06em]">
                  {d.kullaniciAdi}
                  {d.benimMi && <span className="kucuk ml-2 text-vurgu">sen</span>}
                </span>
                <Puanlar puan={d.puan} />
                {d.benzerlikPuani !== null && <span className="kucuk text-soluk">benzerlik {d.benzerlikPuani}/5</span>}
                {d.kalicilikPuani !== null && <span className="kucuk text-soluk">kalıcılık {d.kalicilikPuani}/5</span>}
                <span className="kucuk text-soluk">{tarihYaz(d.tarih)}</span>
                {adminMi && (
                  <button
                    type="button"
                    onClick={() => yoneticiSil(d)}
                    className="kucuk ml-auto min-h-11 cursor-pointer border-0 bg-transparent text-soluk underline"
                  >
                    sil
                  </button>
                )}
              </div>
              {d.yorum && <p className="m-0 max-w-[720px] text-sm leading-[1.7] whitespace-pre-line [overflow-wrap:anywhere]">{d.yorum}</p>}
            </li>
          ))}
        </ul>
      )}

      <HataMesaji mesaj={hata} />
    </div>
  );
}
