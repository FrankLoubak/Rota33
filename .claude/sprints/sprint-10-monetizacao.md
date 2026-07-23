# Sprint 10 — Monetização (pagamentos + anúncios) · modelo líder: Sonnet 4.6 (ads em Haiku)

## Pré-requisitos (o CEO pergunta ANTES de iniciar)
- Gateway de pagamento inicial (Stripe/PayPal/Mercado Pago).
- Rede de anúncios (AdMob/Meta/outra).
- Nomes/limites de crédito dos 3 tiers pagos (define o valor absoluto do tier gratuito).
- Preço dos créditos avulsos.
- **IAP das lojas**: validar se compras no app mobile exigem Apple IAP / Google Play Billing
  (pode exigir camada extra no `PaymentProvider`).

## Escopo
`PaymentProvider` (assinatura + créditos avulsos) e `AdProvider` (anúncios só no tier gratuito).

## Definition of Done
- [ ] Assinatura (criar/cancelar/status) + compra de créditos avulsos via `PaymentProvider`.
- [ ] Renovação semanal do tier gratuito = 10% do 1º tier pago (valor absoluto agora definido).
- [ ] `AdProvider` exibe anúncios só se `tier=gratuito`; registra `Anúncio`.
- [ ] `tests-agent`: PASS (assinatura, créditos avulsos, elegibilidade de anúncios).

## Regra de manual
Pedir doc/credenciais do gateway e da rede de anúncios antes de integrar.
