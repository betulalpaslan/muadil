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

export interface Nota {
  id: number;
  ad: string;
  gorselUrl: string | null;
  aciklama: string | null;
}

export interface ParfumNota {
  notaId: number;
  notaAd: string;
  katman: NotaKatmani;
  gorselUrl?: string | null;
  aciklama?: string | null;
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
  // Kullanıcı değerlendirmeleri (1-5); editör puanlarından (benzerlik, kalıcılık) ayrıdır
  degerlendirmeOrtalamasi: number | null;
  degerlendirmeSayisi: number;
}

export interface Degerlendirme {
  id: number;
  kullaniciAdi: string;
  puan: number;
  // İsteğe bağlı 1-5; verilmediyse null
  benzerlikPuani: number | null;
  kalicilikPuani: number | null;
  yorum: string | null;
  tarih: string;
  benimMi: boolean;
}

export interface DegerlendirmeOzeti {
  ortalama: number | null;
  // Yalnız o puanı vermiş kullanıcıların ortalaması
  benzerlikOrtalamasi: number | null;
  kalicilikOrtalamasi: number | null;
  sayi: number;
  benim: Degerlendirme | null;
  degerlendirmeler: Degerlendirme[];
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
