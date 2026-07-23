# Sprint 15 — Deploy em produção · modelo líder: Sonnet 4.6

## Escopo
Deploy do backend + web na VPS Hostinger via **EasyPanel**; domínio/DNS/proxy no **Cloudflare**.
Primeira etapa que efetivamente usa infra de produção.

## Pré-requisito (regra 0.3 / D2)
Solicitar **acesso SSH** e **confirmação explícita** ao usuário para cada ação de infra
(criar serviços no EasyPanel, DNS no Cloudflare, subir containers). Nada sem OK.

## Definition of Done
- [ ] Backend + web publicados (EasyPanel), Postgres/PostGIS de produção migrado.
- [ ] Domínio configurado no Cloudflare (DNS/proxy/TLS).
- [ ] Isolamento dev/prod respeitado (D1); segredos via env/gerenciador do EasyPanel.
- [ ] Smoke test dos fluxos críticos em produção.
- [ ] `tests-agent`: PASS (smoke em produção).
