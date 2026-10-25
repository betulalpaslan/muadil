"use client";

import { useActionState } from "react";
import { girisYap } from "../actions";

export function GirisFormu() {
  const [durum, eylem, bekliyor] = useActionState(girisYap, undefined);
  return (
    <form action={eylem} className="space-y-4">
      <div>
        <label className="y-etiket" htmlFor="sifre">
          Yönetim şifresi
        </label>
        <input id="sifre" name="sifre" type="password" required autoFocus autoComplete="current-password" className="y-girdi" />
      </div>
      {durum?.hata && (
        <div role="alert" className="y-hata">
          {durum.hata}
        </div>
      )}
      <button type="submit" disabled={bekliyor} className="dugme y-btn w-full">
        {bekliyor ? "Giriliyor…" : "Giriş yap"}
      </button>
    </form>
  );
}
