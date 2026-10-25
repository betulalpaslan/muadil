import type { Metadata } from "next";
import Link from "next/link";
import { cikisYap } from "./actions";
import "./yonetim.css";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s · Yönetim" },
  robots: { index: false, follow: false },
};

// Yönetim sayfaları her istekte oturum ve veritabanı okur; önceden üretilecek bir kabuğu yoktur.
// [id] rotalarında adres önceden bilinmediğinden kök düzendeki usePathname() de kabuğu engeller.
export const instant = false;

const MENU = [
  { href: "/yonetim", ad: "Panel" },
  { href: "/yonetim/parfumler", ad: "Parfümler" },
  { href: "/yonetim/muadiller", ad: "Muadiller" },
  { href: "/yonetim/notalar", ad: "Notalar" },
  { href: "/yonetim/markalar", ad: "Markalar" },
];

export default function YonetimDuzeni({ children }: LayoutProps<"/yonetim">) {
  return (
    <div className="y-kok py-4">
      <nav aria-label="Yönetim menüsü" className="mb-8 flex flex-wrap items-center gap-2 border-b pb-4" style={{ borderColor: "var(--line)" }}>
        <span className="kucuk mr-3 text-vurgu">Yönetim</span>
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} className="y-ikincil">
            {m.ad}
          </Link>
        ))}
        <form action={cikisYap} className="ml-auto">
          <button type="submit" className="y-ikincil">
            Çıkış
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
