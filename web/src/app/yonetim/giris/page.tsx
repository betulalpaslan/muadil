import type { Metadata } from "next";
import { GirisFormu } from "../_bilesenler/giris-formu";

export const metadata: Metadata = { title: "Giriş" };

export default function GirisSayfasi() {
  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="genis mb-6 text-3xl">Yönetim girişi</h1>
      <div className="y-kart">
        <GirisFormu />
      </div>
    </div>
  );
}
