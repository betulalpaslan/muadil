import { Link, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import AdminSayfasi from "./components/admin/AdminSayfasi";
import ParfumDetay from "./components/ParfumDetay";
import Parfumler from "./components/Parfumler";

function tokenIcerigi(token: string) {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default function App() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) return <p className="p-4 text-buhar">Yükleniyor...</p>;
  if (auth.error) return <p className="p-4">Giriş sırasında bir sorun oluştu: {auth.error.message}</p>;

  const roller: string[] = auth.user
    ? tokenIcerigi(auth.user.access_token).realm_access?.roles ?? []
    : [];
  const adminMi = roller.includes("admin");

  return (
    <div className="min-h-dvh">
      <header className="border-b border-cizgi">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-baslik text-3xl leading-none">
            Muadil
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {adminMi && (
              <Link to="/admin" className="text-buhar hover:text-murekkep">
                Yönetim
              </Link>
            )}
            {auth.isAuthenticated ? (
              <>
                <span className="hidden text-buhar sm:inline">{auth.user?.profile.preferred_username}</span>
                <button onClick={() => auth.signoutRedirect()} className="text-buhar hover:text-murekkep">
                  Çıkış yap
                </button>
              </>
            ) : (
              <button
                onClick={() => auth.signinRedirect({ state: { donus: location.pathname + location.search } })}
                className="rounded-full bg-murekkep px-4 py-1.5 font-medium text-cam hover:opacity-90"
              >
                Giriş yap
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Parfumler />} />
          <Route path="/parfum/:id" element={<ParfumDetay adminMi={adminMi} />} />
          <Route
            path="/admin"
            element={adminMi ? <AdminSayfasi /> : <p className="text-buhar">Bu sayfayı görmek için yönetici olarak giriş yapmalısın.</p>}
          />
        </Routes>
      </main>
    </div>
  );
}