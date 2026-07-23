-- Migration 0001 — PostGIS: extensão + colunas geográficas geradas + índices GiST.
-- Estratégia (D7): lat/lng ficam nas tabelas (plano seção 4); a coluna `geog`
-- geography(Point,4326) é GERADA a partir de lat/lng (sempre consistente) e indexada
-- com GiST para consultas espaciais (proximidade/distância) usadas nos analytics.

CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint

-- Paradas: lat/lng são nulos até o geocoding (D4); geog acompanha (null enquanto sem coord).
ALTER TABLE "paradas" ADD COLUMN "geog" geography(Point,4326)
  GENERATED ALWAYS AS (
    CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL
      THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    END
  ) STORED;
--> statement-breakpoint
CREATE INDEX "idx_paradas_geog" ON "paradas" USING GIST ("geog");
--> statement-breakpoint

-- Registros de trajeto GPS: lat/lng obrigatórios; geog sempre presente.
ALTER TABLE "registros_trajeto_gps" ADD COLUMN "geog" geography(Point,4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED;
--> statement-breakpoint
CREATE INDEX "idx_trajeto_geog" ON "registros_trajeto_gps" USING GIST ("geog");
