import Link from "next/link";

export default function BulunamadiSayfasi() {
  return (
    <div className="py-16">
      <p className="kucuk text-vurgu">404</p>
      <h1 className="genis mt-3 text-3xl">Sayfa bulunamadı</h1>
      <p className="mt-4 text-soluk">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
      <Link href="/parfumler" className="dugme mt-8 h-11 px-6">
        Tüm parfümlere git
      </Link>
    </div>
  );
}
