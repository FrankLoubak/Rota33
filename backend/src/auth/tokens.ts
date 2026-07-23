/**
 * Finalidade: tokens de sessão (D8) — access JWT curto + refresh opaco revogável.
 * Como funciona: access é JWT; refresh é aleatório, persistido como HMAC em refresh_tokens
 *   com snapshot das claims (para re-emitir no /refresh). Rotação revoga o anterior.
 * Relações: usa db (refresh_tokens) e config; consumido pelas rotas e pelo middleware.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { db } from "../db/client";
import { refreshTokens } from "../db/schema/index";

export interface AccessClaims {
  sub: string;
  emailVerificado: boolean;
}

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign(claims, config.jwt.accessSecret, { expiresIn: config.jwt.accessTtlSeconds });
}
export function verifyAccessToken(token: string): AccessClaims {
  return jwt.verify(token, config.jwt.accessSecret) as AccessClaims;
}

function hashToken(raw: string): string {
  return createHmac("sha256", config.tokenPepper).update(raw).digest("hex");
}

export async function issueRefreshToken(claims: AccessClaims): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await db.insert(refreshTokens).values({
    idUsuario: claims.sub,
    tokenHash: hashToken(raw),
    claims: JSON.stringify(claims),
    expiresAt: new Date(Date.now() + config.jwt.refreshTtlSeconds * 1000),
  });
  return raw;
}

export async function findValidRefreshToken(raw: string) {
  const hash = hashToken(raw);
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;
  const ok = row.tokenHash.length === hash.length && timingSafeEqual(Buffer.from(row.tokenHash), Buffer.from(hash));
  return ok ? row : null;
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, hashToken(raw)));
}

export async function rotateRefreshToken(raw: string): Promise<{ raw: string; claims: AccessClaims } | null> {
  const row = await findValidRefreshToken(raw);
  if (!row) return null;
  await revokeRefreshToken(raw);
  const claims = JSON.parse(row.claims ?? "{}") as AccessClaims;
  return { raw: await issueRefreshToken(claims), claims };
}
