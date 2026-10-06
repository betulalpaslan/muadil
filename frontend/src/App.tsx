import { useState } from "react";
import { useAuth } from "react-oidc-context";

function tokenIcerigi(token: string) {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default function App() {
  const auth = useAuth();
  const [sonuc, setSonuc] = useState("");

  async function cagir(yol: string) {
    const headers: Record<string, string> = {};
    if (auth.user) headers.Authorization = `Bearer ${auth.user.access_token}`;

    const yanit = await fetch(`${import.meta.env.VITE_API_URL}/api/test/${yol}`, { headers });
    const govde = yanit.ok ? JSON.stringify(await yanit.json()) : "";
    setSonuc(`${yanit.status} ${govde}`);
  }

  if (auth.isLoading) return <p>Yükleniyor...</p>;
  if (auth.error) return <p>Hata: {auth.error.message}</p>;

  const roller: string[] = auth.user
    ? tokenIcerigi(auth.user.access_token).realm_access?.roles ?? []
    : [];

  return (
    <div>
      {auth.isAuthenticated ? (
        <>
          <h1>Hoş geldin, {auth.user?.profile.preferred_username}</h1>
          <p>Rollerin: {roller.join(", ")}</p>
          <button onClick={() => auth.signoutRedirect()}>Çıkış yap</button>
        </>
      ) : (
        <button onClick={() => auth.signinRedirect()}>Giriş yap</button>
      )}

      <h2>API testi</h2>
      <button onClick={() => cagir("herkes")}>Herkese açık</button>
      <button onClick={() => cagir("giris")}>Giriş gerekli</button>
      <button onClick={() => cagir("admin")}>Sadece admin</button>
      <p>{sonuc}</p>
    </div>
  );
}