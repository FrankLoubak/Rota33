# Sprint 11 — RoutingProvider premium · modelo líder: Sonnet 4.6

## Escopo
Implementação premium do `RoutingProvider` (Google Maps Platform, trânsito ao vivo) para
usuários assinantes — selecionada pelo backend por `tier`, transparente ao resto do sistema.

## Definition of Done
- [ ] Adapter Google Maps atrás da mesma interface `RoutingProvider`.
- [ ] Seleção automática padrão (OSRM) vs premium (Google) por `tier`.
- [ ] Roteamento premium não consome crédito (incluso no plano).
- [ ] `tests-agent`: PASS (seleção por tier + adapter mock/real conforme credenciais).

## Regra de manual
Pedir credenciais/doc do Google Maps Platform antes de integrar.
