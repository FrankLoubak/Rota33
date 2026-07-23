/**
 * Finalidade: schema Drizzle das entidades do Rota33 (CLAUDE.md seção 4).
 * Como funciona: tabelas com PK uuid, timestamps e (onde há coordenada) latitude/longitude.
 *   A coluna geográfica PostGIS `geog geography(Point,4326)` é adicionada por migration
 *   manual (0001) como coluna GERADA a partir de lat/lng, com índice GiST — o Drizzle não
 *   modela geography nativamente (D7: PostGIS via SQL bruto).
 * Relações: usa enums.ts; consumido por client/migrate/seed e pelos serviços (Sprint 2+).
 * Notas: D5 (Rota sem ponto_inicio/fim — o app determina a ordem); D6 (Parada.ordem_original).
 *   App B2C — isolamento por id_usuario na camada de query (sem RLS).
 */
import {
  boolean,
  doublePrecision,
  integer,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  assinaturaStatusEnum,
  assinaturaTierEnum,
  carteiraOrigemEnum,
  emailTokenTipoEnum,
  paradaOrigemEnum,
  paradaStatusEnum,
  prioridadeEnum,
  provedorLoginEnum,
  rotaStatusEnum,
  transacaoAcaoEnum,
} from "./enums";

const pk = () => uuid("id").primaryKey().defaultRandom();
const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Usuário ──────────────────────────────────────────────────────────────────
export const usuarios = pgTable("usuarios", {
  id: pk(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash"), // nulo se login social
  provedorLogin: provedorLoginEnum("provedor_login").notNull().default("email"),
  emailVerificado: boolean("email_verificado").notNull().default(false),
  dataCadastro: timestamp("data_cadastro", { withTimezone: true }).notNull().defaultNow(),
  idiomaPreferido: text("idioma_preferido").notNull().default("pt-BR"),
  pais: text("pais").notNull().default("BR"),
  ...timestamps(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }), // exclusão/anonimização (G7, D11)
});

// ── Refresh tokens (sessão JWT — D8) ─────────────────────────────────────────
export const refreshTokens = pgTable("refresh_tokens", {
  id: pk(),
  idUsuario: uuid("id_usuario").notNull().references(() => usuarios.id),
  tokenHash: text("token_hash").notNull(), // hash do refresh token (nunca em claro)
  claims: text("claims"), // snapshot json das claims (re-emissão no /refresh)
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Email tokens (verificação de e-mail e reset de senha — D10) ──────────────
export const emailTokens = pgTable("email_tokens", {
  id: pk(),
  idUsuario: uuid("id_usuario").notNull().references(() => usuarios.id),
  tipo: emailTokenTipoEnum("tipo").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Assinatura ───────────────────────────────────────────────────────────────
export const assinaturas = pgTable("assinaturas", {
  id: pk(),
  idUsuario: uuid("id_usuario").notNull().references(() => usuarios.id),
  tier: assinaturaTierEnum("tier").notNull().default("gratuito"),
  status: assinaturaStatusEnum("status").notNull().default("ativa"),
  dataInicio: timestamp("data_inicio", { withTimezone: true }).notNull().defaultNow(),
  dataProximoVencimento: timestamp("data_proximo_vencimento", { withTimezone: true }),
  providerUsado: text("provider_usado"),
  limiteCreditosPeriodo: integer("limite_creditos_periodo").notNull().default(0),
  ...timestamps(),
});

// ── Carteira de créditos ─────────────────────────────────────────────────────
export const carteirasCreditos = pgTable("carteiras_creditos", {
  id: pk(),
  idUsuario: uuid("id_usuario").notNull().references(() => usuarios.id).unique(),
  saldoAtual: integer("saldo_atual").notNull().default(0),
  dataUltimaRenovacao: timestamp("data_ultima_renovacao", { withTimezone: true }),
  origem: carteiraOrigemEnum("origem"),
  ...timestamps(),
});

// ── Transação de crédito ─────────────────────────────────────────────────────
export const transacoesCredito = pgTable("transacoes_credito", {
  id: pk(),
  idUsuario: uuid("id_usuario").notNull().references(() => usuarios.id),
  acao: transacaoAcaoEnum("acao").notNull(),
  creditosConsumidos: integer("creditos_consumidos").notNull(),
  data: timestamp("data", { withTimezone: true }).notNull().defaultNow(),
  idRota: uuid("id_rota").references(() => rotas.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Rota (D5: sem ponto_inicio/fim — o app determina a ordem) ────────────────
export const rotas = pgTable("rotas", {
  id: pk(),
  idUsuario: uuid("id_usuario").notNull().references(() => usuarios.id),
  status: rotaStatusEnum("status").notNull().default("planejamento"),
  dataCriacao: timestamp("data_criacao", { withTimezone: true }).notNull().defaultNow(),
  dataInicioExecucao: timestamp("data_inicio_execucao", { withTimezone: true }),
  dataFimExecucao: timestamp("data_fim_execucao", { withTimezone: true }),
  distanciaTotalPlanejada: numeric("distancia_total_planejada", { precision: 12, scale: 2 }),
  distanciaTotalExecutada: numeric("distancia_total_executada", { precision: 12, scale: 2 }),
  tempoTotalPlanejado: integer("tempo_total_planejado"), // segundos
  tempoTotalExecutado: integer("tempo_total_executado"),
  modoOffline: boolean("modo_offline").notNull().default(false),
  ...timestamps(),
});

// ── Parada (D6: ordem_original) ──────────────────────────────────────────────
export const paradas = pgTable("paradas", {
  id: pk(),
  idRota: uuid("id_rota").notNull().references(() => rotas.id),
  enderecoTexto: text("endereco_texto").notNull(),
  latitude: doublePrecision("latitude"), // nulo até geocoding (D4)
  longitude: doublePrecision("longitude"),
  ordemOriginal: integer("ordem_original").notNull(), // ordem de inserção (baseline)
  ordemOtimizada: integer("ordem_otimizada"), // definida pelo otimizador (Sprint 6)
  janelaHorarioInicio: time("janela_horario_inicio"),
  janelaHorarioFim: time("janela_horario_fim"),
  prioridade: prioridadeEnum("prioridade"),
  origemEntrada: paradaOrigemEnum("origem_entrada").notNull().default("manual"),
  status: paradaStatusEnum("status").notNull().default("pendente"),
  descricaoPacote: text("descricao_pacote"),
  ...timestamps(),
});

// ── Captura OCR (regra: nunca vira Parada sem confirmação) ───────────────────
export const capturasOcr = pgTable("capturas_ocr", {
  id: pk(),
  idParada: uuid("id_parada").references(() => paradas.id), // nulo até confirmação
  imagemReferencia: text("imagem_referencia").notNull(), // referência ao storage (G8)
  textoExtraidoBruto: text("texto_extraido_bruto"),
  enderecoConfirmadoPeloUsuario: boolean("endereco_confirmado_pelo_usuario").notNull().default(false),
  dataCaptura: timestamp("data_captura", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Registro de trajeto GPS (só enquanto Rota.status=em_andamento) ────────────
export const registrosTrajetoGps = pgTable("registros_trajeto_gps", {
  id: pk(),
  idRota: uuid("id_rota").notNull().references(() => rotas.id),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

// ── Anúncio (só tier gratuito) ───────────────────────────────────────────────
export const anuncios = pgTable("anuncios", {
  id: pk(),
  idUsuario: uuid("id_usuario").notNull().references(() => usuarios.id),
  dataExibicao: timestamp("data_exibicao", { withTimezone: true }).notNull().defaultNow(),
  telaExibicao: text("tela_exibicao").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
