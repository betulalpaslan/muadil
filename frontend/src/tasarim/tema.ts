import { useCallback, useEffect, useState } from "react";

// Gece / gündüz teması. Seçim localStorage'da tutulur; hiç seçilmemişse sistem tercihi
// (prefers-color-scheme) kullanılır. Tema <html data-tema="..."> ile uygulanır.
// İlk boyamada yanıp sönmeyi önlemek için index.html <head> içine şu satır eklenir:
// <script>try{var t=localStorage.getItem("tema");if(!t)t=matchMedia("(prefers-color-scheme: light)").matches?"gunduz":"gece";document.documentElement.dataset.tema=t}catch(e){}</script>

export type Tema = "gece" | "gunduz";
const ANAHTAR = "tema";

function kayitliTema(): Tema | null {
  try {
    const t = localStorage.getItem(ANAHTAR);
    return t === "gece" || t === "gunduz" ? t : null;
  } catch {
    return null;
  }
}

function sistemTemasi(): Tema {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches ? "gunduz" : "gece";
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(() => kayitliTema() ?? sistemTemasi());

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
  }, [tema]);

  // Kullanıcı elle seçmediyse sistem değişikliğini izle
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!mq) return;
    const dinle = () => {
      if (!kayitliTema()) setTema(mq.matches ? "gunduz" : "gece");
    };
    mq.addEventListener("change", dinle);
    return () => mq.removeEventListener("change", dinle);
  }, []);

  const degistir = useCallback(() => {
    setTema((t) => {
      const yeni: Tema = t === "gece" ? "gunduz" : "gece";
      try {
        localStorage.setItem(ANAHTAR, yeni);
      } catch {
        // gizli sekme vb.; tema yine de bu oturumda uygulanır
      }
      return yeni;
    });
  }, []);

  return { tema, degistir };
}
