/**
 * Finalidade: regras de negócio de Rota e Parada (CRUD manual + geocoding) — Sprint 3.
 * Como funciona: tudo escopado por id_usuario (app B2C, sem RLS). Ao adicionar/editar uma
 *   parada, o endereço em texto é geocodificado (GeocodingProvider — D4) para lat/lng; a
 *   `geog` PostGIS é derivada por coluna gerada. `ordem_original` recebe a ordem de inserção
 *   (D6). D5: a Rota não tem início/fim — o app determina a ordem depois (Sprint 6).
 * Relações: usa db/schema, providers/geocoding; consumido por routes/rotas.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { paradas, rotas } from "../db/schema/index";
import { getGeocodingProvider } from "../providers/geocoding/index";
import { AppError } from "../http/middleware/errors";

const rotaCols = {
  id: rotas.id,
  status: rotas.status,
  dataCriacao: rotas.dataCriacao,
  modoOffline: rotas.modoOffline,
};
const paradaCols = {
  id: paradas.id,
  idRota: paradas.idRota,
  enderecoTexto: paradas.enderecoTexto,
  latitude: paradas.latitude,
  longitude: paradas.longitude,
  ordemOriginal: paradas.ordemOriginal,
  ordemOtimizada: paradas.ordemOtimizada,
  janelaHorarioInicio: paradas.janelaHorarioInicio,
  janelaHorarioFim: paradas.janelaHorarioFim,
  prioridade: paradas.prioridade,
  origemEntrada: paradas.origemEntrada,
  status: paradas.status,
  descricaoPacote: paradas.descricaoPacote,
};

async function rotaDoUsuario(usuarioId: string, rotaId: string) {
  const [r] = await db
    .select({ id: rotas.id, status: rotas.status })
    .from(rotas)
    .where(and(eq(rotas.id, rotaId), eq(rotas.idUsuario, usuarioId)))
    .limit(1);
  if (!r) throw new AppError(404, "rota não encontrada");
  return r;
}

export async function createRota(usuarioId: string) {
  const [r] = await db.insert(rotas).values({ idUsuario: usuarioId }).returning(rotaCols);
  return r;
}

export async function listRotas(usuarioId: string) {
  return db.select(rotaCols).from(rotas).where(eq(rotas.idUsuario, usuarioId)).orderBy(sql`${rotas.dataCriacao} DESC`);
}

export async function getRota(usuarioId: string, rotaId: string) {
  await rotaDoUsuario(usuarioId, rotaId);
  const [r] = await db.select(rotaCols).from(rotas).where(eq(rotas.id, rotaId));
  const ps = await db.select(paradaCols).from(paradas).where(eq(paradas.idRota, rotaId)).orderBy(paradas.ordemOriginal);
  return { ...r, paradas: ps };
}

export async function deleteRota(usuarioId: string, rotaId: string) {
  await rotaDoUsuario(usuarioId, rotaId);
  await db.delete(paradas).where(eq(paradas.idRota, rotaId));
  await db.delete(rotas).where(eq(rotas.id, rotaId));
  return { ok: true };
}

export interface ParadaInput {
  enderecoTexto: string;
  janelaHorarioInicio?: string | null;
  janelaHorarioFim?: string | null;
  prioridade?: "baixa" | "media" | "alta" | null;
  descricaoPacote?: string | null;
  origemEntrada?: "manual" | "foto" | "voz";
}

export async function addParada(usuarioId: string, rotaId: string, input: ParadaInput) {
  const rota = await rotaDoUsuario(usuarioId, rotaId);
  if (rota.status !== "planejamento") throw new AppError(409, "a rota não está em planejamento");

  const coord = await getGeocodingProvider().geocode(input.enderecoTexto);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(paradas)
    .where(eq(paradas.idRota, rotaId));

  const [p] = await db
    .insert(paradas)
    .values({
      idRota: rotaId,
      enderecoTexto: input.enderecoTexto,
      latitude: coord?.lat ?? null,
      longitude: coord?.lng ?? null,
      ordemOriginal: count + 1,
      janelaHorarioInicio: input.janelaHorarioInicio ?? null,
      janelaHorarioFim: input.janelaHorarioFim ?? null,
      prioridade: input.prioridade ?? null,
      descricaoPacote: input.descricaoPacote ?? null,
      origemEntrada: input.origemEntrada ?? "manual",
    })
    .returning(paradaCols);
  return p;
}

export async function updateParada(usuarioId: string, rotaId: string, paradaId: string, input: Partial<ParadaInput>) {
  await rotaDoUsuario(usuarioId, rotaId);
  const [existente] = await db
    .select({ id: paradas.id })
    .from(paradas)
    .where(and(eq(paradas.id, paradaId), eq(paradas.idRota, rotaId)))
    .limit(1);
  if (!existente) throw new AppError(404, "parada não encontrada");

  // Se o endereço mudou, re-geocodifica.
  let coord: { lat: number; lng: number } | null | undefined;
  if (input.enderecoTexto !== undefined) coord = await getGeocodingProvider().geocode(input.enderecoTexto);

  const [p] = await db
    .update(paradas)
    .set({
      ...(input.enderecoTexto !== undefined ? { enderecoTexto: input.enderecoTexto, latitude: coord?.lat ?? null, longitude: coord?.lng ?? null } : {}),
      ...(input.janelaHorarioInicio !== undefined ? { janelaHorarioInicio: input.janelaHorarioInicio } : {}),
      ...(input.janelaHorarioFim !== undefined ? { janelaHorarioFim: input.janelaHorarioFim } : {}),
      ...(input.prioridade !== undefined ? { prioridade: input.prioridade } : {}),
      ...(input.descricaoPacote !== undefined ? { descricaoPacote: input.descricaoPacote } : {}),
      updatedAt: new Date(),
    })
    .where(eq(paradas.id, paradaId))
    .returning(paradaCols);
  return p;
}

export async function deleteParada(usuarioId: string, rotaId: string, paradaId: string) {
  await rotaDoUsuario(usuarioId, rotaId);
  await db.delete(paradas).where(and(eq(paradas.id, paradaId), eq(paradas.idRota, rotaId)));
  return { ok: true };
}
