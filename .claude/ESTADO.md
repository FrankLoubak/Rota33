# ESTADO do projeto — Rota33 (memória versionada)

> Estado vivo do desenvolvimento (substitui a "memória" externa). Atualizado a cada sprint.
> Repo: github.com/FrankLoubak/Rota33 · trabalho em `~/Rota33` · dev na própria VPS (D2: só local até deploy).

## Progresso dos sprints
| Sprint | Status |
|---|---|
| 0 — Setup + `.claude/` + matriz de modelos | ✅ no `main` |
| 1 — Modelo de dados (Drizzle + PostGIS) | ✅ no `main` |
| 2 — Auth (e-mail/senha + social + JWT) | ✅ no `main` |
| 3 — CRUD Rota/Parada + geocoding + telas | 🔄 backend PRONTO (17 testes verdes); **telas pendentes (Fable 5)** |
| 4-16 | ⏳ |

## Ambiente para retomar
- Backend: `~/Rota33/backend` (Node+Express+Drizzle). `npm test` usa o PostGIS de dev.
- **Postgres/PostGIS de dev** no container `rota33_postgis_dev` (host **5442**). Subir:
  `docker compose -f docker-compose.dev.yml up -d postgis-dev`. Descartar: `... down -v`.
- Web: `~/Rota33/web` (React+Vite). Mobile: `~/Rota33/mobile` (Expo, ainda sem `npm install`).
- Migrations até **0002**. Backend/web já com deps instaladas; mobile não.

## Modelo de IA por agente (matriz — trocar `/model` por sprint)
- **Fable 5**: UI (mobile-agent, web-agent) — validado por benchmark.
- **Opus 4.8**: CEO, database, routing-algorithms, cybersecurity.
- **Sonnet 4.6**: backend, ocr-voice, payments, analytics, tests.
- **Haiku 4.5**: ads.

## Decisões (Decision Log resumido — detalhes em CLAUDE.md)
D1 dev/prod separados (dev 5442; sem RLS, isolamento por id_usuario) · D2 só local até deploy ·
D3 matriz de modelos · D4 GeocodingProvider (Nominatim+Google) · D5 Rota sem início/fim (app ordena) ·
D6 Parada.ordem_original · D7 Drizzle · D8 JWT access+refresh · D9 SocialAuthVerifier (mock) ·
D10 EmailProvider (log/mock) · D11 exclusão = anonimizar+soft-delete.

## Pendências abertas
- **G2b** (Sprint 6): rota parte da localização do motorista? (palpite: sim).
- G5 fronteira RoutingProvider×solver (S6) · G6 atomicidade de crédito (S9) · G8 storage OCR (S4).
- Definições de monetização (S10): gateway, rede de anúncios, tiers/limites, preço avulso.
- VoiceInputProvider (S5); credenciais reais (Google/Apple/e-mail/mapas) quando integrar.

## Como conduzimos
Sprint a sprint; perguntar só ambiguidades reais; validar por ferramenta (typecheck+testes+build);
fechar DoD no `.claude/sprints/` com veredito tests-agent; commit em branch própria + PR;
**PRs criados já com `--base main` e merge sequencial** (não usar `gh pr edit --base`).
