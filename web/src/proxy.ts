import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { OTURUM_CEREZI, cerezGecerliMi } from "@/lib/yonetim/cerez";

// /yonetim altındaki her şey oturum ister (giriş sayfası hariç). Sayfalar ve eylemler ayrıca kendileri de doğrular.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/yonetim/giris") return NextResponse.next();
  if (cerezGecerliMi(request.cookies.get(OTURUM_CEREZI)?.value)) return NextResponse.next();
  return NextResponse.redirect(new URL("/yonetim/giris", request.url));
}

export const config = { matcher: "/yonetim/:path*" };
