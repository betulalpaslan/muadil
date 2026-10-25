import { NextResponse } from "next/server";
import { ara } from "@/lib/veri";

// Arama önerileri. Önbelleğe alınmaz: sorgu her istekte değişir.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json(await ara(q), { headers: { "Cache-Control": "public, max-age=60" } });
}
