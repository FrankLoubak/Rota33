/**
 * Finalidade: teste de integração do schema (Sprint 1) — FKs, colunas geradas e PostGIS.
 * Como funciona: cria usuário → rota → paradas com/sem coordenadas; verifica que a coluna
 *   `geog` é gerada a partir de lat/lng (nula sem coord) e que uma consulta espacial
 *   (ST_Distance) funciona. Requer o Postgres/PostGIS de dev (docker-compose.dev, host 5442).
 * Relações: exercita schema/tables, client (Drizzle) e a migration 0001 (PostGIS).
 */
import { randomUUID } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, pool } from "../client";
import { paradas, rotas, usuarios } from "../schema/index";

let usuarioId: string;
let rotaId: string;

beforeAll(async () => {
  const [u] = await db
    .insert(usuarios)
    .values({ nome: "Teste", email: `t-${randomUUID()}@rota33.local` })
    .returning();
  usuarioId = u.id;
  const [r] = await db.insert(rotas).values({ idUsuario: usuarioId }).returning();
  rotaId = r.id;
});

afterAll(async () => {
  await db.delete(paradas).where(eq(paradas.idRota, rotaId));
  await db.delete(rotas).where(eq(rotas.id, rotaId));
  await db.delete(usuarios).where(eq(usuarios.id, usuarioId));
  await pool.end();
});

describe("Schema Rota33 + PostGIS", () => {
  it("cria paradas com ordem_original e geog gerado a partir de lat/lng", async () => {
    // Duas paradas com coordenadas (São Paulo) e uma sem coordenadas.
    const [p1] = await db
      .insert(paradas)
      .values({ idRota: rotaId, enderecoTexto: "A", ordemOriginal: 1, latitude: -23.55052, longitude: -46.63331 })
      .returning();
    await db
      .insert(paradas)
      .values({ idRota: rotaId, enderecoTexto: "B", ordemOriginal: 2, latitude: -23.5613, longitude: -46.6565 });
    const [p3] = await db
      .insert(paradas)
      .values({ idRota: rotaId, enderecoTexto: "C (sem coord)", ordemOriginal: 3 })
      .returning();

    // geog é gerado quando há lat/lng; nulo quando não há.
    const comGeog = await db.execute(sql`SELECT geog IS NOT NULL AS tem FROM paradas WHERE id = ${p1.id}`);
    expect((comGeog.rows[0] as { tem: boolean }).tem).toBe(true);
    const semGeog = await db.execute(sql`SELECT geog IS NULL AS vazio FROM paradas WHERE id = ${p3.id}`);
    expect((semGeog.rows[0] as { vazio: boolean }).vazio).toBe(true);
  });

  it("consulta espacial (ST_Distance) funciona sobre geog", async () => {
    const res = await db.execute(sql`
      SELECT ST_Distance(a.geog, b.geog) AS dist_m
      FROM paradas a JOIN paradas b ON a.id_rota = b.id_rota
      WHERE a.id_rota = ${rotaId} AND a.endereco_texto = 'A' AND b.endereco_texto = 'B'
    `);
    const dist = Number((res.rows[0] as { dist_m: number }).dist_m);
    // A e B distam ~centenas de metros / poucos km em São Paulo.
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(50000);
  });

  it("respeita a FK de paradas → rotas (rota inexistente falha)", async () => {
    await expect(
      db.insert(paradas).values({ idRota: randomUUID(), enderecoTexto: "X", ordemOriginal: 1 }),
    ).rejects.toThrow();
  });

  it("lista paradas da rota sem coordenadas (pendentes de geocoding)", async () => {
    const pendentes = await db
      .select({ id: paradas.id })
      .from(paradas)
      .where(and(eq(paradas.idRota, rotaId), isNull(paradas.latitude)));
    expect(pendentes.length).toBeGreaterThanOrEqual(1);
  });
});
