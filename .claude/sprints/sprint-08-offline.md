# Sprint 8 — Modo offline · modelo líder: Sonnet 4.6 (UI em Fable 5)

## Escopo
Planejamento offline: rascunho local + fila de sincronização (`skill-offline-first`).

## Definition of Done
- [ ] Criar/editar rota e paradas offline (rascunho local; `Rota.modo_offline=true`).
- [ ] Fila de sync: ao voltar a conexão, envia mudanças, roda geocoding/otimização e
  reconcilia ids locais → servidor.
- [ ] **Política de resolução de conflito definida** (pendência — CEO valida com o usuário).
- [ ] `tests-agent`: PASS (criar offline → sincronizar → consistência).
