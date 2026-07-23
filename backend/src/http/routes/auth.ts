/**
 * Finalidade: rotas de autenticação (cadastro, login, social, verificação, reset, sessão).
 * Como funciona: e-mail/senha e login social emitem access token (JWT) + refresh (cookie
 *   httpOnly). Verificação de e-mail e reset via token enviado por e-mail (EmailProvider).
 *   /me e DELETE /me exigem autenticação (exclusão anonimiza a conta — D11).
 * Relações: usa authService, middlewares (authenticate, rateLimit, errors).
 */
import { Router, type Response } from "express";
import { z } from "zod";
import {
  deleteAccount,
  login,
  register,
  requestPasswordReset,
  resetPassword,
  socialLogin,
  verifyEmail,
} from "../../services/authService";
import { rotateRefreshToken, revokeRefreshToken } from "../../auth/tokens";
import { config } from "../../config/env";
import { signAccessToken } from "../../auth/tokens";
import { authenticate } from "../middleware/authenticate";
import { AppError, asyncHandler, validateBody } from "../middleware/errors";
import { makeLoginLimiter, type RateLimitOverrides } from "../middleware/rateLimit";

const COOKIE = "refresh_token";
function setCookie(res: Response, raw: string) {
  res.cookie(COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProd,
    path: "/",
    maxAge: config.jwt.refreshTtlSeconds * 1000,
  });
}

const registerSchema = z.object({ nome: z.string().min(1), email: z.string().email(), senha: z.string().min(8) });
const loginSchema = z.object({ email: z.string().email(), senha: z.string().min(1) });
const socialSchema = z.object({ provedor: z.enum(["google", "apple"]), idToken: z.string().min(1) });
const tokenSchema = z.object({ token: z.string().min(10) });
const resetSchema = z.object({ token: z.string().min(10), senha: z.string().min(8) });
const emailSchema = z.object({ email: z.string().email() });

export function authRouter(rl: RateLimitOverrides = {}): Router {
  const router = Router();
  const loginLimiter = makeLoginLimiter(rl);

  router.post("/register", loginLimiter, asyncHandler(async (req, res) => {
    const input = validateBody(registerSchema, req.body);
    const r = await register(input);
    setCookie(res, r.refreshToken);
    res.status(201).json({ usuario: r.usuario, accessToken: r.accessToken });
  }));

  router.post("/login", loginLimiter, asyncHandler(async (req, res) => {
    const { email, senha } = validateBody(loginSchema, req.body);
    const r = await login(email, senha);
    setCookie(res, r.refreshToken);
    res.json({ usuario: r.usuario, accessToken: r.accessToken });
  }));

  router.post("/social", loginLimiter, asyncHandler(async (req, res) => {
    const { provedor, idToken } = validateBody(socialSchema, req.body);
    const r = await socialLogin(provedor, idToken);
    setCookie(res, r.refreshToken);
    res.json({ usuario: r.usuario, accessToken: r.accessToken });
  }));

  router.post("/verify-email", asyncHandler(async (req, res) => {
    const { token } = validateBody(tokenSchema, req.body);
    res.json(await verifyEmail(token));
  }));

  router.post("/request-reset", asyncHandler(async (req, res) => {
    const { email } = validateBody(emailSchema, req.body);
    res.json(await requestPasswordReset(email));
  }));

  router.post("/reset", asyncHandler(async (req, res) => {
    const { token, senha } = validateBody(resetSchema, req.body);
    res.json(await resetPassword(token, senha));
  }));

  router.post("/refresh", asyncHandler(async (req, res) => {
    const raw = req.cookies?.[COOKIE];
    if (!raw) throw new AppError(401, "refresh ausente");
    const rotated = await rotateRefreshToken(raw);
    if (!rotated) throw new AppError(401, "refresh inválido");
    setCookie(res, rotated.raw);
    res.json({ accessToken: signAccessToken(rotated.claims) });
  }));

  router.post("/logout", asyncHandler(async (req, res) => {
    const raw = req.cookies?.[COOKIE];
    if (raw) await revokeRefreshToken(raw);
    res.clearCookie(COOKIE, { path: "/" });
    res.json({ ok: true });
  }));

  router.get("/me", authenticate, (req, res) => res.json({ auth: req.auth }));

  router.delete("/me", authenticate, asyncHandler(async (req, res) => {
    await deleteAccount(req.auth!.sub);
    res.clearCookie(COOKIE, { path: "/" });
    res.json({ ok: true });
  }));

  return router;
}
