# Sprint 1 — Modelo de dados + migrations · modelo líder: Opus 4.8

## Escopo
Schema completo (seção 4) em PostgreSQL/PostGIS + migrations, via o ORM definido (G4).
Resolver antes: **G1** (GeocodingProvider), **G2** (tipo de ponto_inicio/fim), **G3**
(ordem_original), **G4** (ORM) — decididos no fim do Sprint 0.

## Definition of Done
- [ ] Todas as entidades (Usuário, Assinatura, CarteiraCreditos, TransacaoCredito, Rota,
  Parada, CapturaOCR, RegistroTrajetoGPS, Anúncio) via migration, com FKs corretas.
- [ ] Coordenadas em `geography(Point,4326)` + índices GiST.
- [ ] `ordem_original` incorporada (para o relatório "tempo economizado", G3).
- [ ] Isolamento dev/prod aplicado (D1).
- [ ] Seeds mínimos de teste.
- [ ] `tests-agent`: PASS (migrations aplicam; constraints e índices geo válidos).
