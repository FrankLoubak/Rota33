/**
 * Finalidade: montagem da aplicação Express (factory), reutilizável em dev e testes.
 * Como funciona: JSON, cookies, rate limit global, healthcheck, rotas de auth e errorHandler.
 * Relações: consumido por index.ts e pelos testes (supertest). Rotas de negócio entram no Sprint 3.
 */
import cookieParser from "cookie-parser";
import express from "express";
import { errorHandler } from "./http/middleware/errors";
import { makeGlobalLimiter, type RateLimitOverrides } from "./http/middleware/rateLimit";
import { authRouter } from "./http/routes/auth";

export function createApp(opts: { rateLimit?: RateLimitOverrides } = {}) {
  const app = express();
  app.set("trust proxy", 1);
  app.use(makeGlobalLimiter(opts.rateLimit));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "rota33-backend" }));

  app.use("/auth", authRouter(opts.rateLimit));

  app.use(errorHandler);
  return app;
}
