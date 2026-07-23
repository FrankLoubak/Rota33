# Sprint 7 — Execução + re-otimização + tracking · modelo líder: Opus 4.8 (UI em Fable 5)

## Escopo
Tela de execução de rota; marcar paradas concluída/pulada; **re-otimização em tempo real**;
**tracking GPS em segundo plano** (`RegistroTrajetoGPS`) só com `Rota.status=em_andamento`.

## Definition of Done
- [ ] Iniciar execução → `status=em_andamento`; encerrar → `concluida` + métricas executadas.
- [ ] Marcar parada concluída/pulada; re-otimizar a partir da posição atual (consome crédito).
- [ ] Tracking em segundo plano ativo **somente** durante execução (validado em teste).
- [ ] Registro do trajeto real (distância/tempo executados).
- [ ] `tests-agent`: PASS (ciclo de execução + regra de tracking).
