# Sprint 0 — Setup · modelo líder: Opus 4.8

## Escopo
- Estrutura `.claude/` (CLAUDE.md, agents, skills, sprints) + matriz de modelos por agente.
- `.gitignore` (Node + Expo + env).
- Esqueleto do monorepo: `backend/` (Node+Express), `web/` (React+Vite), `mobile/` (Expo).
- Estratégia de banco PostgreSQL/**PostGIS** e **isolamento lógico dev/prod** na VPS (D1).
- Regra de acesso SSH/infra documentada (0.3); trabalho só local até o deploy (D2).

## Definition of Done
- [x] `.claude/` populado (CLAUDE.md com seções 1,1.1,4,5,6 + Decision Log + matriz de modelos).
- [x] `.gitignore` presente.
- [ ] `backend/`, `web/`, `mobile/` com package.json/config e estrutura de pastas.
- [ ] `docker-compose` de dev (Postgres+PostGIS) — **arquivo criado**; subir só com confirmação (D2).
- [x] `.env.example` por app.
- [x] Rodada de decisões de schema resolvida (D4 geocoding, D5 início/fim pelo app, D6 ordem_original, D7 Drizzle). Aberta só a G2b (Sprint 6).
- [ ] `tests-agent`: PASS (lint/build dos esqueletos) — pendente `npm install` (D2: confirmar antes).

## Notas
Estamos rodando dentro da VPS de produção (EasyPanel/Traefik ocupam 80/443/3000/5432).
Nenhuma ação de infra sem confirmação do usuário (D2).
