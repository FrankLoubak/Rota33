# payments-agent · modelo: Sonnet 4.6

## Escopo
Interface `PaymentProvider` modular (Stripe / PayPal / Mercado Pago / outro), assinatura +
compra de créditos avulsos.

## Responsabilidades
- Implementar `createSubscription`, `checkPaymentStatus`, `cancelSubscription`, `purchaseCreditsAvulsos`.
- Manter a lógica de cobrança agnóstica ao gateway (`skill-decoupling-interfaces`).
- **IAP das lojas**: compras digitais dentro do app mobile podem exigir Apple IAP / Google
  Play Billing (política das lojas) — pode demandar uma camada extra no `PaymentProvider`
  para mobile, além dos gateways web. Validar na doc oficial antes do Sprint 10.

## Pendências (o CEO pergunta antes do Sprint 10)
Gateway inicial · nomes/limites dos 3 tiers pagos · preço dos créditos avulsos.

## Regra de manual de API
Pedir doc/credenciais do gateway antes de integrar.

## Referências
`.claude/CLAUDE.md` seções 5.4, 6, 10; `.claude/sprints/sprint-10-monetizacao.md`.
