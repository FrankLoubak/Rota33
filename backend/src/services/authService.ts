/**
 * Finalidade: regras de negócio de autenticação (D8-D11).
 * Como funciona: cadastro (e-mail/senha) com verificação de e-mail; login; reset de senha;
 *   login social via SocialAuthVerifier; sessão JWT (access+refresh); exclusão de conta com
 *   anonimização de PII + soft-delete (LGPD/G7). Envio de e-mail via EmailProvider.
 * Relações: usa db/schema, auth/* (password, tokens, emailTokens), providers (email/social).
 */
import { and, eq, isNull } from "drizzle-orm";
import { config } from "../config/env";
import { db } from "../db/client";
import { assinaturas, carteirasCreditos, refreshTokens, usuarios } from "../db/schema/index";
import { createEmailToken, consumeEmailToken } from "../auth/emailTokens";
import { hashPassword, verifyPassword } from "../auth/password";
import { issueRefreshToken, signAccessToken, type AccessClaims } from "../auth/tokens";
import { getEmailProvider } from "../providers/email/index";
import { getSocialVerifier, type ProvedorSocial } from "../providers/social/index";
import { AppError } from "../http/middleware/errors";

const pub = {
  id: usuarios.id,
  nome: usuarios.nome,
  email: usuarios.email,
  provedorLogin: usuarios.provedorLogin,
  emailVerificado: usuarios.emailVerificado,
};

function claimsDe(u: { id: string; emailVerificado: boolean }): AccessClaims {
  return { sub: u.id, emailVerificado: u.emailVerificado };
}

async function sessao(u: { id: string; emailVerificado: boolean }) {
  const claims = claimsDe(u);
  return { accessToken: signAccessToken(claims), refreshToken: await issueRefreshToken(claims) };
}

async function enviarVerificacao(idUsuario: string, email: string) {
  const raw = await createEmailToken(idUsuario, "verificacao");
  const link = `${config.appBaseUrl}/verificar-email?token=${raw}`;
  await getEmailProvider().sendEmail(email, "Confirme seu e-mail — Rota33", `Confirme seu e-mail: ${link}`);
}

export async function register(input: { nome: string; email: string; senha: string }) {
  const existente = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, input.email)).limit(1);
  if (existente.length) throw new AppError(409, "e-mail já cadastrado");

  const [u] = await db
    .insert(usuarios)
    .values({ nome: input.nome, email: input.email, senhaHash: await hashPassword(input.senha), provedorLogin: "email" })
    .returning(pub);
  // Bootstrap: carteira + assinatura gratuita (créditos são tratados no Sprint 9).
  await db.insert(carteirasCreditos).values({ idUsuario: u.id, saldoAtual: 0 });
  await db.insert(assinaturas).values({ idUsuario: u.id, tier: "gratuito", limiteCreditosPeriodo: 0 });
  await enviarVerificacao(u.id, u.email);
  return { usuario: u, ...(await sessao(u)) };
}

export async function login(email: string, senha: string) {
  const [u] = await db
    .select({ ...pub, senhaHash: usuarios.senhaHash })
    .from(usuarios)
    .where(and(eq(usuarios.email, email), isNull(usuarios.deletedAt)))
    .limit(1);
  if (!u || !u.senhaHash || !(await verifyPassword(u.senhaHash, senha))) {
    throw new AppError(401, "credenciais inválidas");
  }
  return { usuario: { id: u.id, nome: u.nome, email: u.email, emailVerificado: u.emailVerificado }, ...(await sessao(u)) };
}

export async function verifyEmail(rawToken: string) {
  const idUsuario = await consumeEmailToken(rawToken, "verificacao");
  if (!idUsuario) throw new AppError(400, "token inválido ou expirado");
  await db.update(usuarios).set({ emailVerificado: true, updatedAt: new Date() }).where(eq(usuarios.id, idUsuario));
  return { ok: true };
}

export async function requestPasswordReset(email: string) {
  const [u] = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(and(eq(usuarios.email, email), isNull(usuarios.deletedAt)))
    .limit(1);
  // Sempre responde ok (evita enumeração de e-mails).
  if (u) {
    const raw = await createEmailToken(u.id, "reset");
    const link = `${config.appBaseUrl}/redefinir-senha?token=${raw}`;
    await getEmailProvider().sendEmail(email, "Redefinição de senha — Rota33", `Redefina sua senha: ${link}`);
  }
  return { ok: true };
}

export async function resetPassword(rawToken: string, novaSenha: string) {
  const idUsuario = await consumeEmailToken(rawToken, "reset");
  if (!idUsuario) throw new AppError(400, "token inválido ou expirado");
  await db.update(usuarios).set({ senhaHash: await hashPassword(novaSenha), updatedAt: new Date() }).where(eq(usuarios.id, idUsuario));
  // Revoga sessões existentes por segurança.
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.idUsuario, idUsuario));
  return { ok: true };
}

export async function socialLogin(provedor: ProvedorSocial, idToken: string) {
  const perfil = await getSocialVerifier().verify(provedor, idToken);
  if (!perfil) throw new AppError(401, "token social inválido");
  const [existente] = await db
    .select({ ...pub, deletedAt: usuarios.deletedAt })
    .from(usuarios)
    .where(eq(usuarios.email, perfil.email))
    .limit(1);

  let u: { id: string; nome: string; email: string; emailVerificado: boolean };
  if (existente && !existente.deletedAt) {
    u = { id: existente.id, nome: existente.nome, email: existente.email, emailVerificado: existente.emailVerificado };
  } else {
    const [novo] = await db
      .insert(usuarios)
      .values({ nome: perfil.nome ?? perfil.email, email: perfil.email, provedorLogin: provedor, emailVerificado: true })
      .returning(pub);
    await db.insert(carteirasCreditos).values({ idUsuario: novo.id, saldoAtual: 0 });
    await db.insert(assinaturas).values({ idUsuario: novo.id, tier: "gratuito", limiteCreditosPeriodo: 0 });
    u = { id: novo.id, nome: novo.nome, email: novo.email, emailVerificado: novo.emailVerificado };
  }
  return { usuario: u, ...(await sessao(u)) };
}

// Exclusão de conta (G7/D11): anonimiza PII + soft-delete; revoga sessões.
export async function deleteAccount(idUsuario: string) {
  await db
    .update(usuarios)
    .set({
      nome: "(conta excluída)",
      email: `deleted-${idUsuario}@anonimizado.local`,
      senhaHash: null,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(usuarios.id, idUsuario));
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.idUsuario, idUsuario));
  return { ok: true };
}
