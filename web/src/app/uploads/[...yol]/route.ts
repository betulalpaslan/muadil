import { readFile } from "node:fs/promises";
import { join, sep } from "node:path";
import { NextResponse } from "next/server";
import { YUKLEME_DIZINI } from "@/lib/yonetim/gorsel";

// Yönetimden yüklenen görseller. Üretimde public/ derleme anında imaja kopyalandığından, sonradan eklenen dosyalar buradan sunulur.
// Dosya adları rastgele olduğundan ve değişmediğinden tarayıcı önbelleği süresizdir.

const TURLER: Record<string, string> = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };

export async function GET(_istek: Request, { params }: RouteContext<"/uploads/[...yol]">) {
  const { yol } = await params;
  if (yol.length !== 1) return new NextResponse("Bulunamadı", { status: 404 });

  const dosya = join(/* turbopackIgnore: true */ YUKLEME_DIZINI, yol[0]);
  const tur = TURLER[yol[0].split(".").pop()?.toLowerCase() ?? ""];
  // Yol kaçışı (../) ve bilinmeyen uzantılar reddedilir.
  if (!tur || !dosya.startsWith(YUKLEME_DIZINI + sep)) return new NextResponse("Bulunamadı", { status: 404 });

  try {
    const icerik = await readFile(/* turbopackIgnore: true */ dosya);
    return new NextResponse(new Uint8Array(icerik), {
      headers: { "content-type": tur, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" },
    });
  } catch {
    return new NextResponse("Bulunamadı", { status: 404 });
  }
}
