/**
 * Finalidade: cliente Drizzle do backend (Postgres/PostGIS).
 * Como funciona: cria um pool a partir de DATABASE_URL e expõe `db` tipado pelo schema.
 *   Isolamento por `id_usuario` é feito na camada de query (app B2C; sem RLS).
 * Relações: usa schema/index e urls.ts; consumido pelos serviços a partir do Sprint 2.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index";
import { DATABASE_URL } from "./urls";

const { Pool } = pg;
export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });
