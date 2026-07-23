# CLAUDE.md — Rota33 (Elaborador de Rotas)

> Arquivo mestre de contexto. Instruções permanentes, arquitetura, decisões técnicas.
> Mantido atualizado pelo **agente CEO** ao final de cada sprint. Fonte: `plano_desenvolvimento.md`.

---

## 0. Regras permanentes de operação

**0.1 Nunca supor (INVIOLÁVEL).** Nenhum agente preenche lacunas de especificação com
suposições. Ambiguidade, contradição ou informação faltante não coberta pelo plano →
o **CEO interrompe e pergunta ao usuário** (com opções quando aplicável). Decisões
puramente técnicas (nome de variável, biblioteca auxiliar dentro do já definido) são livres.

**0.2 Encerramento de sprint.** Não avançar sem veredito `PASS` do `tests-agent` e sem
confirmação do CEO de que não há pendência de esclarecimento em aberto.

**0.3 Acesso à VPS / infraestrutura.** O desenvolvimento roda **na própria VPS de produção**
(ver 1.1). Antes de qualquer comando fora do diretório local do repo, ou de configurar
serviço (banco, EasyPanel, containers, DNS Cloudflare), **solicitar explicitamente acesso
SSH ao usuário** — nunca presumir acesso, nunca manusear senha em texto puro, nunca alterar
produção sem confirmação para aquela ação específica. **Decisão do usuário:** trabalhar
**apenas local** (`~/Rota33`) até o deploy; ações de infra só com confirmação explícita
(a partir do Sprint 15). Ver Decision Log D2.

---

## 1. Visão geral do produto

App **mobile + web** de planejamento de rotas com múltiplas paradas, para **motoristas de
entrega** (inspirado no Spoke Route Planner).

- Rota = ponto de início + ponto de fim + paradas intermediárias (com janela de horário e prioridade).
- O app **otimiza automaticamente** a ordem das paradas (VRPTW — não é o usuário que ordena).
- Paradas por **texto**, **foto (OCR)** ou **voz**. OCR/voz nunca viram parada sem confirmação do usuário.
- Navegação turn-by-turn **delegada** a apps externos (Google Maps/Waze/Apple Maps).
- **Re-otimização** em tempo real durante o trajeto; **tracking GPS** em segundo plano só com rota `em_andamento`.
- **Offline-first**: planejamento funciona offline (rascunho local + fila de sync).
- Monetização: 1 tier grátis (com anúncios) + 3 tiers pagos + créditos avulsos.
- Lançamento **PT-BR**, arquitetura **i18n-ready** para expansão internacional.

### 1.1 Infraestrutura
- **Repo**: github.com/FrankLoubak/Rota33.
- **Dev + produção na MESMA VPS Hostinger** (IP `187.77.255.90`, EasyPanel) — exige
  isolamento lógico dev/prod (containers/bancos separados), a definir pelo database/backend-agent (D1).
- **DNS/CDN/proxy**: Cloudflare.
- **Acesso**: só via chave SSH (ver 0.3). Segredos via env / gerenciador do EasyPanel; nada em texto puro no repo.

---

## 2. Stack e modelos por agente

| Camada | Tecnologia |
|---|---|
| Mobile | React Native + Expo |
| Web | React + TypeScript + Vite |
| Backend | Node.js + Express (API REST) |
| Banco | PostgreSQL + **PostGIS** |
| Roteamento (padrão) | OSRM + OpenStreetMap (self-hosted) |
| Roteamento (premium) | Google Maps Platform (trânsito ao vivo) |
| OCR | Google Cloud Vision (TEXT_DETECTION) |
| Voz | `VoiceInputProvider` — provedor a definir |
| Solver de otimização | VRPTW — biblioteca a definir (ex.: OR-Tools) pelo routing-algorithms-agent |
| Pagamento | `PaymentProvider` (Stripe/PayPal/Mercado Pago — a definir) |
| Anúncios | `AdProvider` (rede a definir) |
| ORM/query builder | **Drizzle** (D7); PostGIS via SQL bruto |
| Geocoding | **GeocodingProvider** (D4): Nominatim padrão + Google premium |

### 2.1 Modelo de IA por agente (D3 — validado por benchmark de UI)
| Agente(s) | Modelo | Racional |
|---|---|---|
| `mobile-agent`, `web-agent` (UI) | **Fable 5** | UI equivalente ao topo, mais rápido (benchmark do componente "Adicionar parada") |
| CEO, `database-agent`, `routing-algorithms-agent`, `cybersecurity-agent` | **Opus 4.8** | Raciocínio profundo: arquitetura, algoritmos (VRPTW), segurança, schema/geo |
| `backend-agent`, `ocr-voice-agent`, `payments-agent`, `analytics-agent`, `tests-agent` | **Sonnet 4.6** | Features/integração, equilíbrio |
| `ads-agent` | **Haiku 4.5** | Interface simples |

