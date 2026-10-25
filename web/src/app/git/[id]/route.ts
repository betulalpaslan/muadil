import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema as s } from "@/db";

// Satıcıya yönlendirir ve tıklamayı kaydeder. Bağlantıyı (ileride affiliate) tek yerden değiştirmeyi sağlar.
export async function GET(request: Request, { params }: RouteContext<"/git/[id]">) {
  const { id } = await params;
  const muadilId = Number(id);
  if (!Number.isInteger(muadilId)) return new NextResponse("Bulunamadı", { status: 404 });

  const [m] = await db.select({ link: s.muadil.urunLinki }).from(s.muadil).where(eq(s.muadil.id, muadilId));
  if (!m || !/^https:\/\//i.test(m.link)) return new NextResponse("Bulunamadı", { status: 404 });

  const kaynak = new URL(request.url).searchParams.get("k")?.slice(0, 200) ?? null;
  await db.insert(s.cikisTiklamasi).values({ muadilId, kaynak }).catch(() => {});

  return NextResponse.redirect(m.link, { status: 302, headers: { "X-Robots-Tag": "noindex, nofollow" } });
}
