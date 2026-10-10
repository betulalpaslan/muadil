export type MarkaTuru = "Orijinal" | "Muadil";

export interface Marka {
  id: number;
  ad: string;
  tur: MarkaTuru;
}
export interface Nota{
    id: number;
    ad: string;
}
export type NotaKatmani="Ust" | "Orta" | "Alt";
export interface ParfumListe{
    id: number;
    ad: string;
    marka: string;
    fiyat50ml: number;
    gorselUrl: string | null;
}
export interface ParfumNota {
  notaId: number;
  notaAd: string;
  katman: NotaKatmani;
}

export interface Muadil {
  id: number;
  marka: string;
  kod: string;
  fiyat: number;
  kalicilikPuani: number;
  benzerlikPuani: number;
  urunLinki: string;
}

export interface ParfumDetayVeri {
  id: number;
  ad: string;
  markaId: number;
  marka: string;
  fiyat50ml: number;
  gorselUrl: string | null;
  notalar: ParfumNota[];
  muadiller: Muadil[];
}