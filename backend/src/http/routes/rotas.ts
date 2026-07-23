/**
 * Finalidade: rotas REST de Rota e Parada (CRUD manual + geocoding) — Sprint 3.
 * Como funciona: exige usuário autenticado; escopa tudo por req.auth.sub. Paradas são
 *   geocodificadas no serviço. Valida payloads com zod.
 * Relações: montada em app.ts sob authenticate; usa rotaService.
 */
import { Router, type Request } from "express";
import { z } from "zod";
import {
  addParada,
  createRota,
  deleteParada,
  deleteRota,
  getRota,
  listRotas,
  updateParada,
} from "../../services/rotaService";
import { AppError, asyncHandler, validateBody } from "../middleware/errors";

const paradaSchema = z.object({
  enderecoTexto: z.string().min(1),
  janelaHorarioInicio: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  janelaHorarioFim: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  prioridade: z.enum(["baixa", "media", "alta"]).optional().nullable(),
  descricaoPacote: z.string().optional().nullable(),
  origemEntrada: z.enum(["manual", "foto", "voz"]).optional(),
});
const paradaUpdateSchema = paradaSchema.partial();

function sub(req: Request): string {
  const s = req.auth?.sub;
  if (!s) throw new AppError(401, "não autenticado");
  return s;
}
function id(raw: unknown): string {
  const p = z.string().uuid().safeParse(raw);
  if (!p.success) throw new AppError(400, "id inválido");
  return p.data;
}

export function rotasRouter(): Router {
  const router = Router();

  router.get("/", asyncHandler(async (req, res) => res.json(await listRotas(sub(req)))));
  router.post("/", asyncHandler(async (req, res) => res.status(201).json(await createRota(sub(req)))));
  router.get("/:id", asyncHandler(async (req, res) => res.json(await getRota(sub(req), id(req.params.id)))));
  router.delete("/:id", asyncHandler(async (req, res) => res.json(await deleteRota(sub(req), id(req.params.id)))));

  router.post(
    "/:id/paradas",
    asyncHandler(async (req, res) => {
      const input = validateBody(paradaSchema, req.body);
      res.status(201).json(await addParada(sub(req), id(req.params.id), input));
    }),
  );
  router.patch(
    "/:id/paradas/:paradaId",
    asyncHandler(async (req, res) => {
      const input = validateBody(paradaUpdateSchema, req.body);
      res.json(await updateParada(sub(req), id(req.params.id), id(req.params.paradaId), input));
    }),
  );
  router.delete(
    "/:id/paradas/:paradaId",
    asyncHandler(async (req, res) => {
      res.json(await deleteParada(sub(req), id(req.params.id), id(req.params.paradaId)));
    }),
  );

  return router;
}
