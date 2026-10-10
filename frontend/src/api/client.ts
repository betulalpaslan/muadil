const API_URL = import.meta.env.VITE_API_URL;

// Sunucunun döndürdüğü hata; ayrıntılar (ör. satır satır hatalar) govde'de durur
export class ApiHatasi extends Error {
  durum: number;
  govde: unknown;

  constructor(mesaj: string, durum: number, govde: unknown) {
    super(mesaj);
    this.durum = durum;
    this.govde = govde;
  }
}

export async function apiIstek<T>(yol: string, token?: string, secenekler: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (!(secenekler.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const yanit = await fetch(`${API_URL}${yol}`, { ...secenekler, headers });

  if (!yanit.ok) {
    let mesaj = `Hata: ${yanit.status}`;
    let govde: unknown = null;
    try {
      govde = await yanit.json();
      const g = govde as { errors?: Record<string, string[]>; mesaj?: string };
      if (g.errors) mesaj = Object.values(g.errors).flat().join(" ");
      else if (g.mesaj) mesaj = g.mesaj;
    } catch {
      // gövde JSON değilse durum kodlu mesaj kalır
    }
    throw new ApiHatasi(mesaj, yanit.status, govde);
  }

  if (yanit.status === 204) return undefined as T;
  return (await yanit.json()) as T;
}
