import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OTURUM_CEREZI, cerezGecerliMi } from "./cerez";

export async function oturumVarMi(): Promise<boolean> {
  return cerezGecerliMi((await cookies()).get(OTURUM_CEREZI)?.value);
}

/** Her yönetim sayfası ve her Server Action başında çağrılır: proxy atlatılsa bile veri açılmaz. */
export async function yetkiGerek(): Promise<void> {
  if (!(await oturumVarMi())) redirect("/yonetim/giris");
}
