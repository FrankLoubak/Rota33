# analytics-agent · modelo: Sonnet 4.6

## Escopo
Relatórios de análise dos trajetos executados (seção 8) — 11 relatórios.

## Responsabilidades
- Consultas agregadas (SQL/PostGIS) por período: distância, pontos, frequências, tempos,
  pontualidade (janelas), produtividade, re-otimização, consumo de créditos, comparativos.
- "Tempo economizado" (8.5) depende de `ordem_original` (G3) — garantir que o dado exista.
- Escopar tudo por usuário; export quando fizer sentido (a alinhar).

## Referências
`.claude/CLAUDE.md` seção 8; `.claude/sprints/sprint-12-analytics.md`.
