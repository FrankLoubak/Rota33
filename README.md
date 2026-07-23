# Rota33 — Elaborador de Rotas

Repositório: [github.com/FrankLoubak/Rota33](https://github.com/FrankLoubak/Rota33)

Aplicativo mobile + web de planejamento de rotas com múltiplas paradas para motoristas de entrega, com otimização automática de trajeto, captura de endereços por foto (OCR) ou voz, e análise de dados dos trajetos executados. Inspirado no [Spoke Route Planner](https://spoke.com/route-planner).

> Status: em desenvolvimento. Consulte `.claude/sprints/` para o progresso atual e `.claude/CLAUDE.md` para decisões técnicas registradas.

---

## Sumário

- [Visão geral](#visão-geral)
- [Stack tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Como rodar localmente](#como-rodar-localmente)
- [Manual do aplicativo](#manual-do-aplicativo)
- [Sistema de créditos e assinatura](#sistema-de-créditos-e-assinatura)
- [Desenvolvimento com Claude Code](#desenvolvimento-com-claude-code)
- [Pendências conhecidas](#pendências-conhecidas)
- [Licença](#licença)

---

## Visão geral

- Rota com ponto de início, ponto de fim, e paradas intermediárias com janela de horário e prioridade.
- Otimização automática da ordem das paradas, com re-otimização em tempo real durante o trajeto.
- Adição de parada por texto manual, foto (OCR do endereço, com confirmação obrigatória do usuário) ou voz.
- Navegação real delegada a apps externos (Google Maps, Waze, Apple Maps) — o app não possui motor de navegação turn-by-turn próprio.
- Planejamento de rota funciona offline (modo rascunho local, sincronizado quando a conexão retornar).
- Registro de rotas efetuadas via tracking de localização em segundo plano (ativo somente durante a execução da rota) e painel de análise de dados dos trajetos.
- Lançamento com foco inicial em português do Brasil; arquitetura preparada desde o início para expansão internacional.

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Mobile | React Native + Expo |
| Web | React + TypeScript + Vite |
| Backend | Node.js + Express |
| Banco de dados | PostgreSQL + PostGIS (dados geoespaciais) |
| Roteamento (padrão) | OSRM + OpenStreetMap (self-hosted, sem trânsito ao vivo) |
| Roteamento (premium/assinantes) | Google Maps Platform (trânsito ao vivo) |
| OCR de endereço | Google Cloud Vision (TEXT_DETECTION) |
| Reconhecimento de voz | A definir (`ocr-voice-agent`, ver `.claude/CLAUDE.md`) |
| Pagamento | Modular — Stripe, PayPal, Mercado Pago ou outro, via interface `PaymentProvider` |
| Anúncios | Modular via interface `AdProvider` (rede a definir) |
| ORM/query builder | A definir pelo `database-agent`, documentado em `.claude/CLAUDE.md` |

## Arquitetura

O projeto segue o princípio de **desacoplamento por interface** para toda integração externa: nenhuma regra de negócio depende diretamente de um provedor concreto (roteamento, OCR, pagamento, anúncios). As interfaces principais são:

- `RoutingProvider` — cálculo e otimização de rota. Implementação padrão (OSRM) para todos os usuários; implementação premium (Google Maps, com trânsito ao vivo) selecionada automaticamente para usuários assinantes.
- `OCRProvider` — extração de texto de imagem para endereços fotografados.
- `VoiceInputProvider` — transcrição de áudio para entrada de parada por voz.
- `PaymentProvider` — cobrança de assinatura e compra de créditos avulsos, agnóstico de gateway.
- `AdProvider` — exibição de anúncios, restrita ao tier gratuito.

O desenvolvimento é conduzido por uma arquitetura de sub-agentes especializados (frontend mobile, frontend web, backend, algoritmos de roteamento, OCR/voz, banco de dados, segurança, pagamentos, anúncios, analytics) coordenados por um agente CEO, com um agente de testes executado ao final de cada sprint. Detalhes completos em `.claude/agents/`.

## Estrutura do repositório

```
.
├── .claude/
│   ├── CLAUDE.md          # contexto e decisões técnicas do projeto
│   ├── agents/             # definição de cada sub-agente especialista
│   ├── skills/              # skills reutilizáveis (padrão de comentário, desacoplamento, etc.)
│   └── sprints/             # escopo e status de cada sprint
├── mobile/                  # app React Native + Expo
├── web/                     # app React + TypeScript + Vite
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── providers/        # implementações de RoutingProvider, OCRProvider, PaymentProvider, AdProvider
│   │   ├── routes/            # endpoints da API
│   │   ├── models/            # modelo de dados (seção "Modelo de dados" do plano)
│   │   └── services/          # regras de negócio
│   └── migrations/
└── README.md
```

## Infraestrutura

- **Hospedagem e desenvolvimento**: VPS Hostinger (gerenciada via EasyPanel). O Claude Code roda diretamente nessa VPS — não há ambiente de desenvolvimento separado do de produção, por isso o projeto usa containers/bancos de dados logicamente separados para "dev" e "produção" dentro da mesma VPS.
- **DNS/CDN/proxy**: Cloudflare.
- **Acesso à VPS**: exclusivamente via chave SSH. Nenhuma credencial deve ser versionada no repositório — usar variáveis de ambiente e o gerenciador de segredos do EasyPanel.

## Como rodar localmente

> Pré-requisitos: Node.js LTS, PostgreSQL com extensão PostGIS habilitada, Expo CLI (para mobile).

```bash
# clonar o repositório
git clone https://github.com/FrankLoubak/Rota33.git
cd Rota33

# backend
cd backend
cp .env.example .env   # preencher variáveis (banco de dados, chaves de API dos providers)
npm install
npm run migrate
npm run dev

# web
cd ../web
npm install
npm run dev

# mobile
cd ../mobile
npm install
npx expo start
```

Variáveis de ambiente necessárias (backend) incluem, no mínimo: string de conexão PostgreSQL, credenciais do provedor de OCR, credenciais do(s) provedor(es) de pagamento configurado(s), chave da API de mapas premium, segredo de sessão/JWT. Consulte `backend/.env.example` para a lista completa e atualizada.

## Manual do aplicativo

### Cadastro e login
Cadastro por e-mail/senha ou login social (Google, Apple). Após o login, o usuário acessa o painel principal.

### Criar uma rota
1. Definir o ponto de início e o ponto de fim do trajeto.
2. Adicionar paradas intermediárias:
   - **Manual**: digitar o endereço.
   - **Foto**: fotografar o local onde o endereço aparece (etiqueta, placa, documento); o texto é extraído automaticamente e **precisa ser confirmado ou corrigido** pelo usuário antes de virar uma parada válida.
   - **Voz**: ditar o endereço.
3. Opcionalmente, definir janela de horário e prioridade para cada parada.
4. Solicitar a otimização — o app calcula automaticamente a ordem mais eficiente das paradas.

### Executar a rota
Ao iniciar a execução, o app ativa o rastreamento de localização em segundo plano (somente enquanto a rota estiver em andamento) para registrar o trajeto real. É possível marcar paradas como concluídas ou puladas, e solicitar re-otimização a qualquer momento durante o trajeto. A navegação turn-by-turn é feita abrindo o app de navegação externo preferido do usuário.

### Modo offline
Rotas e paradas podem ser criadas sem conexão à internet; ficam salvas como rascunho local e são sincronizadas — com cálculo de rota e otimização — assim que a conexão for restabelecida.

### Histórico e análise de dados
O painel de analytics mostra: distância percorrida, paradas visitadas, rotas/pontos mais frequentes, tempo total gasto, tempo economizado estimado pela otimização, taxa de pontualidade nas janelas de horário, tempo médio por parada, picos de produtividade, frequência de re-otimização, histórico de consumo de créditos e comparativos entre períodos.

## Sistema de créditos e assinatura

- **Tier gratuito**: acesso com exibição de anúncios e renovação semanal de créditos (equivalente a 10% do limite de créditos do primeiro tier pago).
- **Tiers pagos (3 níveis)**: sem anúncios, limite de créditos maior por período — nomes e limites exatos a serem definidos (ver Pendências).
- **Créditos avulsos**: podem ser comprados independentemente da assinatura, a um custo por crédito mais alto que o equivalente dentro de um plano pago.
- **Consumo de créditos por ação** (proposta inicial, ajustável — ver `.claude/CLAUDE.md` para o valor vigente):

| Ação | Créditos |
|---|---|
| Adicionar parada manualmente | 1 |
| Adicionar parada por voz | 1 |
| Adicionar parada por foto (OCR) | 2 |
| Otimização inicial da rota | 1 |
| Re-otimização em tempo real (por chamada) | 1 |
| Roteamento com trânsito ao vivo (assinantes) | 0 (incluso no plano) |

## Desenvolvimento com Claude Code

Este repositório é desenvolvido com o Claude Code seguindo a arquitetura de sub-agentes descrita em `.claude/`. Todo script deve conter um comentário de cabeçalho padronizado (finalidade, funcionamento, relação com outros componentes — ver `.claude/skills/skill-commenting-standard.md`). Nenhuma integração externa deve ser chamada diretamente pela lógica de negócio — sempre através das interfaces desacopladas descritas em `.claude/skills/skill-decoupling-interfaces.md`.

Cada sprint só é considerado concluído após veredito `PASS` do agente de testes. O progresso de cada sprint está documentado em `.claude/sprints/`.

## Pendências conhecidas

- Gateway de pagamento inicial (Stripe, PayPal ou Mercado Pago) ainda não definido.
- Rede de anúncios ainda não definida.
- Nomes e limites de crédito dos 3 tiers pagos ainda não definidos (impacta o valor absoluto de créditos semanais do tier gratuito).
- Preço dos créditos avulsos ainda não definido.
- Provedor de reconhecimento de voz (`VoiceInputProvider`) ainda não definido.
- ORM/query builder do banco de dados ainda não definido.

Essas decisões estão sinalizadas como bloqueios explícitos antes dos sprints correspondentes no plano de desenvolvimento do projeto.

## Publicação nas lojas de aplicativos

O passo a passo completo de abertura de conta e publicação na Apple App Store e no Google Play Store está documentado na seção 12 do plano de desenvolvimento (`Sprint 16`, executado após o deploy em produção estar estável).

## Licença

A definir.
