import { Link, Route, Routes } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import Markalar from "./components/Markalar";
import Notalar from "./components/Notalar";
import ParfumDetay from "./components/ParfumDetay";
import Parfumler from "./components/Parfumler";

function tokenIcerigi(token: string) {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default function App() {
  const auth = useAuth();

  if (auth.isLoading) return <p>Yükleniyor...</p>;
  if (auth.error) return <p>Hata: {auth.error.message}</p>;

  const roller: string[] = auth.user
    ? tokenIcerigi(auth.user.access_token).realm_access?.roles ?? []
    : [];
  const adminMi = roller.includes("admin");

  return (
    <div>
      <header>
        <Link to="/">Muadil</Link>{" "}
        {adminMi && <Link to="/admin">Yönetim</Link>}{" "}
        {auth.isAuthenticated ? (
          <>
            <span>{auth.user?.profile.preferred_username}</span>
            <button onClick={() => auth.signoutRedirect()}>Çıkış yap</button>
          </>
        ) : (
          <button onClick={() => auth.signinRedirect()}>Giriş yap</button>
        )}
      </header>

      <Routes>
        <Route path="/" element={<Parfumler adminMi={adminMi} />} />
        <Route path="/parfum/:id" element={<ParfumDetay adminMi={adminMi} />} />
        <Route
          path="/admin"
          element={
            adminMi ? (
              <>
                <Markalar adminMi={adminMi} />
                <Notalar adminMi={adminMi} />
              </>
            ) : (
              <p>Bu sayfa için yetkin yok.</p>
            )
          }
        />
      </Routes>
    </div>
  );
}