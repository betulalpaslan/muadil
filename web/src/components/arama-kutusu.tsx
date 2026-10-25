"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AramaSonucu } from "@/lib/veri";

const ETIKET: Record<AramaSonucu["tur"], string> = { muadil: "Kod", parfum: "Parfüm", marka: "Marka", nota: "Nota" };

export function AramaKutusu() {
  const [q, setQ] = useState("");
  const [sonuclar, setSonuclar] = useState<AramaSonucu[]>([]);
  const [acik, setAcik] = useState(false);
  const router = useRouter();
  const kutu = useRef<HTMLFormElement>(null);

  // 300 ms bekler, tek harfte aramaz; eski istek yenisini ezmesin diye iptal edilir.
  useEffect(() => {
    if (q.trim().length < 2) return;
    const iptal = new AbortController();
    const zamanlayici = setTimeout(async () => {
      try {
        const yanit = await fetch(`/api/ara?q=${encodeURIComponent(q)}`, { signal: iptal.signal });
        if (yanit.ok) setSonuclar(await yanit.json());
      } catch {
        /* iptal edildi ya da ağ hatası: öneri göstermemek yeterli */
      }
    }, 300);
    return () => {
      clearTimeout(zamanlayici);
      iptal.abort();
    };
  }, [q]);

  useEffect(() => {
    const disTik = (e: MouseEvent) => {
      if (kutu.current && !kutu.current.contains(e.target as Node)) setAcik(false);
    };
    document.addEventListener("mousedown", disTik);
    return () => document.removeEventListener("mousedown", disTik);
  }, []);

  return (
    <form
      ref={kutu}
      role="search"
      className="relative mx-auto w-full max-w-[560px]"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) {
          setAcik(false);
          router.push(`/ara?q=${encodeURIComponent(q.trim())}`);
        }
      }}
    >
      <div className="flex items-stretch py-[5px] pr-[5px] pl-[18px]" style={{ border: "1px solid var(--cam-sinir)", borderRadius: "var(--r-pill)", background: "var(--cam)", backdropFilter: "blur(14px)", boxShadow: "0 10px 30px var(--shadow)" }}>
        <div className="flex h-10 min-w-0 flex-1 items-center gap-3 px-1">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" className="shrink-0">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5L21 21" />
          </svg>
          <label htmlFor="ara" className="sr">
            Orijinal parfümün ya da muadil kodunun adını yaz
          </label>
          <input
            id="ara"
            type="search"
            autoComplete="off"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setAcik(true);
            }}
            onFocus={() => setAcik(true)}
            placeholder="PARFÜM YA DA MUADİL KODU YAZ (ÖR: BARGELLO 567)"
            className="min-w-0 flex-1 border-none bg-transparent p-0 text-base outline-none placeholder:text-soluk sm:text-[12px] sm:tracking-[0.06em]"
          />
        </div>
        <button type="submit" className="dugme px-6 text-[12px] tracking-[0.12em]">
          KOKU BUL
        </button>
      </div>
      {acik && q.trim().length >= 2 && sonuclar.length > 0 && (
        <ul className="absolute z-20 mt-2 max-h-96 w-full overflow-auto p-2 shadow-2xl" style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)" }}>
          {sonuclar.map((s) => (
            <li key={s.href}>
              <Link href={s.href} onClick={() => setAcik(false)} className="flex items-baseline justify-between gap-3 px-4 py-2.5 hover:bg-black/5" style={{ borderRadius: "var(--r-md)" }}>
                <span className="font-medium">
                  {s.ad}
                  {s.alt && <span className="ml-2 text-sm font-normal text-soluk">{s.alt}</span>}
                </span>
                <span className="kucuk text-vurgu">{ETIKET[s.tur]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
