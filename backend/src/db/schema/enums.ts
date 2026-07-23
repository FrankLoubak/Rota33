/**
 * Finalidade: enums PostgreSQL do domínio Rota33 (seção 4 do CLAUDE.md).
 * Como funciona: cada pgEnum vira um tipo no banco; as tabelas os referenciam.
 * Relações: consumido por tables.ts.
 */
import { pgEnum } from "drizzle-orm/pg-core";

export const provedorLoginEnum = pgEnum("provedor_login", ["email", "google", "apple"]);
export const assinaturaTierEnum = pgEnum("assinatura_tier", ["gratuito", "pago_1", "pago_2", "pago_3"]);
export const assinaturaStatusEnum = pgEnum("assinatura_status", ["ativa", "atrasada", "cancelada"]);
export const carteiraOrigemEnum = pgEnum("carteira_origem", ["renovacao_tier", "compra_avulsa"]);
export const transacaoAcaoEnum = pgEnum("transacao_acao", [
  "adicionar_ponto_manual",
  "adicionar_ponto_voz",
  "adicionar_ponto_foto",
  "otimizar_rota",
  "reotimizar_rota",
]);
export const rotaStatusEnum = pgEnum("rota_status", ["planejamento", "em_andamento", "concluida", "cancelada"]);
export const paradaOrigemEnum = pgEnum("parada_origem", ["manual", "foto", "voz"]);
export const paradaStatusEnum = pgEnum("parada_status", ["pendente", "concluida", "pulada"]);
export const prioridadeEnum = pgEnum("prioridade", ["baixa", "media", "alta"]);
export const emailTokenTipoEnum = pgEnum("email_token_tipo", ["verificacao", "reset"]);