**Mecanismo:** trocar o `/model` da sessão no início de cada sprint conforme o agente
líder (o CEO avisa qual ativar). Ver "Modelo líder por sprint" na seção 9.

---

## 3. Arquitetura
Desacoplamento por interface para **toda** integração externa (roteamento, OCR, voz,
pagamento, anúncios) — nenhuma regra de negócio depende de provedor concreto
(`skill-decoupling-interfaces`). Sub-agentes especialistas coordenados por um CEO;
`tests-agent` ao final de cada sprint. Ver `.claude/agents/`.

---

## 4. Modelo de dados (seção 4 do plano)

> **PostGIS**: coordenadas como `geography(Point,4326)`. Todas as datas em `timestamptz`
> (UTC), timezone de exibição derivado do usuário/`America/Sao_Paulo` no início.

- **Usuário**: id, nome, email, senha_hash (nulo se social), provedor_login (email|google|apple), data_cadastro, idioma_preferido, pais.
- **Assinatura**: id, id_usuario, tier (gratuito|pago_1|pago_2|pago_3), status (ativa|atrasada|cancelada), data_inicio, data_proximo_vencimento, provider_usado, limite_creditos_periodo.
- **CarteiraCreditos**: id, id_usuario, saldo_atual, data_ultima_renovacao, origem (renovacao_tier|compra_avulsa).
- **TransacaoCredito**: id, id_usuario, acao (adicionar_ponto_manual|adicionar_ponto_voz|adicionar_ponto_foto|otimizar_rota|reotimizar_rota), creditos_consumidos, data, id_rota (FK nullable).
- **Rota**: id, id_usuario, status (planejamento|em_andamento|concluida|cancelada), data_criacao, data_inicio_execucao, data_fim_execucao, distancia_total_planejada, distancia_total_executada, tempo_total_planejado, tempo_total_executado, modo_offline. **(D5: sem `ponto_inicio`/`ponto_fim` — o app determina a ordem; início=1ª parada, fim=última.)**
- **Parada**: id, id_rota, endereco_texto, latitude, longitude, **ordem_original (D6)**, ordem_otimizada, janela_horario_inicio, janela_horario_fim, prioridade, origem_entrada (manual|foto|voz), status (pendente|concluida|pulada), descricao_pacote.
- **CapturaOCR**: id, id_parada (nullable até confirmação), imagem_referencia, texto_extraido_bruto, endereco_confirmado_pelo_usuario, data_captura. **Regra:** OCR nunca vira Parada automaticamente.
- **RegistroTrajetoGPS**: id, id_rota, latitude, longitude, timestamp. **Regra:** só enquanto `Rota.status=em_andamento`.
- **Anúncio**: id, id_usuario, data_exibicao, tela_exibicao. **Regra:** só para tier gratuito.

✅ **Lacunas de modelagem resolvidas no Sprint 0**: G1 geocoding → D4; G2 início/fim → D5
(app determina a ordem, sem entrada do usuário); G3 → D6 (`ordem_original`); G4 → D7 (Drizzle).
Aberta: G2b (partida = localização do motorista?) no Sprint 6.

---

## 5. Interfaces desacopladas (plugins) — seção 5 do plano
- **GeocodingProvider** (D4): `geocode(enderecoTexto, locale) → {lat,lng,enderecoNormalizado}`. Padrão Nominatim/OSM (todos); premium Google Geocoding (assinantes).
- **RoutingProvider**: `calculateOptimizedRoute`, `recalculateInRealTime`. Padrão OSRM/OSM (todos); premium Google Maps (assinantes), selecionado pelo backend por `tier`.
- **OCRProvider**: `extractText`. Inicial Google Cloud Vision; troca futura possível (Tesseract).
- **VoiceInputProvider**: `transcribe`. Provedor a definir (custo/precisão PT-BR).
- **PaymentProvider**: `createSubscription`, `checkPaymentStatus`, `cancelSubscription`, `purchaseCreditsAvulsos`. Gateway inicial a definir.
- **AdProvider**: `loadAd`, `isEligibleForAds`. Rede a definir; anúncios só no tier gratuito.

> Nota arquitetural (G5): `RoutingProvider` fornece matriz distância/tempo + geometria;
> o **solver VRPTW** (routing-algorithms-agent) resolve a ordem com janelas de horário
> sobre essa matriz. Formalizar a fronteira no Sprint 6.

---

## 6. Sistema de créditos — seção 6 do plano
- Tier gratuito renova semanalmente = **10% do limite do 1º tier pago** (valor absoluto pendente até definir os tiers — Sprint 10).
- Pesos por ação (proposta, ajustável): ponto manual 1 · ponto voz 1 · ponto foto (OCR) 2 · otimização inicial 1 · re-otimização 1 · roteamento premium 0 (incluso no plano).
- Créditos avulsos: preço por crédito **maior** que dentro de um plano (a definir).
- Regra de consumo (G6): débito + ação devem ser **atômicos**; sem saldo, a ação é bloqueada (definir UX no Sprint 9).

