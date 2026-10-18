import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../api/client";
import { gorselAdresi } from "../gorsel";
import { tl } from "../para";
import { pastel } from "../tasarim/renk";
import type { ParfumListe } from "../types";
import { Footer } from "./OrtakYerlesim";
import ParfumSisesi from "./tasarim/ParfumSisesi";
import { HataMesaji } from "./ui";

// Menüdeki FAVORİLERİM (/favorilerim): giriş yapmış kullanıcının favori parfümleri, en son eklenen başta.
export default function FavorilerSayfasi() {
  const auth = useAuth();
  const token = auth.user?.access_token;
  const [parfumler, setParfumler] = useState<ParfumListe[] | null>(null);
  const [hata, setHata] = useState("");

  const kullaniciId = auth.user?.profile.sub;

  useEffect(() => {
    if (!token) return;
    apiIstek<ParfumListe[]>("/api/favoriler", token)
      .then(setParfumler)
      .catch((e) => setHata(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kullaniciId]);

  async function cikar(p: ParfumListe) {
    setHata("");
    try {
      await apiIstek(`/api/favoriler/${p.id}`, token, { method: "DELETE" });
      setParfumler((liste) => liste?.filter((x) => x.id !== p.id) ?? null);
    } catch (err) {
      setHata((err as Error).message);
    }
  }

  return (
    <>
      <section aria-label="Favorilerim" className="px-(--kenar) pt-10 pb-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h1 className="genis m-0 text-[clamp(30px,3.6vw,48px)] leading-[1.3] [word-spacing:.2em]">
            <span className="text-vurgu">favori</span> parfümlerim
          </h1>
          {parfumler && <span className="kucuk text-soluk">{parfumler.length} parfüm</span>}
        </div>

        {!auth.isLoading && !auth.isAuthenticated && (
          <div className="flex flex-wrap items-center gap-4">
            <p className="m-0 text-sm">Favorilerini görmek için giriş yapmalısın.</p>
            <button
              type="button"
              onClick={() => auth.signinRedirect({ state: { donus: "/favorilerim" } })}
              className="cizgili kucuk inline-flex min-h-12 cursor-pointer items-center rounded-full border-[1.5px] border-yazi bg-transparent px-7 text-yazi"
            >
              giriş yap
            </button>
          </div>
        )}

        {auth.isAuthenticated && parfumler === null && !hata && <p className="text-sm text-soluk">Yükleniyor...</p>}
        {parfumler?.length === 0 && (
          <p className="text-sm">
            Henüz favori parfümün yok. <Link to="/parfumler">Parfümlere göz at</Link> ve beğendiklerini ekle.
          </p>
        )}

        {parfumler && parfumler.length > 0 && (
          <ul className="m-0 flex list-none flex-col p-0">
            {parfumler.map((p) => {
              const gorsel = gorselAdresi(p.gorselUrl);
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 border-t-[1.5px] border-yazi last:border-b-[1.5px]">
                  <Link
                    to={`/parfum/${p.id}`}
                    className="flex min-w-0 flex-[1_1_320px] items-center gap-5 py-5 text-yazi no-underline"
                  >
                    <div className="flex h-16 w-[52px] shrink-0 items-center justify-center overflow-hidden" style={{ background: pastel(p.renk, 0.8) }}>
                      {gorsel ? (
                        <img src={gorsel} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain mix-blend-multiply" />
                      ) : (
                        <ParfumSisesi genislik={32} govde="#0B0B0B" parlak="#F2EEE8" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="kucuk text-soluk">{p.marka}</div>
                      <div className="genis text-xl font-extrabold">{p.ad}</div>
                      <div className="kucuk mt-1.5 text-[9px] text-soluk">
                        {p.muadilSayisi} muadil{p.enUygunMuadil != null && ` · en uygun ${tl(p.enUygunMuadil)}`}
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => cikar(p)}
                    aria-label={`${p.marka} ${p.ad} favorilerden çıkar`}
                    className="kucuk min-h-11 shrink-0 cursor-pointer border-0 bg-transparent px-1 text-soluk underline"
                  >
                    favoriden çıkar
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <HataMesaji mesaj={hata} />
      </section>
      <Footer />
    </>
  );
}
