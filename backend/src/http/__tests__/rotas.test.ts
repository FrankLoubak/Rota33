/**
 * Finalidade: teste de integração de Rota/Parada (Sprint 3).
 * Como funciona: cria usuários direto no banco e emite tokens (signAccessToken); exercita
 *   CRUD de rota e paradas com geocoding (provider mock → coords não-nulas), ordem_original
 *   incremental, isolamento por usuário e autorização. Requer o PostGIS de dev.
 * Relações: exercita rotas/rotas, rotaService, geocoding (mock), auth/tokens.
 */
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signAccessToken } from "../../auth/tokens";
import { createApp } from "../../app";
import { db, pool } from "../../db/client";
import { paradas, rotas, usuarios } from "../../db/schema/index";

const app = createApp();
const userIds: string[] = [];
let tokenA = "";
let tokenB = "";

async function novoUsuario(): Promise<string> {
  const [u] = await db
    .insert(usuarios)
    .values({ nome: "U", email: `u-${randomUUID()}@rota33.test`, emailVerificado: true })
    .returning({ id: usuarios.id });
  userIds.push(u.id);
  return u.id;
}

beforeAll(async () => {
  const a = await novoUsuario();
  const b = await novoUsuario();
  tokenA = signAccessToken({ sub: a, emailVerificado: true });
  tokenB = signAccessToken({ sub: b, emailVerificado: true });
});

afterAll(async () => {
  const rs = await db.select({ id: rotas.id }).from(rotas).where(inArray(rotas.idUsuario, userIds));
  const rotaIds = rs.map((r) => r.id);
  if (rotaIds.length) await db.delete(paradas).where(inArray(paradas.idRota, rotaIds));
  await db.delete(rotas).where(inArray(rotas.idUsuario, userIds));
  await db.delete(usuarios).where(inArray(usuarios.id, userIds));
  await pool.end();
});

const A = () => ({ Authorization: `Bearer ${tokenA}` });

describe("Rota e Parada", () => {
  it("sem token → 401", async () => {
    expect((await request(app).get("/rotas")).status).toBe(401);
  });

  it("cria rota e adiciona paradas geocodificadas com ordem_original incremental", async () => {
    const rota = await request(app).post("/rotas").set(A());
    expect(rota.status).toBe(201);
    const rid = rota.body.id;

    const p1 = await request(app).post(`/rotas/${rid}/paradas`).set(A()).send({ enderecoTexto: "Av. Paulista, 1000" });
    expect(p1.status).toBe(201);
    expect(p1.body.latitude).not.toBeNull(); // geocoding mock preencheu
    expect(p1.body.ordemOriginal).toBe(1);

    const p2 = await request(app).post(`/rotas/${rid}/paradas`).set(A()).send({ enderecoTexto: "Rua Augusta, 500", prioridade: "alta", janelaHorarioInicio: "09:00", janelaHorarioFim: "12:00" });
    expect(p2.body.ordemOriginal).toBe(2);
    expect(p2.body.prioridade).toBe("alta");

    const get = await request(app).get(`/rotas/${rid}`).set(A());
    expect(get.body.paradas).toHaveLength(2);
    expect(get.body.paradas[0].ordemOriginal).toBe(1);
  });

  it("edita parada (re-geocoding) e exclui", async () => {
    const rota = await request(app).post("/rotas").set(A());
    const rid = rota.body.id;
    const p = await request(app).post(`/rotas/${rid}/paradas`).set(A()).send({ enderecoTexto: "Endereço X" });
    const upd = await request(app).patch(`/rotas/${rid}/paradas/${p.body.id}`).set(A()).send({ enderecoTexto: "Endereço Y diferente" });
    expect(upd.body.enderecoTexto).toBe("Endereço Y diferente");
    expect(upd.body.latitude).not.toBeNull();
    const del = await request(app).delete(`/rotas/${rid}/paradas/${p.body.id}`).set(A());
    expect(del.status).toBe(200);
    expect((await request(app).get(`/rotas/${rid}`).set(A())).body.paradas).toHaveLength(0);
  });

  it("isolamento: usuário B não acessa rota de A (404)", async () => {
    const rota = await request(app).post("/rotas").set(A());
    const got = await request(app).get(`/rotas/${rota.body.id}`).set({ Authorization: `Bearer ${tokenB}` });
    expect(got.status).toBe(404);
  });

  it("exclui a rota (com paradas)", async () => {
    const rota = await request(app).post("/rotas").set(A());
    await request(app).post(`/rotas/${rota.body.id}/paradas`).set(A()).send({ enderecoTexto: "Z" });
    expect((await request(app).delete(`/rotas/${rota.body.id}`).set(A())).status).toBe(200);
    expect((await request(app).get(`/rotas/${rota.body.id}`).set(A())).status).toBe(404);
  });
});
