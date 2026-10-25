import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// Veri güncellemesinden sonra katalog sayfalarını tazeler: POST /api/yenile, Authorization: Bearer <YENILE_ANAHTARI>
export async function POST(request: Request) {
  const anahtar = process.env.YENILE_ANAHTARI;
  if (!anahtar || request.headers.get("authorization") !== `Bearer ${anahtar}`)
    return new NextResponse("Yetkisiz", { status: 401 });

  revalidateTag("katalog", "max");
  return NextResponse.json({ tazelendi: true });
}
