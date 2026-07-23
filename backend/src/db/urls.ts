/**
 * Finalidade: resolver a URL de conexão do Postgres/PostGIS.
 * Como funciona: lê DATABASE_URL; em dev cai no default do docker-compose.dev (host 5442).
 *   App B2C: isolamento por `id_usuario` na camada de query (sem RLS multi-tenant).
 * Relações: usado por client.ts, migrate.ts, seed.ts e testes.
 */
export const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://rota33:rota33_dev@localhost:5442/rota33_dev";
