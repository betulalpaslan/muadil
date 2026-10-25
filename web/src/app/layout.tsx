import type { Metadata } from "next";
import Link from "next/link";
import { AkisSeridi } from "@/components/akis-seridi";
import { DevWidget } from "@/components/dev/dev-widget";
import { AramaKutusu } from "@/components/arama-kutusu";
import { SITE_ADI, SITE_URL } from "@/lib/site";
import { vitrin } from "@/lib/veri";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_ADI} · Orijinal parfümün uygun fiyatlı muadilini bul`, template: `%s · ${SITE_ADI}` },
  description:
    "Sevdiğin orijinal parfümün muadil kodlarını, fiyatlarını, kalıcılık ve benzerlik puanlarını karşılaştır. Aynı koku, uygun fiyat.",
  openGraph: { type: "website", locale: "tr_TR", siteName: SITE_ADI },
  alternates: { canonical: "./" },
};

const MENU = [
  { href: "/", ad: "Keşfet" },
  { href: "/parfumler", ad: "Parfümler" },
  { href: "/notalar", ad: "Notalar" },
  { href: "/markalar", ad: "Markalar" },
];

// İlk boyamadan önce kayıtlı paleti (gul | gece | adacayi) uygular; boyama sonrası renk sıçraması olmaz.
const TEMA_BETIGI = `try{var p=localStorage.getItem('muadil-palet');if(p==='gul'||p==='gece'||p==='adacayi')document.documentElement.dataset.palet=p}catch(e){}`;


export default async function RootLayout({ children }: LayoutProps<"/">) {
  const akis = await vitrin(5);

  return (
    <html lang="tr" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_BETIGI }} />
      </head>
      <body className="flex min-h-full flex-col">
        <div className="sayfa flex min-h-full flex-1 flex-col">
          <header className="rise mx-auto flex w-full max-w-[1312px] flex-wrap items-center justify-between gap-4 px-6 py-2.5">
            <Link href="/" className="text-[34px] leading-none font-medium tracking-[-0.02em] no-underline"
              style={{ color: "var(--gold-hi)" }}>
              muadil.
            </Link>
            <div className="order-last w-full min-[1000px]:order-none min-[1000px]:w-auto min-[1000px]:flex-1 min-[1000px]:px-6">
              <AramaKutusu />
            </div>
            <nav aria-label="Ana menü" className="flex flex-wrap items-center gap-6 text-[15px]">
              {MENU.map((m) => (
                <Link key={m.href} href={m.href} className="nav-a">
                  {m.ad}
                </Link>
              ))}
              <Link href="/yonetim" aria-label="Hesap" className="ikon" style={{ width: 36, height: 36 }}>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </Link>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-[1312px] flex-1 px-6 py-3">{children}</main>

          <AkisSeridi vitrin={akis} />
          <footer style={{ background: "var(--footer)", color: "var(--ink)", borderTop: "1px solid var(--line)" }}>
            <div className="mx-auto flex max-w-[1312px] flex-wrap items-center justify-between gap-4 px-6 py-4 text-sm">
              <span className="text-[26px] leading-none font-medium tracking-[-0.02em]" style={{ color: "var(--gold-hi)" }}>muadil.</span>
              <div className="max-w-xl space-y-2 text-soluk">
                <p>
                  Kodlar markaların resmi açıklaması değildir; benzerlik ve kalıcılık puanları editör değerlendirmesidir.
                  Markalar ilgili sahiplerine aittir.
                </p>
                <p>Fiyatlar bilgi amaçlıdır, satıcı sitesinde değişmiş olabilir.</p>
                <p>© 2026 muadil</p>
              </div>
            </div>
          </footer>
        </div>
        {process.env.NODE_ENV === "development" && <DevWidget />}
      </body>
    </html>
  );
}
