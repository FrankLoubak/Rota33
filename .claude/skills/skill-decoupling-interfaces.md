# skill-decoupling-interfaces

Toda integração externa é usada **atrás de uma interface** — nunca chamada direto pela
lógica de negócio. Nenhuma regra de negócio depende do provedor concreto.

## Interfaces do projeto (CLAUDE.md 5)
`RoutingProvider` · `OCRProvider` · `VoiceInputProvider` · `PaymentProvider` · `AdProvider`
(+ futuro `GeocodingProvider` — G1).

## Regras
- A lógica de negócio importa **a interface**, nunca a classe concreta.
- A escolha do provedor concreto é injetada (factory/DI), selecionável por env e/ou por
  `tier` (ex.: `RoutingProvider` premium para assinantes).
- Trocar de provedor não deve exigir alterar a lógica de negócio — só a implementação injetada.
- Adapters concretos ficam isolados (ex.: `backend/src/providers/<interface>/<provedor>.ts`).

## Checklist por integração
- [ ] Interface definida com tipos de entrada/saída próprios (não vaza tipo do SDK do provedor).
- [ ] Adapter concreto implementa a interface e trata erros do provedor.
- [ ] Seleção do adapter por factory/env; teste com adapter mock.
