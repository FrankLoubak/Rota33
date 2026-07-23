# Sprint 3 — CRUD de Rota e Parada · modelo líder: Sonnet 4.6 (UI em Fable 5)

## Escopo
Criar/editar rota (**sem** início/fim — D5: o app determina a ordem), adicionar paradas
**manuais** (texto), janela de horário, prioridade, descrição de pacote. **Geocoding** (D4)
do endereço → lat/lng; guardar `ordem_original` (D6).

## Definition of Done
- [x] Endpoints CRUD de Rota e Parada (backend); geocoding via `GeocodingProvider`
  (mock/Nominatim/Google stub). 17 testes verdes; escopado por id_usuario. **[Opus/Sonnet]**
- [ ] Telas Nova rota (lista de pontos, sem início/fim) e Config. de parada (mobile + web). **[Fable 5]**
- [x] Endereço em texto vira Parada com coordenadas (geocoded), `ordem_original` e validação.
- [ ] i18n-ready + acessibilidade (labels/tooltips).
- [ ] `tests-agent`: PASS (CRUD + geocoding mock + validação).
