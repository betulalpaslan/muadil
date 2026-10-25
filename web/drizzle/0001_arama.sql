CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
-- Türkçe ı/İ, ş, ğ, ü, ö, ç farklarını yok sayan arama biçimi
CREATE OR REPLACE FUNCTION ara_norm(t text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE
  AS $$ SELECT lower(translate(t, 'İIıŞşĞğÜüÖöÇç', 'iiissgguuoocc')) $$;
--> statement-breakpoint
CREATE INDEX parfum_ara_idx ON parfum USING gin (ara_norm(ad) gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX marka_ara_idx ON marka USING gin (ara_norm(ad) gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX nota_ara_idx ON nota USING gin (ara_norm(ad) gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX muadil_kod_ara_idx ON muadil USING gin (ara_norm(kod) gin_trgm_ops);
