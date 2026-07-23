# Sprint 1 — Modelo de dados + migrations · modelo líder: Opus 4.8

## Escopo
Schema completo (seção 4) em PostgreSQL/PostGIS + migrations, via o ORM definido (G4).
Resolver antes: **G1** (GeocodingProvider), **G2** (tipo de ponto_inicio/fim), **G3**
(ordem_original), **G4** (ORM) — decididos no fim do Sprint 0.

## Definition of Done
- [x] Todas as 9 entidades via migration (0000), com FKs corretas (Drizzle).
- [x] Coordenadas: lat/lng + coluna `geog geography(Point,4326)` **gerada** + índices GiST (migration 0001).
- [x] `ordem_original` na Parada (G3/D6); Rota sem ponto_inicio/fim (D5).
- [x] Isolamento dev/prod (D1): container dev `rota33_postgis_dev` (5442); dados por id_usuario (sem RLS).
- [x] Seed mínimo (usuário + carteira + assinatura).
- [x] `tests-agent`: PASS (4/4 — geração de geog, consulta espacial ST_Distance, FK, geocoding pendente).

## Veredito tests-agent (Sprint 1)
`PASS`. PostGIS 3.4; migrations 0000 (tabelas) + 0001 (extensão + geog gerado + GiST)
aplicadas; 4 testes de integração verdes. Typecheck limpo.
