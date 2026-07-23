# Plano de Desenvolvimento — Elaborador de Rotas (inspirado no Spoke Route Planner)

> **Como usar este arquivo**: cole como instrução inicial para o Claude Code no repositório do projeto. O Claude Code deve executar a seção "0. Setup" primeiro, criando `.claude/`, e só então avançar para o Sprint 1.

**Repositório**: [github.com/FrankLoubak/Rota33](https://github.com/FrankLoubak/Rota33)

---

## 0. Setup inicial obrigatório

1. Criar `.claude/CLAUDE.md`, `.claude/agents/`, `.claude/skills/`, `.claude/sprints/`.
2. Popular `.claude/CLAUDE.md` com o conteúdo das seções 1, 1.1, 4, 5, 6 deste documento.
3. **Regra permanente de operação**: nenhum agente deve preencher lacunas de especificação com suposições. Toda ambiguidade, contradição ou informação faltante não coberta neste documento deve interromper a execução e gerar uma pergunta objetiva ao usuário, formulada pelo agente CEO. Decisões puramente técnicas de implementação (nome de variável, escolha de biblioteca auxiliar dentro do já definido) podem ser tomadas pelos sub-agentes sem essa interrupção.
4. **Acesso à VPS desde o início**: o ambiente de desenvolvimento roda na própria VPS de produção (ver seção 1.1). Antes de executar qualquer comando fora do diretório local do repositório, ou de configurar qualquer serviço (banco de dados, EasyPanel, containers, DNS via Cloudflare), o Claude Code deve **solicitar explicitamente ao usuário acesso via chave SSH** à VPS — nunca presumir que já possui acesso, nunca solicitar ou manusear senha em texto puro, e nunca prosseguir com comandos que alterem configuração de produção sem confirmação explícita do usuário para aquela ação específica. Essa solicitação de acesso deve ocorrer já no Sprint 0, mesmo que o ambiente de produção só vá ser efetivamente utilizado nos sprints finais.

---

## 1. Visão geral do produto

Aplicativo mobile + web de planejamento de rotas com múltiplas paradas, voltado primariamente a **motoristas de entrega**, inspirado no Spoke Route Planner.

- Rota com ponto de início, ponto de fim, e paradas intermediárias.
- Paradas podem ter janela de horário e prioridade/urgência.
- O app **otimiza automaticamente** a ordem das paradas (problema de roteamento, não é o usuário quem define a ordem).
- Paradas podem ser adicionadas por texto manual, foto (OCR do endereço) ou voz.
- Navegação real (turn-by-turn) é delegada a apps externos (Google Maps/Waze/Apple Maps) — o app não constrói motor de navegação próprio, seguindo o modelo do Spoke.
- Re-otimização em tempo real durante o trajeto.
- Registro de rotas efetuadas (via tracking de localização em segundo plano, ativo apenas durante execução de rota) e análise de dados sobre elas.
- Monetização: 1 tier gratuito com anúncios + 3 tiers pagos por assinatura, cada um com limite de créditos; créditos avulsos também disponíveis, a um custo mais alto que o equivalente via assinatura.
- Lançamento: foco inicial em português do Brasil, com arquitetura pronta para expansão internacional (idiomas e países) em fase posterior, validada primeiro no mercado brasileiro.
- Planejamento de rota deve funcionar offline (modo rascunho local, sincronizado quando a conexão retornar).

### 1.1 Infraestrutura

- **Repositório de código**: GitHub — [github.com/FrankLoubak/Rota33](https://github.com/FrankLoubak/Rota33).
- **Ambiente de desenvolvimento e hospedagem**: a mesma VPS Hostinger (IP `187.77.255.90`), gerenciada via EasyPanel. O Claude Code roda diretamente nessa VPS — não há separação entre ambiente de desenvolvimento e ambiente de produção neste projeto, o que exige disciplina extra de branches/ambientes lógicos (ex.: containers ou bancos de dados separados para "dev" e "produção" dentro da mesma VPS), a ser definida pelo `database-agent`/`backend-agent` no Sprint 0.
- **DNS/CDN/proxy**: Cloudflare (conta já existente do usuário).
- **Acesso**: exclusivamente via chave SSH, solicitada explicitamente pelo Claude Code (ver regra 4 da seção 0). Nenhuma credencial deve ser gravada em texto puro no repositório — usar variáveis de ambiente e, quando aplicável, o gerenciador de segredos do EasyPanel.

---

## 2. Arquitetura de sub-agentes (Claude Code)

### 2.1 Agente CEO
Interpreta o sprint corrente, distribui tarefas, valida entregas, interrompe e pergunta ao usuário sempre que houver ambiguidade. Aciona o Agente de Testes ao final de cada sprint. Mantém `.claude/CLAUDE.md` atualizado.

### 2.2 Sub-agentes especialistas

| Agente | Escopo |
|---|---|
| `mobile-agent` | App mobile (React Native + Expo — padrão já usado em outros projetos do usuário). Telas, câmera, microfone, GPS, tracking em segundo plano, modo offline local. |
| `web-agent` | Versão web (React + TypeScript + Vite), com paridade de funcionalidades de planejamento (exceto o que depender de hardware mobile, como câmera/GPS contínuo). |
| `backend-agent` | Node.js + Express. API REST, orquestração das interfaces desacopladas (`RoutingProvider`, `OCRProvider`, `PaymentProvider`, `AdProvider`), lógica de créditos e assinatura. |
| `routing-algorithms-agent` | Algoritmo de otimização de rota (problema do caixeiro-viajante com janelas de horário — VRPTW). Decide a biblioteca/solver (ex.: OR-Tools, já usado no projeto Route Optimizer do usuário) — decisão técnica documentada no `CLAUDE.md`. |
| `ocr-voice-agent` | Integração com `OCRProvider` (Google Cloud Vision inicialmente) e com serviço de reconhecimento de voz para entrada de paradas por voz. |
| `database-agent` | PostgreSQL + PostGIS (dados geoespaciais). Decide ORM/query builder, documentando a escolha. |
| `cybersecurity-agent` | Autenticação (e-mail/senha + login social), proteção de dados de localização (sensíveis por natureza), rate limiting, gestão de sessão/token, conformidade com LGPD (Brasil) e GDPR (dado o escopo internacional futuro). |
| `payments-agent` | Interface `PaymentProvider` modular (Stripe, PayPal, Mercado Pago, outros). |
| `ads-agent` | Interface `AdProvider` modular, exibição de anúncios restrita ao tier gratuito. |
| `analytics-agent` | Relatórios de análise de trajetos executados (seção 8). |
| `tests-agent` | Executado ao final de **cada sprint**. Reporta veredito `PASS`/`FAIL` ao CEO. Sprint só é encerrado com `PASS`. |

---

## 3. Skills do projeto (`.claude/skills/`)

- `skill-commenting-standard.md`: todo arquivo de código deve iniciar com comentário de cabeçalho contendo finalidade, funcionamento (resumo do "como faz") e relação com outros componentes do sistema.
- `skill-decoupling-interfaces.md`: padrão obrigatório para toda integração externa (roteamento, OCR, pagamento, anúncios) — sempre implementada atrás de uma interface, nunca chamada diretamente pela lógica de negócio. Nenhuma regra de negócio deve depender do provedor concreto.
- `skill-credit-system.md`: documentação da tabela de pesos de crédito por ação (seção 6.2) e das regras de consumo/renovação.
- `skill-offline-first.md`: padrão de armazenamento local (rascunho) + fila de sincronização quando a conexão voltar, usado por qualquer tela que precise funcionar offline.
- `skill-i18n-ready.md`: toda string de interface e todo parser de endereço devem ser escritos de forma desacoplada do idioma/país desde o Sprint 1, mesmo que o conteúdo inicial seja só PT-BR — para permitir expansão internacional sem retrabalho estrutural.

---

## 4. Modelo de dados consolidado

### 4.1 Usuário
- `id`, `nome`, `email`, `senha_hash` (nulo se login social), `provedor_login` (email | google | apple), `data_cadastro`, `idioma_preferido`, `pais`.

### 4.2 Assinatura
- `id`, `id_usuario`, `tier` (gratuito | pago_1 | pago_2 | pago_3 — nomes/diferenciação a definir no sprint de monetização), `status` (ativa | atrasada | cancelada), `data_inicio`, `data_proximo_vencimento`, `provider_usado` (Stripe/PayPal/Mercado Pago/outro), `limite_creditos_periodo`.

### 4.3 CarteiraCreditos
- `id`, `id_usuario`, `saldo_atual`, `data_ultima_renovacao`, `origem` (renovação semanal do tier | compra avulsa).

### 4.4 TransacaoCredito
- `id`, `id_usuario`, `acao` (adicionar_ponto_manual | adicionar_ponto_voz | adicionar_ponto_foto | otimizar_rota | reotimizar_rota), `creditos_consumidos`, `data`, `id_rota` (FK, quando aplicável).

### 4.5 Rota
- `id`, `id_usuario`, `ponto_inicio`, `ponto_fim`, `status` (planejamento | em_andamento | concluida | cancelada), `data_criacao`, `data_inicio_execucao`, `data_fim_execucao`, `distancia_total_planejada`, `distancia_total_executada`, `tempo_total_planejado`, `tempo_total_executado`, `modo_offline` (booleano — indica se foi criada como rascunho local antes de sincronizar).

### 4.6 Parada (waypoint)
- `id`, `id_rota`, `endereco_texto`, `latitude`, `longitude`, `ordem_otimizada`, `janela_horario_inicio`, `janela_horario_fim`, `prioridade` (booleano/nível), `origem_entrada` (manual | foto | voz), `status` (pendente | concluida | pulada), `descricao_pacote` (opcional, se relevante ao caso de uso de entrega).

### 4.7 CapturaOCR
- `id`, `id_parada` (nullable até confirmação), `imagem_referencia` (referência ao armazenamento, não a imagem em si), `texto_extraido_bruto`, `endereco_confirmado_pelo_usuario` (booleano), `data_captura`.
- Regra: o endereço extraído por OCR **nunca** vira uma `Parada` automaticamente — sempre exige confirmação/edição do usuário antes.

### 4.8 RegistroTrajetoGPS
- `id`, `id_rota`, `latitude`, `longitude`, `timestamp`.
- Regra: tracking em segundo plano ativo **somente** enquanto `Rota.status = em_andamento`.

### 4.9 Anúncio (metadados de exibição, não o conteúdo do anúncio em si)
- `id`, `id_usuario`, `data_exibicao`, `tela_exibicao`.
- Regra: só é populado para usuários com `Assinatura.tier = gratuito`.

---

## 5. Interfaces desacopladas (arquitetura de plugins)

### 5.1 `RoutingProvider`
```
interface RoutingProvider {
  calculateOptimizedRoute(pontos: Ponto[], restricoes: JanelasHorario[]): Promise<RotaOtimizada>
  recalculateInRealTime(rotaAtual, novaCondicao): Promise<RotaOtimizada>
}
```
- **Implementação padrão (todos os usuários)**: OSRM + OpenStreetMap self-hosted — gratuito, sem dados de trânsito ao vivo, otimização por distância/tempo estático.
- **Implementação premium (usuários assinantes)**: Google Maps Platform — trânsito ao vivo, maior precisão de tempo real.
- A seleção da implementação é feita pelo `backend-agent` com base no `tier` da assinatura do usuário, de forma transparente para o restante do sistema.

### 5.2 `OCRProvider`
```
interface OCRProvider {
  extractText(imagem): Promise<TextoExtraido>
}
```
- **Implementação inicial**: Google Cloud Vision (TEXT_DETECTION), com custo aproximado de US$1,50 por 1.000 imagens após as primeiras 1.000 gratuitas por mês — valor sujeito a confirmação na documentação oficial atualizada antes de fechar orçamento, e absorvido pelo próprio consumo de créditos do usuário.
- Interface desacoplada para permitir troca futura por solução self-hosted (Tesseract) se o volume de uso justificar.

### 5.3 `VoiceInputProvider`
```
interface VoiceInputProvider {
  transcribe(audio): Promise<TextoTranscrito>
}
```
- Provedor a ser definido pelo `ocr-voice-agent` com base em custo/precisão para PT-BR — documentar a escolha no `CLAUDE.md` quando decidida.

### 5.4 `PaymentProvider`
```
interface PaymentProvider {
  createSubscription(userId, tier, periodicidade): Promise<Assinatura>
  checkPaymentStatus(userId): Promise<'regular' | 'atrasado'>
  cancelSubscription(userId): Promise<void>
  purchaseCreditsAvulsos(userId, quantidade): Promise<TransacaoCredito>
}
```
- **Pendência aberta**: qual gateway implementar primeiro (Stripe, PayPal, Mercado Pago) não foi definida. O agente CEO deve perguntar ao usuário antes do sprint de monetização.

### 5.5 `AdProvider`
```
interface AdProvider {
  loadAd(tela): Promise<AnuncioResult>
  isEligibleForAds(userId): Promise<boolean>
}
```
- **Pendência aberta**: rede de anúncios (AdMob, Meta Audience Network, outra) não foi definida. O agente CEO deve perguntar ao usuário antes do sprint de monetização/anúncios.

---

## 6. Sistema de créditos (proposta — sujeita a ajuste do usuário)

### 6.1 Renovação do tier gratuito
- Créditos semanais do tier gratuito = 10% do limite de créditos do primeiro tier pago.
- **Pendência**: o valor absoluto só pode ser calculado quando os limites de crédito dos 3 tiers pagos forem definidos (ver seção 9, Sprint de Monetização).

### 6.2 Peso de créditos por ação (proposta inicial, ajustável)

| Ação | Créditos |
|---|---|
| Adicionar ponto manualmente (texto) | 1 |
| Adicionar ponto por voz | 1 |
| Adicionar ponto por foto (OCR) | 2 |
| Otimização inicial da rota | 1 |
| Re-otimização em tempo real (por chamada) | 1 |
| Roteamento com trânsito ao vivo (Google Maps) | 0 — não consome crédito; exclusivo de assinante, incluso no plano |

### 6.3 Créditos avulsos
- Disponíveis para compra independente de assinatura, a um preço por crédito **mais alto** que o custo efetivo por crédito dentro de qualquer plano de assinatura — para estimular conversão à assinatura. Valor exato a ser definido no sprint de monetização.

---

## 7. Telas (mobile + web, com paridade de funcionalidade onde aplicável)

1. **Login/Cadastro**: e-mail/senha, Google Sign-In, Apple Sign-In (obrigatório se houver login social em app iOS).
2. **Nova rota**: definir ponto de início e fim.
3. **Adicionar paradas**: manual (texto), foto (captura + confirmação do endereço extraído por OCR), voz.
4. **Configuração de parada**: janela de horário, prioridade, descrição de pacote (opcional).
5. **Rota otimizada**: visualização do trajeto otimizado, botão para abrir no app de navegação externo preferido.
6. **Execução de rota**: marcar paradas como concluídas/puladas, re-otimizar durante o trajeto, tracking em segundo plano ativo.
7. **Histórico de rotas**: rotas concluídas, com dados de distância/tempo executado.
8. **Painel de analytics**: relatórios da seção 8.
9. **Créditos e assinatura**: saldo de créditos, histórico de consumo, upgrade de plano, compra de créditos avulsos.
10. **Configurações**: idioma, preferências de notificação, gestão de conta.

---

## 8. Relatórios de análise de dados (rotas executadas)

Confirmados pelo usuário + sugestões aceitas:

1. Distância total percorrida (por período).
2. Pontos/paradas visitados.
3. Rotas e pontos mais frequentes.
4. Tempo total gasto em rotas.
5. Tempo economizado estimado (rota otimizada vs. ordem não-otimizada original).
6. Taxa de pontualidade (% de paradas cumpridas dentro da janela de horário).
7. Tempo médio por parada e distância média entre paradas.
8. Picos de produtividade (dias/horários com mais entregas concluídas).
9. Frequência de re-otimização por rota.
10. Histórico de consumo de créditos por período.
11. Comparativo período a período (semana vs. semana, mês vs. mês).

---

## 9. Divisão em Sprints

> Cada sprint termina com execução obrigatória do `tests-agent` e veredito PASS/FAIL antes de avançar.

- **Sprint 0**: Setup do repositório (`github.com/FrankLoubak/Rota33`), `.claude/`, estrutura mobile + web + backend, banco de dados PostgreSQL/PostGIS, solicitação de acesso SSH à VPS (seção 1.1).
- **Sprint 1**: Modelo de dados completo (seção 4) + migrations.
- **Sprint 2**: Autenticação (e-mail/senha + Google/Apple Sign-In) + gestão de sessão.
- **Sprint 3**: CRUD de Rota e Parada — criação manual de paradas, definição de início/fim, janelas de horário, prioridade.
- **Sprint 4**: Integração `OCRProvider` (Google Cloud Vision) — captura de foto, extração de texto, tela de confirmação/edição do endereço.
- **Sprint 5**: Integração `VoiceInputProvider` — entrada de parada por voz.
- **Sprint 6**: Integração `RoutingProvider` — otimização inicial da rota (OSRM/OSM), com abstração pronta para o provedor premium.
- **Sprint 7**: Re-otimização em tempo real + tela de execução de rota + tracking em segundo plano (`RegistroTrajetoGPS`).
- **Sprint 8**: Modo offline (rascunho local + fila de sincronização).
- **Sprint 9**: Sistema de créditos (`CarteiraCreditos`, `TransacaoCredito`) aplicando a tabela de pesos da seção 6.2.
- **Sprint 10**: Monetização — **requer que o usuário defina previamente**: gateway de pagamento inicial, rede de anúncios, nomes/limites dos 3 tiers pagos, valor absoluto dos créditos semanais gratuitos, preço dos créditos avulsos. Implementação de `PaymentProvider` e `AdProvider`.
- **Sprint 11**: `RoutingProvider` premium (Google Maps Platform com trânsito ao vivo) para usuários assinantes.
- **Sprint 12**: Painel de analytics (seção 8).
- **Sprint 13**: Segurança e conformidade (`cybersecurity-agent`) — proteção de dados de localização, LGPD/GDPR, hardening geral.
- **Sprint 14**: Testes end-to-end completos, preparação para deploy.
- **Sprint 15**: Deploy em produção na VPS Hostinger via EasyPanel (backend + web), configuração de domínio/DNS/proxy no Cloudflare.
- **Sprint 16**: Publicação nos aplicativos móveis nas lojas — Apple App Store e Google Play Store (passo a passo completo na seção 12). Só se inicia após o Sprint 15 estar com veredito `PASS` e o backend de produção estável, já que os apps móveis dependem da API em produção para revisão das lojas.

---

## 10. Pendências que o agente CEO deve levantar com o usuário antes dos sprints correspondentes

- Gateway de pagamento inicial (Sprint 10).
- Rede de anúncios (Sprint 10).
- Nomes e limites de crédito dos 3 tiers pagos (Sprint 10) — necessário também para calcular o valor absoluto de créditos semanais do tier gratuito.
- Preço dos créditos avulsos (Sprint 10).
- Provedor de `VoiceInputProvider` (Sprint 5) — decisão técnica do `ocr-voice-agent`, mas deve ser documentada e validada com o usuário dado o impacto de custo.
- ORM/query builder do banco de dados — decisão do `database-agent`, documentar assim que definida.

---

## 11. Instrução final para o Claude Code

Ao final de cada sprint, atualizar `.claude/CLAUDE.md` com decisões técnicas tomadas, e manter um `README.md` no repositório contendo: stack utilizada, instruções de setup local, e manual de uso do aplicativo.

Não avançar para o próximo sprint sem veredito `PASS` do `tests-agent` e sem confirmação do agente CEO de que não há pendências de esclarecimento em aberto para aquele sprint.

---

## 12. Passo a passo — publicação nas lojas de aplicativos (Sprint 16)

> Esta seção é um guia operacional para o **usuário** (algumas etapas exigem dados pessoais/de empresa, cartão de crédito e verificação de identidade, que o Claude Code não pode realizar sozinho). O Claude Code é responsável por preparar os artefatos técnicos (build assinado, metadados, ícones, screenshots); a abertura de conta e o envio final para revisão são ações do usuário nos respectivos consoles. Não tenho certeza se os requisitos de documentação (CNPJ vs. CPF, taxas exatas) mudaram desde meu conhecimento mais recente — recomendo confirmar os valores e documentos exigidos diretamente nos links oficiais abaixo antes de iniciar, pois políticas de cadastro das lojas mudam com frequência.

### 12.1 Apple App Store

1. **Criar Apple ID** (se ainda não tiver uma dedicada ao projeto/empresa) em [appleid.apple.com](https://appleid.apple.com).
2. **Inscrever-se no Apple Developer Program** em [developer.apple.com/programs](https://developer.apple.com/programs/enroll/) — taxa anual cobrada (valor a confirmar no momento da inscrição, pois pode variar por região/câmbio). É possível se inscrever como pessoa física ou como organização (organização exige D-U-N-S Number, documentação de CNPJ e permite usar o nome da empresa na loja).
3. **Aguardar aprovação da conta** — pode levar de 1 a alguns dias úteis, especialmente se for conta de organização (verificação de CNPJ/D-U-N-S).
4. **Configurar o App Store Connect** ([appstoreconnect.apple.com](https://appstoreconnect.apple.com)): criar o registro do novo app, definir nome, bundle ID (ex.: `com.rota33.app`), categoria, e preencher a Política de Privacidade (obrigatória, especialmente pelo uso de localização em segundo plano — ver seção 4.8/regra de tracking).
5. **Gerar certificados e provisioning profiles** via Xcode/Apple Developer, necessários para assinar o build do app (o `mobile-agent` deve gerar o build de produção do Expo/React Native compatível).
6. **Preencher a ficha da loja**: descrição, screenshots (em todos os tamanhos de tela exigidos), ícone, categoria, classificação etária, palavras-chave.
7. **Declarar uso de dados sensíveis**: a Apple exige declaração explícita do uso de localização em segundo plano (App Privacy details) — justificar como necessário para o registro do trajeto durante a execução da rota.
8. **Enviar para revisão** (App Review) — prazo de revisão varia (normalmente de 1 a alguns dias). Rejeições comuns nesse tipo de app: falta de justificativa clara para uso de localização em segundo plano, ou app sem funcionalidade completa/testável pelo revisor — garantir uma conta de teste funcional para o revisor da Apple.
9. **Publicação**: após aprovação, liberar manualmente ou automaticamente (conforme configuração escolhida no App Store Connect).

### 12.2 Google Play Store

1. **Criar uma Conta Google** dedicada ao projeto/empresa, se ainda não tiver.
2. **Inscrever-se no Google Play Console** em [play.google.com/console/signup](https://play.google.com/console/signup) — taxa única de registro (valor a confirmar no momento, pois pode ter mudado desde meu conhecimento mais recente). É possível se registrar como desenvolvedor individual ou como organização.
3. **Verificação de identidade**: o Google pode exigir verificação de identidade e/ou documentos da empresa, dependendo do tipo de conta.
4. **Criar o app no Play Console**: nome, idioma padrão, tipo (app ou jogo), gratuito ou pago (aqui, gratuito com compras/assinaturas dentro do app).
5. **Configurar a Ficha da Play Store**: descrição curta e longa, ícone, imagem de destaque, screenshots, categoria, classificação de conteúdo (questionário de classificação etária).
6. **Política de Privacidade**: obrigatória, com URL pública — deve declarar explicitamente a coleta de localização em segundo plano.
7. **Declaração de uso de localização em segundo plano**: o Google Play tem uma política específica (Background Location) que exige justificativa e, em alguns casos, um vídeo demonstrando o uso dessa permissão — preparar esse material com base na funcionalidade de tracking da seção 4.8.
8. **Gerar o build assinado** (Android App Bundle — `.aab`), configurado pelo `mobile-agent` a partir do build de produção do Expo/React Native, e assinado com a chave de assinatura do app (Google Play App Signing recomendado).
9. **Configurar faixas de teste** (internal testing → closed testing → open testing) antes da produção — recomendável para validar o fluxo de compra/assinatura antes do lançamento público.
10. **Enviar para revisão de produção** — prazo de revisão do Google costuma ser mais rápido que o da Apple, mas também varia.
11. **Publicação**: liberar o lançamento gradual (staged rollout) ou total, conforme preferência.

### 12.3 Considerações comuns às duas lojas

- **Compras/assinaturas dentro do app**: caso a assinatura/créditos avulsos sejam vendidos dentro do app mobile (não apenas via web), tanto a Apple quanto o Google exigem o uso dos respectivos sistemas de compra in-app (Apple In-App Purchase / Google Play Billing) para conteúdo digital consumido dentro do app — isso é uma política das lojas, não uma escolha de arquitetura, e pode exigir uma camada adicional na interface `PaymentProvider` (seção 5.4) específica para compras mobile, além dos gateways externos (Stripe/PayPal/Mercado Pago) usados na versão web. **Recomendo validar esse ponto com a documentação oficial atualizada antes do Sprint 10**, pois pode mudar significativamente o desenho da monetização mobile.
- **Contas de teste para revisores**: preparar credenciais de acesso de demonstração para os revisores de ambas as lojas conseguirem testar o fluxo completo do app.
- **Consistência de metadados**: nome do app, ícone e descrição devem ser preparados de forma consistente entre as duas lojas, mas cada uma tem seus próprios requisitos de tamanho de imagem — conferir as especificações técnicas atualizadas de cada loja antes de gerar os artefatos finais.