---

## 7. Telas (seção 7 do plano)
Login/Cadastro · Nova rota · Adicionar paradas (texto/foto/voz) · Config. de parada ·
Rota otimizada · Execução de rota · Histórico · Analytics · Créditos & assinatura · Configurações.

## 8. Relatórios (seção 8 do plano)
11 relatórios de análise de trajetos executados (distância, pontos, frequências, tempos,
pontualidade, produtividade, re-otimização, consumo de créditos, comparativos período a período).

---

## 9. Decision Log

| # | Decisão | Justificativa |
|---|---|---|
| D1 | Isolamento dev/prod: **containers/bancos separados** (dev = `rota33_postgis_dev`, host 5442; prod definido no Sprint 15). Isolamento de dados **por `id_usuario` na camada de query** (app B2C, **sem RLS**) | Dev e prod compartilham a VPS; app é B2C (não multi-tenant), dispensa RLS. |
| D2 | Trabalhar **apenas local** (`~/Rota33`) até o deploy; infra só com confirmação explícita | Segurança de produção; regra 0.3. |
| D3 | Modelo de IA por agente (matriz 2.1); Fable 5 na UI validado por benchmark | Melhor custo/qualidade por tipo de tarefa. |
| D4 | **GeocodingProvider** desacoplado: Nominatim/OSM (padrão, todos) + Google Geocoding (premium, assinantes) | Endereço→lat/lng é essencial e faltava; espelha o RoutingProvider (G1). |
| D5 | **Início/fim NÃO são definidos pelo usuário** — ele só adiciona pontos; o app determina a ordem completa (1ª parada = início, última = fim). Rota não guarda `ponto_inicio`/`ponto_fim` como entrada | Alinha ao produto: o usuário despeja os pontos e o otimizador ordena tudo (G2). Segue pendência G2b (partida = localização do motorista?) para o Sprint 6. |
| D6 | `Parada.ordem_original` (ordem de inserção) armazenada | Baseline para o relatório "tempo economizado" (8.5 / G3). |
| D7 | ORM = **Drizzle** | TS-first, migrations, DX; PostGIS via SQL bruto quando preciso (G4). |
| D8 | Sessão = **JWT** (access 15min + refresh revogável, cookie httpOnly) | Padrão para mobile+web; revogação via lista de refresh. |
| D9 | Login social via **SocialAuthVerifier** (interface); mock agora, Google/Apple plugáveis por env | Sprint 2 testável sem client IDs; troca sem mexer na lógica. |
| D10 | Envio de e-mail via **EmailProvider** (interface); adapter log/mock agora, SMTP depois | Verificação de e-mail e reset testáveis sem provedor real. |
| D11 | Exclusão de conta (G7) = **anonimizar PII + soft-delete** (`deleted_at`) | Direito LGPD preservando integridade referencial. |

**Modelo líder por sprint:** S0/S1/S2/S6/S13 → Opus · S3-S5/S7-S12/S14-S16 → Sonnet ·
UI (mobile/web) dentro de cada sprint → Fable 5 · ads (S10) → Haiku.

---

## 10. Pendências abertas (o CEO levanta antes do sprint correspondente)

**Do plano (seção 10):** gateway de pagamento (S10) · rede de anúncios (S10) · nomes/limites
dos 3 tiers pagos (S10) · preço dos créditos avulsos (S10) · VoiceInputProvider (S5) · ORM (S1).

**Lacunas de schema — RESOLVIDAS no Sprint 0 (D4-D7):**
- ~~G1 Geocoding~~ → D4 (GeocodingProvider Nominatim + Google).
- ~~G2 ponto_inicio/fim~~ → D5 (sem entrada do usuário; app determina a ordem).
- ~~G3 ordem_original~~ → D6 (coluna em Parada).
- ~~G4 ORM~~ → D7 (Drizzle).

**Ainda abertas (resolver no sprint correspondente):**
- **G2b** (Sprint 6): a rota parte da **localização atual do motorista** (palpite) ou o app
  escolhe livremente o primeiro ponto? Decorrência do D5.
- **G5 Fronteira RoutingProvider × solver VRPTW** — formalizar no Sprint 6.
- **G6 Atomicidade de crédito** (S9) · **G7 direitos LGPD** (S2/S13) · **G8 storage das
  imagens OCR** (S4).

---

## 11. Instrução final por sprint
Ao final de cada sprint: atualizar este `CLAUDE.md` (decisões) e o `README.md` (stack,
setup local, manual de uso). Rodar `tests-agent` → só encerrar com `PASS`.
