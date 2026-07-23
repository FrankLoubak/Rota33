/**
 * Finalidade: teste de integração da autenticação (Sprint 2).
 * Como funciona: exercita cadastro, verificação de e-mail, login, reset de senha, login
 *   social (mock), sessão (refresh/logout), exclusão anonimizada e rate limiting — via
 *   supertest. O link/token de e-mail é lido do EmailProvider de log. Requer o PostGIS de dev.
 * Relações: exercita app, rotas/auth, authService, providers (email/social).
 */
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { db, pool } from "../../db/client";
import { assinaturas, carteirasCreditos, emailTokens, refreshTokens, usuarios } from "../../db/schema/index";
import { lastEmailTo } from "../../providers/email/index";

const app = createApp();
const ids: string[] = [];
const email = () => `test-${randomUUID()}@rota33.test`;
const tokenDoEmail = (corpo: string | undefined) => /token=([^\s]+)/.exec(corpo ?? "")?.[1] ?? "";

async function novoCadastro() {
  const e = email();
  const r = await request(app).post("/auth/register").send({ nome: "Teste", email: e, senha: "Senha@123" });
  if (r.body?.usuario?.id) ids.push(r.body.usuario.id);
  return { e, r };
}

afterAll(async () => {
  if (ids.length) {
    await db.delete(emailTokens).where(inArray(emailTokens.idUsuario, ids));
    await db.delete(refreshTokens).where(inArray(refreshTokens.idUsuario, ids));
    await db.delete(carteirasCreditos).where(inArray(carteirasCreditos.idUsuario, ids));
    await db.delete(assinaturas).where(inArray(assinaturas.idUsuario, ids));
    await db.delete(usuarios).where(inArray(usuarios.id, ids));
  }
  await pool.end();
});

describe("Auth", () => {
  it("cadastro emite token + cria carteira/assinatura; /me exige token", async () => {
    const { r } = await novoCadastro();
    expect(r.status).toBe(201);
    expect(r.body.accessToken).toBeTruthy();
    expect(r.headers["set-cookie"]).toBeTruthy();
    expect((await request(app).get("/auth/me")).status).toBe(401);
    const me = await request(app).get("/auth/me").set("Authorization", `Bearer ${r.body.accessToken}`);
    expect(me.body.auth.sub).toBe(r.body.usuario.id);
  });

  it("verificação de e-mail via token enviado", async () => {
    const { e, r } = await novoCadastro();
    const token = tokenDoEmail(lastEmailTo(e));
    expect(token.length).toBeGreaterThan(10);
    const v = await request(app).post("/auth/verify-email").send({ token });
    expect(v.status).toBe(200);
    const [u] = await db.select({ ev: usuarios.emailVerificado }).from(usuarios).where(eq(usuarios.id, r.body.usuario.id));
    expect(u.ev).toBe(true);
    // token de uso único
    expect((await request(app).post("/auth/verify-email").send({ token })).status).toBe(400);
  });

  it("login ok; senha errada 401; e-mail duplicado 409", async () => {
    const { e } = await novoCadastro();
    expect((await request(app).post("/auth/login").send({ email: e, senha: "Senha@123" })).status).toBe(200);
    expect((await request(app).post("/auth/login").send({ email: e, senha: "errada" })).status).toBe(401);
    const dup = await request(app).post("/auth/register").send({ nome: "X", email: e, senha: "Senha@123" });
    expect(dup.status).toBe(409);
  });

  it("reset de senha por e-mail", async () => {
    const { e } = await novoCadastro();
    await request(app).post("/auth/request-reset").send({ email: e });
    const token = tokenDoEmail(lastEmailTo(e));
    const reset = await request(app).post("/auth/reset").send({ token, senha: "NovaSenha@1" });
    expect(reset.status).toBe(200);
    expect((await request(app).post("/auth/login").send({ email: e, senha: "NovaSenha@1" })).status).toBe(200);
    expect((await request(app).post("/auth/login").send({ email: e, senha: "Senha@123" })).status).toBe(401);
  });

  it("login social (mock) cria e reusa o usuário", async () => {
    const e = `social-${randomUUID()}@rota33.test`;
    const r1 = await request(app).post("/auth/social").send({ provedor: "google", idToken: `mock:${e}:Fulano` });
    expect(r1.status).toBe(200);
    ids.push(r1.body.usuario.id);
    expect(r1.body.usuario.emailVerificado).toBe(true);
    const r2 = await request(app).post("/auth/social").send({ provedor: "google", idToken: `mock:${e}` });
    expect(r2.body.usuario.id).toBe(r1.body.usuario.id);
  });

  it("refresh rotaciona e logout revoga", async () => {
    const { r } = await novoCadastro();
    const cookie = r.headers["set-cookie"];
    const refreshed = await request(app).post("/auth/refresh").set("Cookie", cookie);
    expect(refreshed.status).toBe(200);
    expect((await request(app).post("/auth/refresh").set("Cookie", cookie)).status).toBe(401); // antigo revogado
    const novoCookie = refreshed.headers["set-cookie"];
    await request(app).post("/auth/logout").set("Cookie", novoCookie);
    expect((await request(app).post("/auth/refresh").set("Cookie", novoCookie)).status).toBe(401);
  });

  it("exclusão de conta anonimiza e impede login", async () => {
    const { e, r } = await novoCadastro();
    const del = await request(app).delete("/auth/me").set("Authorization", `Bearer ${r.body.accessToken}`);
    expect(del.status).toBe(200);
    expect((await request(app).post("/auth/login").send({ email: e, senha: "Senha@123" })).status).toBe(401);
    const [u] = await db.select({ email: usuarios.email, del: usuarios.deletedAt }).from(usuarios).where(eq(usuarios.id, r.body.usuario.id));
    expect(u.del).not.toBeNull();
    expect(u.email).toContain("anonimizado.local");
  });

  it("rate limiting no login (429)", async () => {
    const limited = createApp({ rateLimit: { loginMax: 2, windowMs: 60_000 } });
    await request(limited).post("/auth/login").send({ email: "x@x.com", senha: "x" });
    await request(limited).post("/auth/login").send({ email: "x@x.com", senha: "x" });
    expect((await request(limited).post("/auth/login").send({ email: "x@x.com", senha: "x" })).status).toBe(429);
  });
});
