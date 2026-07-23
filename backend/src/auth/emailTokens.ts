/**
 * Finalidade: tokens de verificação de e-mail e reset de senha (D10).
 * Como funciona: gera token aleatório; persiste apenas o HMAC em email_tokens com expiração;
 *   consumir valida hash+tipo+validade e marca consumed_at (uso único).
 * Relações: usado pelo authService; e-mail enviado via EmailProvider.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { config } from "../config/env";
import { db } from "../db/client";
import { emailTokens } from "../db/schema/index";

type Tipo = "verificacao" | "reset";

function hash(raw: string): string {
  return createHmac("sha256", config.tokenPepper).update(raw).digest("hex");
}

export async function createEmailToken(idUsuario: string, tipo: Tipo): Promise<string> {
  const raw = randomBytes(24).toString("base64url");
  const ttl = tipo === "verificacao" ? config.email.verifyTtlSeconds : config.email.resetTtlSeconds;
  await db.insert(emailTokens).values({
    idUsuario,
    tipo,
    tokenHash: hash(raw),
    expiresAt: new Date(Date.now() + ttl * 1000),
  });
  return raw;
}

// Valida e consome (uso único). Retorna o id do usuário ou null.
export async function consumeEmailToken(raw: string, tipo: Tipo): Promise<string | null> {
  const h = hash(raw);
  const [row] = await db
    .select()
    .from(emailTokens)
    .where(
      and(
        eq(emailTokens.tokenHash, h),
        eq(emailTokens.tipo, tipo),
        isNull(emailTokens.consumedAt),
        gt(emailTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row) return null;
  const ok = row.tokenHash.length === h.length && timingSafeEqual(Buffer.from(row.tokenHash), Buffer.from(h));
  if (!ok) return null;
  await db.update(emailTokens).set({ consumedAt: new Date() }).where(eq(emailTokens.id, row.id));
  return row.idUsuario;
}
