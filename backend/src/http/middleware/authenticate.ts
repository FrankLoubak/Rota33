/**
 * Finalidade: middleware que autentica requisições via access token (JWT — D8).
 * Como funciona: lê Authorization: Bearer, verifica o token e injeta req.auth.
 * Relações: usa auth/tokens; consumido pelas rotas protegidas.
 */
import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken, type AccessClaims } from "../../auth/tokens";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessClaims;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ erro: "token ausente" });
    return;
  }
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ erro: "token inválido ou expirado" });
  }
}
