export function gorselAdresi(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/") ? `${import.meta.env.VITE_API_URL}${url}` : url;
}