CREATE TYPE "public"."cinsiyet" AS ENUM('kadin', 'erkek', 'unisex');--> statement-breakpoint
CREATE TYPE "public"."marka_turu" AS ENUM('orijinal', 'muadil');--> statement-breakpoint
CREATE TYPE "public"."nota_katmani" AS ENUM('ust', 'orta', 'alt');--> statement-breakpoint
CREATE TABLE "arama_logu" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sorgu" varchar(200) NOT NULL,
	"sonuc_sayisi" integer NOT NULL,
	"zaman" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cikis_tiklamasi" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"muadil_id" integer NOT NULL,
	"kaynak" varchar(200),
	"zaman" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marka" (
	"id" serial PRIMARY KEY NOT NULL,
	"ad" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"tur" "marka_turu" NOT NULL,
	"gorsel_url" text,
	CONSTRAINT "marka_ad_unique" UNIQUE("ad"),
	CONSTRAINT "marka_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "muadil" (
	"id" serial PRIMARY KEY NOT NULL,
	"parfum_id" integer NOT NULL,
	"marka_id" integer NOT NULL,
	"kod" varchar(50) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"cinsiyet" "cinsiyet" DEFAULT 'unisex' NOT NULL,
	"fiyat" numeric(10, 2) NOT NULL,
	"fiyat_tarihi" timestamp with time zone DEFAULT now() NOT NULL,
	"urun_linki" text NOT NULL,
	"kalicilik_puani" smallint NOT NULL,
	"benzerlik_puani" smallint NOT NULL,
	"silinme_tarihi" timestamp with time zone,
	CONSTRAINT "muadil_slug_unique" UNIQUE("slug"),
	CONSTRAINT "muadil_marka_id_kod_cinsiyet_unique" UNIQUE("marka_id","kod","cinsiyet")
);
--> statement-breakpoint
CREATE TABLE "nota" (
	"id" serial PRIMARY KEY NOT NULL,
	"ad" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"gorsel_url" text,
	"aciklama" text,
	CONSTRAINT "nota_ad_unique" UNIQUE("ad"),
	CONSTRAINT "nota_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "parfum" (
	"id" serial PRIMARY KEY NOT NULL,
	"marka_id" integer NOT NULL,
	"ad" varchar(200) NOT NULL,
	"slug" varchar(250) NOT NULL,
	"cinsiyet" "cinsiyet" DEFAULT 'unisex' NOT NULL,
	"gorsel_url" text,
	"renk" varchar(7),
	"silinme_tarihi" timestamp with time zone,
	CONSTRAINT "parfum_slug_unique" UNIQUE("slug"),
	CONSTRAINT "parfum_marka_id_ad_unique" UNIQUE("marka_id","ad")
);
--> statement-breakpoint
CREATE TABLE "parfum_nota" (
	"parfum_id" integer NOT NULL,
	"nota_id" integer NOT NULL,
	"katman" "nota_katmani" NOT NULL,
	CONSTRAINT "parfum_nota_parfum_id_nota_id_pk" PRIMARY KEY("parfum_id","nota_id")
);
--> statement-breakpoint
ALTER TABLE "cikis_tiklamasi" ADD CONSTRAINT "cikis_tiklamasi_muadil_id_muadil_id_fk" FOREIGN KEY ("muadil_id") REFERENCES "public"."muadil"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "muadil" ADD CONSTRAINT "muadil_parfum_id_parfum_id_fk" FOREIGN KEY ("parfum_id") REFERENCES "public"."parfum"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "muadil" ADD CONSTRAINT "muadil_marka_id_marka_id_fk" FOREIGN KEY ("marka_id") REFERENCES "public"."marka"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parfum" ADD CONSTRAINT "parfum_marka_id_marka_id_fk" FOREIGN KEY ("marka_id") REFERENCES "public"."marka"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parfum_nota" ADD CONSTRAINT "parfum_nota_parfum_id_parfum_id_fk" FOREIGN KEY ("parfum_id") REFERENCES "public"."parfum"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parfum_nota" ADD CONSTRAINT "parfum_nota_nota_id_nota_id_fk" FOREIGN KEY ("nota_id") REFERENCES "public"."nota"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "muadil_parfum_idx" ON "muadil" USING btree ("parfum_id");--> statement-breakpoint
CREATE INDEX "parfum_nota_nota_idx" ON "parfum_nota" USING btree ("nota_id");