# Sprint 9 — Sistema de créditos · modelo líder: Sonnet 4.6

## Escopo
`CarteiraCreditos` + `TransacaoCredito` aplicando a tabela de pesos (skill-credit-system).

## Definition of Done
- [ ] Débito **atômico** por ação (G6); ação bloqueada sem saldo (UX definida).
- [ ] Toda ação cobrada gera `TransacaoCredito` (com `id_rota` quando aplicável).
- [ ] Pesos conforme skill-credit-system; roteamento premium não cobra.
- [ ] Tela Créditos & assinatura (saldo + histórico de consumo).
- [ ] `tests-agent`: PASS (débito atômico, bloqueio por saldo, histórico).
