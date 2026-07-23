# skill-commenting-standard

Padrão **obrigatório** de comentário de cabeçalho em **todo** arquivo de código (mobile, web, backend).

## Cabeçalho
1. **Finalidade** — o que o arquivo/módulo faz.
2. **Como funciona** — resumo do funcionamento.
3. **Relações** — com quais outros componentes/módulos se relaciona.

### Exemplo (TypeScript)
```ts
/**
 * Finalidade: serviço de otimização de rota (orquestra RoutingProvider + solver VRPTW).
 * Como funciona: obtém a matriz distância/tempo do RoutingProvider e resolve a ordem das
 *   paradas respeitando janelas de horário e prioridades; persiste ordem_otimizada.
 * Relações: usa RoutingProvider e routing-algorithms; consumido por routeController.
 */
```

## Idioma
Comentários em **português**; identificadores (variáveis, funções, tipos, tabelas) em **inglês**.
