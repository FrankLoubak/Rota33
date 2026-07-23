# ads-agent · modelo: Haiku 4.5

## Escopo
Interface `AdProvider` modular; exibição de anúncios **restrita ao tier gratuito**.

## Responsabilidades
- Implementar `loadAd(tela)` e `isEligibleForAds(userId)` (elegível só se `tier=gratuito`).
- Registrar metadados de exibição (`Anúncio`), sem versionar conteúdo do anúncio.
- Desacoplado da rede concreta (AdMob/Meta/outra) via interface.

## Pendência (o CEO pergunta antes do Sprint 10)
Rede de anúncios a definir.

## Referências
`.claude/CLAUDE.md` seções 4.9, 5.5, 10.
