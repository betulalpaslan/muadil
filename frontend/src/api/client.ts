const API_URL = import.meta.env.VITE_API_URL;

export async function apiIstek<T>(
  yol: string,
  token?: string,
  secenekler: RequestInit = {}
): Promise<T> {
    const headers: Record<string, string> = {};
  if (!(secenekler.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const yanit = await fetch(`${API_URL}${yol}`, { ...secenekler, headers });

  if (!yanit.ok) {
    let mesaj = `Hata: ${yanit.status}`;
    try {
      const govde = await yanit.json();
      if (govde.errors) mesaj = Object.values(govde.errors).flat().join(" ");
      else if (govde.mesaj) mesaj = govde.mesaj;
    } catch {
      // gövde JSON değilse durum kodlu mesaj kalır
    }
    throw new Error(mesaj);
  }

  if (yanit.status === 204) return undefined as T;
  return (await yanit.json()) as T;
}