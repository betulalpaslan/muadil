export type MarkaTuru = "Orijinal" | "Muadil";

export interface Marka {
  id: number;
  ad: string;
  tur: MarkaTuru;
  gorselUrl: string | null;
}

export interface Nota {
  id: number;
  ad: string;
}

export type NotaKatmani = "Ust" | "Orta" | "Alt";

export type Cinsiyet = "Kadin" | "Erkek" | "Unisex";

export interface MuadilOzet {
  marka: string;
  kod: string;
  fiyat: number;
}

export interface RenkAlgilamaSonucu {
  id: number;
  ad: string;
  renk: string;
}

export interface ParfumListe {
  id: number;
  ad: string;
  marka: string;
  gorselUrl: string | null;
  renk: string | null;
  muadilSayisi: number;
  enUygunMuadil: number | null;
  muadilOzetleri: MuadilOzet[];
}

export interface ParfumNota {
  notaId: number;
  notaAd: string;
  katman: NotaKatmani;
}

export interface Muadil {
  id: number;
  marka: string;
  markaGorselUrl: string | null;
  kod: string;
  cinsiyet: Cinsiyet;
  fiyat: number;
  kalicilikPuani: number;
  benzerlikPuani: number;
  urunLinki: string;
}

export interface ParfumDetayVeri {
  id: number;
  ad: string;
  cinsiyet: Cinsiyet;
  markaId: number;
  marka: string;
  gorselUrl: string | null;
  renk: string | null;
  notalar: ParfumNota[];
  muadiller: Muadil[];
}
