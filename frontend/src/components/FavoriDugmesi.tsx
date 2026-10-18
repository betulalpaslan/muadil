import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../api/client";
import type { ParfumListe } from "../types";

function Kalp({ dolu }: { dolu: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 17.5S2.5 12.6 2.5 7.4A3.9 3.9 0 0 1 10 5.6a3.9 3.9 0 0 1 7.5 1.8c0 5.2-7.5 10.1-7.5 10.1z"
        fill={dolu ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Parfümü favorilere ekler/çıkarır. Giriş yapılmamışsa tıklayınca girişe yönlendirir ve aynı sayfaya döner.
export default function FavoriDugmesi({ parfumId }: { parfumId: number }) {
  const auth = useAuth();
  const location = useLocation();
  const token = auth.user?.access_token;
  const [favori, setFavori] = useState(false);
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState("");

  // Token sessiz yenilemede değişir; gereksiz yeniden yükleme olmasın diye kullanıcı kimliğine bağlanır.
  const kullaniciId = auth.user?.profile.sub;

  useEffect(() => {
    setFavori(false);
    if (!token) return;
    let iptal = false;
    apiIstek<ParfumListe[]>("/api/favoriler", token)
      .then((liste) => {
        if (!iptal) setFavori(liste.some((p) => p.id === parfumId));
      })
      .catch(() => {});
    return () => {
      iptal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kullaniciId, parfumId]);

  async function degistir() {
    if (!token) {
      auth.signinRedirect({ state: { donus: location.pathname + location.search } });
      return;
    }
    const yeni = !favori;
    setHata("");
    setMesgul(true);
    setFavori(yeni);
    try {
      await apiIstek(`/api/favoriler/${parfumId}`, token, { method: yeni ? "PUT" : "DELETE" });
    } catch (err) {
      setFavori(!yeni);
      setHata((err as Error).message);
    } finally {
      setMesgul(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={degistir}
        disabled={mesgul}
        aria-pressed={favori}
        className={`${favori ? "bg-yazi text-zemin" : "cizgili bg-transparent text-yazi"} kucuk inline-flex min-h-12 cursor-pointer items-center gap-3 rounded-full border-[1.5px] border-yazi px-7 disabled:opacity-60`}
      >
        <Kalp dolu={favori} />
        {favori ? "favorilerinde" : "favorilere ekle"}
      </button>
      {hata && (
        <p role="alert" className="m-0 text-sm text-red-700">
          {hata}
        </p>
      )}
    </div>
  );
}
