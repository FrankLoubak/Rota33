/**
 * Finalidade: aplicar as migrations do Drizzle (inclui a habilitação do PostGIS e as
 *   colunas geográficas geradas).
 * Como funciona: usa o migrator do drizzle-orm sobre a pasta ./drizzle, com DATABASE_URL.
 * Relações: consome ./drizzle; rodar via `npm run db:migrate` (exige o Postgres/PostGIS de pé).
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { DATABASE_URL } from "./urls";

const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await pool.end();
  // eslint-disable-next-line no-console
  console.log("migrations aplicadas com sucesso");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("falha ao aplicar migrations:", err);
  process.exit(1);
});
