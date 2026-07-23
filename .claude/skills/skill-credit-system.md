# skill-credit-system

Regras de consumo/renovação de créditos (CLAUDE.md 6).

## Pesos por ação (proposta, ajustável)
| Ação | Créditos |
|---|---|
| Adicionar ponto manual (texto) | 1 |
| Adicionar ponto por voz | 1 |
| Adicionar ponto por foto (OCR) | 2 |
| Otimização inicial da rota | 1 |
| Re-otimização em tempo real (por chamada) | 1 |
| Roteamento premium (Google, assinante) | 0 (incluso no plano) |

## Regras
- **Débito atômico (G6)**: a ação e o débito de `CarteiraCreditos.saldo_atual` ocorrem na
  MESMA transação; sem saldo suficiente, a ação é **bloqueada** (UX a definir no Sprint 9).
- Toda ação cobrada gera uma `TransacaoCredito` (com `id_rota` quando aplicável).
- **Renovação semanal** do tier gratuito = 10% do limite do 1º tier pago (valor absoluto
  pendente até definir os tiers — Sprint 10).
- **Créditos avulsos**: `origem=compra_avulsa`, preço/crédito maior que dentro de um plano.
- Roteamento premium não consome crédito (exclusivo de assinante).
