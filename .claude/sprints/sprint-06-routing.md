# Sprint 6 — Otimização de rota (OSRM + solver) · modelo líder: Opus 4.8

## Escopo
`RoutingProvider` padrão (OSRM/OSM) + **solver VRPTW** (routing-algorithms-agent) para a
otimização inicial. Formalizar a fronteira G5: RoutingProvider = matriz/geometria; solver = ordem.

## Definition of Done
- [ ] `RoutingProvider.calculateOptimizedRoute` (OSRM matriz + geometria) atrás da interface.
- [ ] Solver VRPTW resolve a ordem respeitando janelas de horário + prioridades; grava `ordem_otimizada`.
- [ ] Métricas planejadas (distância/tempo) na Rota; `ordem_original` preservada (G3).
- [ ] Tela "Rota otimizada" + botão abrir em app de navegação externo.
- [ ] Abstração pronta para o provedor premium (Sprint 11).
- [ ] `tests-agent`: PASS (otimização determinística em cenário de teste; limites documentados).

## Regra de manual/infra
OSRM self-hosted exige dados OSM — provisionamento é ação de infra (D2): só com confirmação.
