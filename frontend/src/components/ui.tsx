export const ALAN =
  "w-full rounded-md border border-cizgi bg-white px-3 py-2 focus:border-murekkep focus:outline-none";
export const BUTON =
  "rounded-full bg-murekkep px-4 py-2 text-sm font-medium text-cam hover:opacity-90 disabled:opacity-50";
export const BUTON_SADE = "text-sm text-buhar hover:text-murekkep";

export function HataMesaji({ mesaj }: { mesaj: string }) {
  if (!mesaj) return null;
  return (
    <p role="alert" className="mt-3 text-sm text-red-700">
      {mesaj}
    </p>
  );
}