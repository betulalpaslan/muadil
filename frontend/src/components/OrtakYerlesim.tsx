import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { apiIstek } from "../api/client";
import type { ParfumListe } from "../types";
import Logo from "./tasarim/Logo";
import TemaDugmesi from "./tasarim/TemaDugmesi";

// Herkese açık sayfalarda paylaşılan header (3 satır: logo/tema, menü, arama) ve footer.
// TASARIM.md §4.

function useKatalogSayilari() {
  const [sayilar, setSayilar] = useState({ orijinal: 0, muadil: 0 });
  useEffect(() => {
    apiIstek<ParfumListe[]>("/api/parfumler")
      .then((liste) => setSayilar({ orijinal: liste.length, muadil: liste.reduce((t, p) => t + p.muadilSayisi, 0) }))
      .catch(() => {});
  }, []);
  return sayilar;
}

function AramaKutusu() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const anaSayfadaMi = location.pathname === "/";
  const [deger, setDeger] = useState(() => (anaSayfadaMi ? (searchParams.get("ara") ?? "") : ""));

  // Ana sayfadayken arama kutusu URL'deki ?ara= ile iki yönlü senkron kalır.
  useEffect(() => {
    if (anaSayfadaMi) setDeger(searchParams.get("ara") ?? "");
  }, [anaSayfadaMi, searchParams]);

  // 300 ms bekler, tek harfte aramaz; yalnız ana sayfadayken yazarken URL'i günceller.
  useEffect(() => {
    if (!anaSayfadaMi) return;
    if (deger.length === 1) return;
    if (deger === (searchParams.get("ara") ?? "")) return;
    const zamanlayici = setTimeout(
      () => navigate(deger ? `/?ara=${encodeURIComponent(deger)}` : "/?ara=", { replace: true }),
      deger ? 300 : 0
    );
    return () => clearTimeout(zamanlayici);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deger, anaSayfadaMi]);

  function gonder(e: FormEvent) {
    e.preventDefault();
    if (!anaSayfadaMi) navigate(`/?ara=${encodeURIComponent(deger)}`);
  }

  return (
    <form role="search" onSubmit={gonder} className="m-0 flex items-center gap-2.5 border-b-[1.5px] border-yazi px-[clamp(16px,5vw,70px)] py-[18px]">
      <label htmlFor="ust-ara" className="sr-only">
        Parfüm, marka ya da muadil kodu ara
      </label>
      <div className="relative min-w-0 flex-1">
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-6 -translate-y-1/2">
          <circle cx="8.5" cy="8.5" r="6" fill="none" strokeWidth={2} style={{ stroke: "var(--be)" }} />
          <path d="M13 13l5 5" strokeWidth={2.2} style={{ stroke: "var(--be)" }} />
        </svg>
        <input
          id="ust-ara"
          type="search"
          value={deger}
          onChange={(e) => setDeger(e.target.value)}
          placeholder="PARFÜM, MARKA YA DA KOD"
          className="h-[58px] w-full min-w-0 rounded-full border-[1.5px] border-yazi bg-transparent py-0 pr-5 pl-[54px] text-[11px] font-semibold tracking-[0.18em] text-yazi"
        />
      </div>
      <button type="submit" className="kucuk h-[58px] rounded-full bg-yazi px-[clamp(18px,3vw,30px)] font-extrabold text-zemin">
        ara
      </button>
    </form>
  );
}

const MENU_HAP = "kucuk inline-flex min-h-[34px] items-center rounded-full bg-yazi px-4 font-extrabold text-zemin no-underline";
const MENU_LINK = "kucuk inline-flex min-h-11 items-center text-yazi no-underline";
const MENU_PASIF = "kucuk inline-flex min-h-11 items-center text-yazi opacity-50 max-[760px]:hidden";

export function Header({ adminMi }: { adminMi: boolean }) {
  const { orijinal, muadil } = useKatalogSayilari();
  const auth = useAuth();
  const location = useLocation();
  const parfumlerAktif = location.pathname === "/parfumler";
  const notalarAktif = location.pathname === "/notalar";
  const anaSayfaAktif = location.pathname === "/" || location.pathname.startsWith("/parfum/");
  const yonetimAktif = location.pathname.startsWith("/admin");

  return (
    <header className="bg-zemin text-yazi">
      <div className="flex items-baseline justify-between gap-3 px-[clamp(16px,5vw,70px)] pt-[22px] pb-3.5">
        <Link to="/" aria-label="muadil ana sayfa" className="no-underline text-yazi">
          <Logo boyut="26px" />
        </Link>
        <div className="flex items-center gap-[18px]">
          <span className="kucuk max-[760px]:hidden text-soluk">
            {orijinal} orijinal · {muadil} muadil · 50 ml
          </span>
          <TemaDugmesi />
        </div>
      </div>

      <nav aria-label="Ana menü" className="flex min-h-16 items-center justify-between gap-2.5 border-y-[1.5px] border-yazi px-[clamp(16px,5vw,70px)]">
        <Link to="/" aria-current={anaSayfaAktif ? "page" : undefined} className={anaSayfaAktif ? MENU_HAP : MENU_LINK}>
          ana sayfa
        </Link>
        <Link to="/parfumler" aria-current={parfumlerAktif ? "page" : undefined} className={parfumlerAktif ? MENU_HAP : MENU_LINK}>
          parfümler
        </Link>
        <Link to="/notalar" aria-current={notalarAktif ? "page" : undefined} className={notalarAktif ? MENU_HAP : MENU_LINK}>
          notalar
        </Link>
        <span className={MENU_PASIF} aria-disabled="true">
          blog
        </span>
        {adminMi && (
          <Link to="/admin" aria-current={yonetimAktif ? "page" : undefined} className={yonetimAktif ? MENU_HAP : MENU_LINK}>
            yönetim
          </Link>
        )}
        {auth.isAuthenticated ? (
          <span className="flex items-center gap-4">
            <span className="kucuk max-[760px]:hidden text-yazi">{auth.user?.profile.preferred_username}</span>
            <button type="button" onClick={() => auth.signoutRedirect()} className={`${MENU_LINK} cursor-pointer border-0 bg-transparent p-0`}>
              çıkış
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => auth.signinRedirect({ state: { donus: location.pathname + location.search } })}
            className={`${MENU_LINK} cursor-pointer border-0 bg-transparent p-0`}
          >
            giriş
          </button>
        )}
      </nav>

      <AramaKutusu />
    </header>
  );
}

export function Footer() {
  const bugun = new Date();
  const gun = bugun.toLocaleDateString("tr-TR", { weekday: "long" });
  const tarih = bugun.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <footer className="flex flex-wrap items-end justify-between gap-4 border-t-[1.5px] border-yazi px-[clamp(16px,5vw,70px)] pt-[34px] pb-10 text-yazi">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-extrabold tracking-[0.06em] uppercase">{gun}</span>
        <span className="text-sm">{tarih}</span>
      </div>
      <span className="kucuk max-w-[360px] text-center text-soluk">
        kodlar markaların resmi açıklaması değildir · puanlar editör değerlendirmesidir
      </span>
      <span className="text-sm">
        yapan <Logo boyut="16px" />
      </span>
    </footer>
  );
}
