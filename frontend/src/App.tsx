import { Route, Routes } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import AdminSayfasi from "./components/admin/AdminSayfasi";
import { Header } from "./components/OrtakYerlesim";
import AnaSayfa from "./components/AnaSayfa";
import BlogYazisi from "./components/BlogYazisi";
import FavorilerSayfasi from "./components/FavorilerSayfasi";
import NotalarSayfasi from "./components/NotalarSayfasi";
import ParfumDetay from "./components/ParfumDetay";
import ParfumlerSayfasi from "./components/ParfumlerSayfasi";
import RenkAyari from "./components/tasarim/RenkAyari";
import { ONE_CIKAN_BLOG } from "./tasarim/blogOrnek";

function tokenIcerigi(token: string) {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default function App() {
  const auth = useAuth();

  if (auth.isLoading) return <p className="p-4 text-soluk">Yükleniyor...</p>;
  if (auth.error) return <p className="p-4">Giriş sırasında bir sorun oluştu: {auth.error.message}</p>;

  const roller: string[] = auth.user
    ? tokenIcerigi(auth.user.access_token).realm_access?.roles ?? []
    : [];
  const adminMi = roller.includes("admin");

  return (
    <div className="min-h-dvh bg-zemin text-yazi">
      <Header adminMi={adminMi} />
      <Routes>
        <Route path="/" element={<AnaSayfa />} />
        <Route path="/parfumler" element={<ParfumlerSayfasi />} />
        <Route path="/notalar" element={<NotalarSayfasi />} />
        <Route path="/favorilerim" element={<FavorilerSayfasi />} />
        <Route path="/parfum/:id" element={<ParfumDetay adminMi={adminMi} />} />
        <Route path={ONE_CIKAN_BLOG.yol} element={<BlogYazisi />} />
        <Route
          path="/admin"
          element={
            adminMi ? (
              <AdminSayfasi />
            ) : (
              <p className="p-4 text-soluk">Bu sayfayı görmek için yönetici olarak giriş yapmalısın.</p>
            )
          }
        />
      </Routes>
      <RenkAyari />
    </div>
  );
}