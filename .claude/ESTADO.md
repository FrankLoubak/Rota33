# ESTADO do projeto — Rota33 (memória versionada)

> Estado vivo do desenvolvimento (substitui a "memória" externa). Atualizado a cada sprint.
> Repo: github.com/FrankLoubak/Rota33 · trabalho em `~/Rota33` · dev na própria VPS (D2: só local até deploy).

## Progresso dos sprints
| Sprint | Status |
|---|---|
| 0 — Setup + `.claude/` + matriz de modelos | ✅ no `main` |
| 1 — Modelo de dados (Drizzle + PostGIS) | ✅ no `main` |
| 2 — Auth (e-mail/senha + social + JWT) | ✅ no `main` |
| 3 — CRUD Rota/Parada + geocoding + telas | ✅ no `main` (PR #5 — 17 testes backend + 7 web) |
| 4 — OCR de endereços | 🔄 **BREAKPOINT** — retomar aqui (ver abaixo) |
| 5-16 | ⏳ |

## Ambiente para retomar
- Backend: `~/Rota33/backend` (Node+Express+Drizzle). `npm test` usa o PostGIS de dev.
- **Postgres/PostGIS de dev** no container `rota33_postgis_dev` (host **5442**). Subir:
  `docker compose -f docker-compose.dev.yml up -d postgis-dev`. Descartar: `... down -v`.
- Web: `~/Rota33/web` (React+Vite). Mobile: `~/Rota33/mobile` (Expo, ainda sem `npm install`).
- Migrations até **0002**. Backend/web já com deps instaladas; mobile não.
- Testes: backend `npm test` (17 verdes), web `npm test` (7 verdes).

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

## ⏸️ BREAKPOINT — Sprint 4: OCR de endereços (retomar aqui)

**Branch a criar**: `feat/sprint-4-ocr`  
**Base**: `main` tip `8f59697`

### Sprint 4 — O que fazer
O plano original prevê captura de endereços por foto (OCR). Segue a mesma lógica das providers anteriores:

1. **`OcrProvider` interface** (`backend/src/providers/ocr/index.ts`)
   - Método: `extractText(imageBase64: string): Promise<string>`
   - Mock: retorna texto fixo determinístico (sem I/O)
   - Adapter real: Google Vision API (stub — lança erro até credencial configurada)
   - Factory por `config.ocrProvider` (`"mock" | "google-vision"`)

2. **Tabela `capturas_ocr`** (já existe no schema — ver `tables.ts`)
   - Campos: `id`, `id_usuario`, `id_parada` (nullable), `imagemUrl`, `textoExtraido`, `criadoEm`
   - G8 pendente: onde armazenar a imagem (S3, base64 inline ou URL externa)?
     → **Decisão sugerida**: base64 inline no campo `imagemUrl` para simplificar (sem infra extra); limitar a 1MB por imagem.

3. **`ocrService`** (`backend/src/services/ocrService.ts`)
   - `processarCaptura(idUsuario, imageBase64, idParada?)` — chama provider, persiste em `capturas_ocr`, retorna texto

4. **Rota REST** `POST /ocr/captura` (autenticada)
   - Body: `{ imageBase64: string, idParada?: string }`
   - Resposta: `{ id, textoExtraido }`

5. **Web**: botão "Usar foto" na `RotaDetalhePage` — abre `<input type="file" accept="image/*">`, converte para base64, chama `/ocr/captura`, preenche campo de endereço automaticamente

6. **Testes**: mock provider; 3 testes (extração ok, parada vinculada, rota sem auth)

### Pendência a resolver antes de codar (G8)
Confirmar estratégia de storage da imagem. Sugestão acima (base64 inline, limite 1MB) pode ser aceita sem discussão — só mencionar ao usuário ao iniciar.

### Subir o ambiente antes de continuar
```bash
docker compose -f ~/Rota33/docker-compose.dev.yml up -d postgis-dev
cd ~/Rota33/backend && npm test   # deve ter 17 testes verdes
cd ~/Rota33/web && npm test       # deve ter 7 testes verdes
```

### Modelo para Sprint 4
- Backend + provider: **Sonnet 4.6**
- Web (botão foto): **Sonnet 4.6** (ou tentar Fable 5 se quiser)

---

## Como conduzimos
Sprint a sprint; perguntar só ambiguidades reais; validar por ferramenta (typecheck+testes+build);
fechar DoD no `.claude/sprints/` com veredito tests-agent; commit em branch própria + PR;
**PRs criados já com `--base main` e merge sequencial** (não usar `gh pr edit --base`).
