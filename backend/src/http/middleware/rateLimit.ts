/**
 * Finalidade: rate limiting (global + login). Store em memória (dívida técnica p/ multi-instância).
 * Relações: consumido pelo app factory.
 */
import rateLimit from "express-rate-limit";
import { config } from "../../config/env";

export interface RateLimitOverrides {
  loginMax?: number;
  globalMax?: number;
  windowMs?: number;
}

export function makeGlobalLimiter(o: RateLimitOverrides = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: o.globalMax ?? config.rateLimit.globalMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: "muitas requisições, tente mais tarde" },
  });
}

export function makeLoginLimiter(o: RateLimitOverrides = {}) {
  return rateLimit({
    windowMs: o.windowMs ?? config.rateLimit.loginWindowMs,
    max: o.loginMax ?? config.rateLimit.loginMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: "muitas tentativas, tente mais tarde" },
  });
}
