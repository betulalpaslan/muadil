import {
  bigserial,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const markaTuru = pgEnum("marka_turu", ["orijinal", "muadil"]);
export const cinsiyet = pgEnum("cinsiyet", ["kadin", "erkek", "unisex"]);
export const notaKatmani = pgEnum("nota_katmani", ["ust", "orta", "alt"]);

export const marka = pgTable("marka", {
  id: serial("id").primaryKey(),
  ad: varchar("ad", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  tur: markaTuru("tur").notNull(),
  gorselUrl: text("gorsel_url"),
});

export const parfum = pgTable(
  "parfum",
  {
    id: serial("id").primaryKey(),
    markaId: integer("marka_id").notNull().references(() => marka.id),
    ad: varchar("ad", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 250 }).notNull().unique(),
    cinsiyet: cinsiyet("cinsiyet").notNull().default("unisex"),
    gorselUrl: text("gorsel_url"),
    renk: varchar("renk", { length: 7 }),
    silinmeTarihi: timestamp("silinme_tarihi", { withTimezone: true }),
  },
  (t) => [unique().on(t.markaId, t.ad)],
);

export const muadil = pgTable(
  "muadil",
  {
    id: serial("id").primaryKey(),
    parfumId: integer("parfum_id").notNull().references(() => parfum.id),
    markaId: integer("marka_id").notNull().references(() => marka.id),
    kod: varchar("kod", { length: 50 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull().unique(),
    cinsiyet: cinsiyet("cinsiyet").notNull().default("unisex"),
    // Fiyat tek değer; güncellenme tarihi sayfada "son güncelleme" olarak gösterilir.
    fiyat: numeric("fiyat", { precision: 10, scale: 2 }).notNull(),
    fiyatTarihi: timestamp("fiyat_tarihi", { withTimezone: true }).notNull().defaultNow(),
    urunLinki: text("urun_linki").notNull(),
    // Editör puanı, 1-10.
    kalicilikPuani: smallint("kalicilik_puani").notNull(),
    benzerlikPuani: smallint("benzerlik_puani").notNull(),
    silinmeTarihi: timestamp("silinme_tarihi", { withTimezone: true }),
  },
  (t) => [
    unique().on(t.markaId, t.kod, t.cinsiyet),
    index("muadil_parfum_idx").on(t.parfumId),
  ],
);

export const nota = pgTable("nota", {
  id: serial("id").primaryKey(),
  ad: varchar("ad", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  gorselUrl: text("gorsel_url"),
  aciklama: text("aciklama"),
});

export const parfumNota = pgTable(
  "parfum_nota",
  {
    parfumId: integer("parfum_id").notNull().references(() => parfum.id),
    notaId: integer("nota_id").notNull().references(() => nota.id),
    katman: notaKatmani("katman").notNull(),
  },
  (t) => [primaryKey({ columns: [t.parfumId, t.notaId, t.katman] }), index("parfum_nota_nota_idx").on(t.notaId)],
);

export const cikisTiklamasi = pgTable("cikis_tiklamasi", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  muadilId: integer("muadil_id").notNull().references(() => muadil.id),
  kaynak: varchar("kaynak", { length: 200 }),
  zaman: timestamp("zaman", { withTimezone: true }).notNull().defaultNow(),
});

export const aramaLogu = pgTable("arama_logu", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sorgu: varchar("sorgu", { length: 200 }).notNull(),
  sonucSayisi: integer("sonuc_sayisi").notNull(),
  zaman: timestamp("zaman", { withTimezone: true }).notNull().defaultNow(),
});
